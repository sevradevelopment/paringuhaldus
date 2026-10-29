import type Stripe from "stripe";
import { Prisma } from "@prisma/client";
import type {
  BillingInterval,
  OrganizationPlan,
  SubscriptionStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { planFromStripePriceId } from "@/lib/stripe/client";

function mapSubscriptionStatus(
  status: Stripe.Subscription.Status,
): SubscriptionStatus {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    case "incomplete":
    case "incomplete_expired":
      return "INCOMPLETE";
    case "unpaid":
      return "UNPAID";
    default:
      return "NONE";
  }
}

function planFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
): OrganizationPlan | null {
  const plan = metadata?.plan;
  if (plan === "STARTER" || plan === "BUSINESS" || plan === "PRO") return plan;
  return null;
}

function intervalFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
): BillingInterval | null {
  const interval = metadata?.interval;
  if (interval === "MONTHLY" || interval === "YEARLY") return interval;
  return null;
}

/** Prefer price.id → STRIPE_PRICE_*; metadata only as logged fallback. */
function resolvePlanAndInterval(input: {
  priceId: string | null | undefined;
  metadata: Stripe.Metadata | null | undefined;
  fallbackPlan?: OrganizationPlan;
}): {
  plan: OrganizationPlan;
  interval: BillingInterval | null;
  source: "price" | "metadata" | "fallback";
} {
  const fromPrice = planFromStripePriceId(input.priceId);
  if (fromPrice) {
    return {
      plan: fromPrice.plan,
      interval: fromPrice.interval,
      source: "price",
    };
  }

  const metaPlan = planFromMetadata(input.metadata);
  const metaInterval = intervalFromMetadata(input.metadata);
  if (metaPlan) {
    console.warn(
      "[stripe.webhook] plan from metadata fallback (price.id not mapped to STRIPE_PRICE_*)",
      { priceId: input.priceId, plan: metaPlan, interval: metaInterval },
    );
    return { plan: metaPlan, interval: metaInterval, source: "metadata" };
  }

  const fallback = input.fallbackPlan ?? "STARTER";
  console.warn("[stripe.webhook] plan fallback (no price map, no metadata)", {
    priceId: input.priceId,
    fallback,
  });
  return { plan: fallback, interval: metaInterval, source: "fallback" };
}

function subscriptionPeriodEnd(
  subscription: Stripe.Subscription,
): Date | null {
  const item = subscription.items?.data?.[0];
  const periodEndUnix =
    (
      subscription as Stripe.Subscription & {
        current_period_end?: number;
      }
    ).current_period_end ??
    (item as { current_period_end?: number } | undefined)?.current_period_end ??
    subscription.ended_at ??
    null;
  return periodEndUnix ? new Date(periodEndUnix * 1000) : null;
}

function subscriptionPriceId(
  subscription: Stripe.Subscription,
): string | undefined {
  return subscription.items?.data?.[0]?.price?.id;
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const legacy = (
    invoice as Stripe.Invoice & {
      subscription?: string | { id?: string } | null;
    }
  ).subscription;
  if (typeof legacy === "string") return legacy;
  if (legacy && typeof legacy === "object" && typeof legacy.id === "string") {
    return legacy.id;
  }

  const parent = (
    invoice as Stripe.Invoice & {
      parent?: {
        subscription_details?: { subscription?: string | { id?: string } };
      } | null;
    }
  ).parent;
  const fromParent = parent?.subscription_details?.subscription;
  if (typeof fromParent === "string") return fromParent;
  if (
    fromParent &&
    typeof fromParent === "object" &&
    typeof fromParent.id === "string"
  ) {
    return fromParent.id;
  }
  return null;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

/**
 * Atomically claim the event id (unique PK). Concurrent deliveries: only one
 * claim succeeds; the other returns duplicate without re-processing.
 * On handler failure the claim is released so Stripe can retry.
 */
async function claimEvent(event: Stripe.Event): Promise<boolean> {
  try {
    await prisma.stripeEvent.create({
      data: {
        id: event.id,
        type: event.type,
        payload: event as unknown as object,
      },
    });
    return true;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return false;
    }
    throw error;
  }
}

async function releaseClaim(eventId: string) {
  try {
    await prisma.stripeEvent.delete({ where: { id: eventId } });
  } catch (error) {
    console.error("[stripe.webhook] failed to release event claim", eventId, error);
  }
}

