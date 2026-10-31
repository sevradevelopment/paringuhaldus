import type { OrganizationPlan, SubscriptionStatus } from "@prisma/client";

export type PlanId = "starter" | "business" | "pro";

export const PLAN_LIMITS: Record<
  OrganizationPlan,
  { maxUsers: number | null; pdfExport: boolean; label: string }
> = {
  STARTER: { maxUsers: 1, pdfExport: false, label: "Starter" },
  BUSINESS: { maxUsers: 5, pdfExport: true, label: "Business" },
  PRO: { maxUsers: null, pdfExport: true, label: "Pro" },
};

export const PLAN_PRICES_EUR = {
  starter: { monthly: 19, yearlyMonthlyEquivalent: 15.2 },
  business: { monthly: 39, yearlyMonthlyEquivalent: 31.2 },
  pro: { monthly: 79, yearlyMonthlyEquivalent: 63.2 },
} as const;

export function planIdToEnum(id: PlanId): OrganizationPlan {
  switch (id) {
    case "business":
      return "BUSINESS";
    case "pro":
      return "PRO";
    case "starter":
    default:
      return "STARTER";
  }
}

export function enumToPlanId(plan: OrganizationPlan): PlanId {
  switch (plan) {
    case "BUSINESS":
      return "business";
    case "PRO":
      return "pro";
    case "STARTER":
    default:
      return "starter";
  }
}

export function hasActiveSubscription(
  status: SubscriptionStatus,
): boolean {
  return status === "ACTIVE" || status === "TRIALING";
}

/**
 * Non-terminal subscription statuses that still own a Stripe subscription.
 * New Checkout must be blocked; manage via Customer Portal instead.
 */
export const CHECKOUT_BLOCKING_STATUSES: readonly SubscriptionStatus[] = [
  "ACTIVE",
  "TRIALING",
  "PAST_DUE",
  "UNPAID",
  "INCOMPLETE",
] as const;

export function isCheckoutBlockingStatus(
  status: SubscriptionStatus,
): boolean {
  return (CHECKOUT_BLOCKING_STATUSES as readonly string[]).includes(status);
}

/**
 * Block new Checkout when a non-terminal Stripe subscription already exists.
 * Allow again only for CANCELED / NONE / missing stripeSubscriptionId.
 */
export function shouldBlockDuplicateCheckout(org: {
  subscriptionStatus: SubscriptionStatus;
  stripeSubscriptionId: string | null;
}): boolean {
  return (
    Boolean(org.stripeSubscriptionId) &&
    isCheckoutBlockingStatus(org.subscriptionStatus)
  );
}

/** Stripe subscription statuses that indicate an open (non-terminal) sub. */
export const STRIPE_OPEN_SUBSCRIPTION_STATUSES = [
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "incomplete",
  "paused",
] as const;

export function isStripeOpenSubscriptionStatus(status: string): boolean {
  return (STRIPE_OPEN_SUBSCRIPTION_STATUSES as readonly string[]).includes(
    status,
  );
}

/**
 * Checkout Session payment_status that may proceed to paid entitlement sync.
 * "unpaid" (e.g. async bank methods) must wait for async_payment_succeeded.
 */
export function checkoutPaymentAllowsFulfillment(
  paymentStatus: string | null | undefined,
): boolean {
  return (
    paymentStatus === "paid" || paymentStatus === "no_payment_required"
  );
}

export type OrgBillingFields = {
  plan: OrganizationPlan;
  subscriptionStatus: SubscriptionStatus;
  stripeSubscriptionId: string | null;
};

/**
 * Effective entitlements plan: paid plans (BUSINESS/PRO) only when
 * subscriptionStatus is ACTIVE/TRIALING and stripeSubscriptionId is set.
 * Otherwise treat as STARTER (freemium).
 */
export function getEffectivePlan(org: OrgBillingFields): OrganizationPlan {
  if (org.plan === "STARTER") return "STARTER";
  if (!hasActiveSubscription(org.subscriptionStatus)) return "STARTER";
  if (!org.stripeSubscriptionId) {
    console.warn(
      "[billing] paid plan without stripeSubscriptionId — treating as STARTER",
      { plan: org.plan, status: org.subscriptionStatus },
    );
    return "STARTER";
  }
  return org.plan;
}

/** Paid features (PDF jne): ainult Business/Pro + Stripe-kinnitatud ACTIVE/TRIALING + subscription id. */
export function canUsePaidFeatures(org: OrgBillingFields): boolean {
  const effective = getEffectivePlan(org);
  return effective === "BUSINESS" || effective === "PRO";
}

export function canExportPdf(org: OrgBillingFields): boolean {
  const effective = getEffectivePlan(org);
  return PLAN_LIMITS[effective].pdfExport && canUsePaidFeatures(org);
}

export function getMaxUsers(plan: OrganizationPlan): number | null {
  return PLAN_LIMITS[plan].maxUsers;
}

/** Seat limit from effective (subscription-gated) plan. */
export function getMaxUsersForOrg(org: OrgBillingFields): number | null {
  return PLAN_LIMITS[getEffectivePlan(org)].maxUsers;
}
