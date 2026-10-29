/**
 * Offline smoke checks for Stripe hardening logic (no network, no LIVE keys).
 * Mirrors planFromStripePriceId + getEffectivePlan / canExportPdf rules.
 * Usage: node scripts/verify-stripe-hardening.mjs
 */
import assert from "node:assert/strict";

process.env.STRIPE_PRICE_STARTER_MONTHLY = "price_test_starter_m";
process.env.STRIPE_PRICE_STARTER_YEARLY = "price_test_starter_y";
process.env.STRIPE_PRICE_BUSINESS_MONTHLY = "price_test_business_m";
process.env.STRIPE_PRICE_BUSINESS_YEARLY = "price_test_business_y";
process.env.STRIPE_PRICE_PRO_MONTHLY = "price_test_pro_m";
process.env.STRIPE_PRICE_PRO_YEARLY = "price_test_pro_y";

const KEYS = [
  { plan: "STARTER", interval: "MONTHLY", envKey: "STRIPE_PRICE_STARTER_MONTHLY" },
  { plan: "STARTER", interval: "YEARLY", envKey: "STRIPE_PRICE_STARTER_YEARLY" },
  { plan: "BUSINESS", interval: "MONTHLY", envKey: "STRIPE_PRICE_BUSINESS_MONTHLY" },
  { plan: "BUSINESS", interval: "YEARLY", envKey: "STRIPE_PRICE_BUSINESS_YEARLY" },
  { plan: "PRO", interval: "MONTHLY", envKey: "STRIPE_PRICE_PRO_MONTHLY" },
  { plan: "PRO", interval: "YEARLY", envKey: "STRIPE_PRICE_PRO_YEARLY" },
];

function planFromStripePriceId(priceId) {
  if (!priceId) return null;
  for (const item of KEYS) {
    const envPrice = process.env[item.envKey]?.trim();
    if (envPrice && envPrice === priceId) {
      return { plan: item.plan, interval: item.interval };
    }
  }
  return null;
}

function hasActiveSubscription(status) {
  return status === "ACTIVE" || status === "TRIALING";
}

function getEffectivePlan(org) {
  if (org.plan === "STARTER") return "STARTER";
  if (!hasActiveSubscription(org.subscriptionStatus)) return "STARTER";
  if (!org.stripeSubscriptionId) return "STARTER";
  return org.plan;
}

function canExportPdf(org) {
  const effective = getEffectivePlan(org);
  return effective === "BUSINESS" || effective === "PRO";
}

function getMaxUsersForOrg(org) {
  const limits = { STARTER: 1, BUSINESS: 5, PRO: null };
  return limits[getEffectivePlan(org)];
}

// A: price.id → plan
assert.deepEqual(planFromStripePriceId("price_test_business_m"), {
  plan: "BUSINESS",
  interval: "MONTHLY",
});
assert.deepEqual(planFromStripePriceId("price_test_pro_y"), {
  plan: "PRO",
  interval: "YEARLY",
});
assert.equal(planFromStripePriceId("price_unknown"), null);
assert.equal(planFromStripePriceId(null), null);

// D: paid gates
assert.equal(
  canExportPdf({
    plan: "BUSINESS",
    subscriptionStatus: "ACTIVE",
    stripeSubscriptionId: "sub_1",
  }),
  true,
);
assert.equal(
  canExportPdf({
    plan: "BUSINESS",
    subscriptionStatus: "PAST_DUE",
    stripeSubscriptionId: "sub_1",
  }),
  false,
);
assert.equal(
  canExportPdf({
    plan: "PRO",
    subscriptionStatus: "TRIALING",
    stripeSubscriptionId: null,
  }),
  false,
);
assert.equal(
  canExportPdf({
    plan: "STARTER",
    subscriptionStatus: "ACTIVE",
    stripeSubscriptionId: "sub_1",
  }),
  false,
);

// Seat limits follow effective plan
assert.equal(
  getMaxUsersForOrg({
    plan: "BUSINESS",
    subscriptionStatus: "CANCELED",
    stripeSubscriptionId: "sub_old",
  }),
  1,
);
assert.equal(
  getMaxUsersForOrg({
    plan: "PRO",
    subscriptionStatus: "ACTIVE",
    stripeSubscriptionId: "sub_2",
  }),
  null,
);

// B: duplicate-subscription gate condition
function shouldBlockCheckout(org) {
  return (
    hasActiveSubscription(org.subscriptionStatus) &&
    Boolean(org.stripeSubscriptionId)
  );
}
assert.equal(
  shouldBlockCheckout({
    subscriptionStatus: "ACTIVE",
    stripeSubscriptionId: "sub_1",
  }),
  true,
);
assert.equal(
  shouldBlockCheckout({
    subscriptionStatus: "CANCELED",
    stripeSubscriptionId: "sub_1",
  }),
  false,
);
assert.equal(
  shouldBlockCheckout({
    subscriptionStatus: "ACTIVE",
    stripeSubscriptionId: null,
  }),
  false,
);

console.log("verify-stripe-hardening: OK");