async function syncOrganizationFromSubscription(
  subscription: Stripe.Subscription,
  organizationIdHint?: string | null,
) {
  const organizationId =
    organizationIdHint || subscription.metadata?.organizationId || null;
  const org =
    (organizationId
      ? await prisma.organization.findUnique({
          where: { id: organizationId },
        })
      : null) ||
    (await prisma.organization.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    }));

  if (!org) {
    console.warn("[stripe.webhook] org not found for subscription", {
      subscriptionId: subscription.id,
      organizationId,
    });
    return;
  }

  const status = mapSubscriptionStatus(subscription.status);
  const priceId = subscriptionPriceId(subscription);
  const resolved = resolvePlanAndInterval({
    priceId,
    metadata: subscription.metadata,
    fallbackPlan:
      status === "ACTIVE" || status === "TRIALING" ? org.plan : "STARTER",
  });
  const periodEnd = subscriptionPeriodEnd(subscription);

  const inactive =
    status === "CANCELED" ||
    status === "UNPAID" ||
    status === "NONE" ||
    status === "INCOMPLETE";

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      subscriptionStatus: status,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId ?? org.stripePriceId,
      currentPeriodEnd: periodEnd,
      billingInterval: resolved.interval ?? org.billingInterval,
      plan: inactive ? "STARTER" : resolved.plan,
      ...(customerId ? { stripeCustomerId: customerId } : {}),
    },
  });
}

async function processStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId =
        session.metadata?.organizationId ||
        (typeof session.client_reference_id === "string"
          ? session.client_reference_id
          : null);
      if (!organizationId) break;

      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null;

      if (subscriptionId) {
        const { getStripe } = await import("@/lib/stripe/client");
        const stripe = getStripe();
        if (stripe) {
          try {
            const subscription =
              await stripe.subscriptions.retrieve(subscriptionId);
            await syncOrganizationFromSubscription(
              subscription,
              organizationId,
            );
            break;
          } catch (error) {
            console.error(
              "[stripe.webhook] subscription retrieve failed; falling back to session fields",
              error,
            );
          }
        }
      }

      // Fallback when subscription retrieve is unavailable
      const priceIdFromSession = undefined;
      const resolved = resolvePlanAndInterval({
        priceId: priceIdFromSession,
        metadata: session.metadata,
        fallbackPlan: "STARTER",
      });

      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          plan: resolved.plan,
          billingInterval: resolved.interval ?? undefined,
          stripeCustomerId:
            typeof session.customer === "string"
              ? session.customer
              : undefined,
          stripeSubscriptionId: subscriptionId ?? undefined,
          subscriptionStatus: "ACTIVE",
        },
      });
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncOrganizationFromSubscription(subscription);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoiceSubscriptionId(invoice);
      const { getStripe } = await import("@/lib/stripe/client");
      const stripe = getStripe();

      if (subscriptionId && stripe) {
        try {
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);
          await syncOrganizationFromSubscription(subscription);
          break;
        } catch (error) {
          console.error(
            "[stripe.webhook] payment_failed: subscription retrieve failed",
            error,
          );
        }
      }

      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : null;
      if (!customerId) break;
      await prisma.organization.updateMany({
        where: { stripeCustomerId: customerId },
        data: { subscriptionStatus: "PAST_DUE" },
      });
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoiceSubscriptionId(invoice);
      const { getStripe } = await import("@/lib/stripe/client");
      const stripe = getStripe();

      if (subscriptionId && stripe) {
        try {
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);
          await syncOrganizationFromSubscription(subscription);
          break;
        } catch (error) {
          console.error(
            "[stripe.webhook] invoice.paid: subscription retrieve failed",
            error,
          );
        }
      }

      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : null;
      if (!customerId) break;
      await prisma.organization.updateMany({
        where: {
          stripeCustomerId: customerId,
          subscriptionStatus: { in: ["PAST_DUE", "INCOMPLETE", "UNPAID"] },
        },
        data: { subscriptionStatus: "ACTIVE" },
      });
      break;
    }
    default:
      break;
  }
}

export async function handleStripeEvent(event: Stripe.Event) {
  const claimed = await claimEvent(event);
  if (!claimed) {
    return { ok: true, duplicate: true };
  }

  try {
    await processStripeEvent(event);
    return { ok: true, duplicate: false };
  } catch (error) {
    await releaseClaim(event.id);
    throw error;
  }
}
