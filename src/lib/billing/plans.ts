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

/** Paid features (PDF jne): ainult Business/Pro + Stripe-kinnitatud ACTIVE/TRIALING. Starter jääb freemiumiks. */
export function canUsePaidFeatures(org: {
  plan: OrganizationPlan;
  subscriptionStatus: SubscriptionStatus;
  stripeSubscriptionId: string | null;
}): boolean {
  if (org.plan === "STARTER") return false;
  return hasActiveSubscription(org.subscriptionStatus);
}

export function canExportPdf(org: {
  plan: OrganizationPlan;
  subscriptionStatus: SubscriptionStatus;
  stripeSubscriptionId: string | null;
}): boolean {
  return PLAN_LIMITS[org.plan].pdfExport && canUsePaidFeatures(org);
}

export function getMaxUsers(plan: OrganizationPlan): number | null {
  return PLAN_LIMITS[plan].maxUsers;
}
