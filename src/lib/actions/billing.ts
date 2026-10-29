"use server";

import { auth } from "@/auth";
import {
  hasActiveSubscription,
  planIdToEnum,
  type PlanId,
} from "@/lib/billing/plans";
import { prisma } from "@/lib/db";
import {
  getStripe,
  getStripePriceId,
  isStripeConfigured,
} from "@/lib/stripe/client";

export type BillingActionResult =
  | { ok: true; url?: string }
  | { ok: false; error: string; portalUrl?: string };

function appBaseUrl() {
  return (
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export async function createCheckoutSessionAction(input: {
  plan: PlanId;
  interval: "monthly" | "yearly";
}): Promise<BillingActionResult> {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return { ok: false, error: "Palun logi sisse, et paketti valida." };
  }

  if (!isStripeConfigured()) {
    return {
      ok: false,
      error:
        "Stripe pole seadistatud. Lisa STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ja hinnapakettide price ID-d.",
    };
  }

  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, error: "Stripe klient pole saadaval." };
  }

  const priceId = getStripePriceId(input.plan, input.interval);
  if (!priceId) {
    return {
      ok: false,
      error: `Puudub Stripe price ID paketile ${input.plan} (${input.interval}).`,
    };
  }

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
  });
  if (!org) return { ok: false, error: "Organisatsiooni ei leitud" };

  // Prevent duplicate subscriptions: active/trialing + existing Stripe sub → Portal
  if (
    hasActiveSubscription(org.subscriptionStatus) &&
    org.stripeSubscriptionId
  ) {
    if (org.stripeCustomerId) {
      try {
        const portal = await stripe.billingPortal.sessions.create({
          customer: org.stripeCustomerId,
          return_url: `${appBaseUrl()}/app/seaded/tellimus`,
        });
        return {
          ok: false,
          error:
            "Sul on juba aktiivne tellimus. Uue Checkouti avamine on blokeeritud — suuname sind Stripe arveldusportaali.",
          portalUrl: portal.url,
        };
      } catch (error) {
        console.error("[billing] portal session for duplicate block failed", error);
      }
    }
    return {
      ok: false,
      error:
        "Sul on juba aktiivne või prooviperioodi tellimus. Uue Checkouti avamine on blokeeritud. Paketi muutmiseks või tühistamiseks kasuta nuppu „Halda arveldust (Stripe)”.",
    };
  }

  let customerId = org.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email ?? undefined,
      name: org.name,
      metadata: {
        organizationId: org.id,
        userId: session.user.id,
      },
    });
    customerId = customer.id;
    await prisma.organization.update({
      where: { id: org.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appBaseUrl()}/app/seaded/tellimus?checkout=success`,
    cancel_url: `${appBaseUrl()}/app/seaded/tellimus?checkout=cancel`,
    allow_promotion_codes: true,
    metadata: {
      organizationId: org.id,
      plan: planIdToEnum(input.plan),
      interval: input.interval === "yearly" ? "YEARLY" : "MONTHLY",
      userId: session.user.id,
    },
    subscription_data: {
      metadata: {
        organizationId: org.id,
        plan: planIdToEnum(input.plan),
        interval: input.interval === "yearly" ? "YEARLY" : "MONTHLY",
      },
    },
  });

  if (!checkout.url) {
    return { ok: false, error: "Checkout URL-i loomine ebaõnnestus." };
  }

  return { ok: true, url: checkout.url };
}

export async function createBillingPortalAction(): Promise<BillingActionResult> {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return { ok: false, error: "Palun logi sisse." };
  }

  const stripe = getStripe();
  if (!stripe || !isStripeConfigured()) {
    return { ok: false, error: "Stripe pole seadistatud." };
  }

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
  });
  if (!org?.stripeCustomerId) {
    return { ok: false, error: "Arveldusklienti pole veel loodud." };
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${appBaseUrl()}/app/seaded/tellimus`,
  });

  return { ok: true, url: portal.url };
}
