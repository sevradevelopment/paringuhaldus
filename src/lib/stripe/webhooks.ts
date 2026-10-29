import type Stripe from "stripe";
import type {
  BillingInterval,
  OrganizationPlan,
  SubscriptionStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";

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

async function alreadyProcessed(eventId: string): Promise<boolean> {
  const existing = await prisma.stripeEvent.findUnique({
    where: { id: eventId },
  });
  return Boolean(existing);
}

async function markProcessed(event: Stripe.Event) {
  await prisma.stripeEvent.create({
    data: {
      id: event.id,
      type: event.type,
      payload: event as unknown as object,
    },
  });
}

export async function handleStripeEvent(event: Stripe.Event) {
  if (await alreadyProcessed(event.id)) {
    return { ok: true, duplicate: true };
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId =
        session.metadata?.organizationId ||
        (typeof session.client_reference_id === "string"
          ? session.client_reference_id
          : null);
      if (!organizationId) break;

      const plan = planFromMetadata(session.metadata) ?? "STARTER";
      const interval = intervalFromMetadata(session.metadata);
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : null;

      let periodEnd: Date | null = null;
      let priceId: string | undefined;
      if (subscriptionId) {
        const { getStripe } = await import("@/lib/stripe/client");
        const stripe = getStripe();
        if (stripe) {
          try {
            const subscription =
              await stripe.subscriptions.retrieve(subscriptionId);
            const item = subscription.items.data[0];
            const periodEndUnix =
              (
                subscription as Stripe.Subscription & {
                  current_period_end?: number;
                }
              ).current_period_end ??
              (
                item as { current_period_end?: number } | undefined
              )?.current_period_end ??
              null;
            if (periodEndUnix) {
              periodEnd = new Date(periodEndUnix * 1000);
            }
            priceId = item?.price?.id;
          } catch (error) {
            console.error(
              "[stripe.webhook] subscription retrieve failed",
              error,
            );
          }
        }
      }

      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          plan,
          billingInterval: interval ?? undefined,
          stripeCustomerId:
            typeof session.customer === "string"
              ? session.customer
              : undefined,
          stripeSubscriptionId: subscriptionId ?? undefined,
          stripePriceId: priceId,
          currentPeriodEnd: periodEnd ?? undefined,
          subscriptionStatus: "ACTIVE",
        },
      });
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const organizationId = subscription.metadata?.organizationId;
      const org =
        (organizationId
          ? await prisma.organization.findUnique({
              where: { id: organizationId },
            })
          : null) ||
        (await prisma.organization.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        }));

      if (!org) break;

      const status = mapSubscriptionStatus(subscription.status);
      const plan =
        planFromMetadata(subscription.metadata) ??
        (status === "ACTIVE" || status === "TRIALING" ? org.plan : "STARTER");
      const interval = intervalFromMetadata(subscription.metadata);
      const item = subscription.items.data[0];
      const periodEndUnix =
        (
          subscription as Stripe.Subscription & {
            current_period_end?: number;
          }
        ).current_period_end ??
        (
          item as { current_period_end?: number } | undefined
        )?.current_period_end ??
        subscription.ended_at ??
        null;
      const periodEnd = periodEndUnix
        ? new Date(periodEndUnix * 1000)
        : null;

      await prisma.organization.update({
        where: { id: org.id },
        data: {
          subscriptionStatus: status,
          stripeSubscriptionId: subscription.id,
          stripePriceId: item?.price?.id ?? org.stripePriceId,
          currentPeriodEnd: periodEnd,
          billingInterval: interval ?? org.billingInterval,
          plan:
            status === "CANCELED" || status === "UNPAID" || status === "NONE"
              ? "STARTER"
              : plan,
        },
      });
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
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

  await markProcessed(event);
  return { ok: true, duplicate: false };
}
