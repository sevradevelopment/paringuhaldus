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
