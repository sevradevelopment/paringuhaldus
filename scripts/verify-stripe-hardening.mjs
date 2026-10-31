/**
 * Offline smoke checks for Stripe hardening logic (no network, no LIVE keys).
 * Mirrors planFromStripePriceId, getEffectivePlan, duplicate-checkout matrix,
 * and checkout payment_status fulfillment rules.
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

const CHECKOUT_BLOCKING_STATUSES = [
  "ACTIVE",
  "TRIALING",
  "PAST_DUE",
  "UNPAID",
  "INCOMPLETE",
];

function shouldBlockDuplicateCheckout(org) {
  return (
    Boolean(org.stripeSubscriptionId) &&
    CHECKOUT_BLOCKING_STATUSES.includes(org.subscriptionStatus)
  );
}

function checkoutPaymentAllowsFulfillment(paymentStatus) {
  return (
    paymentStatus === "paid" || paymentStatus === "no_payment_required"
  );
}

/**
 * Mirrors webhook fallback policy: never invent ACTIVE from session alone.
 * Paid access comes only from retrieved subscription.status via sync.
 */
function checkoutFallbackSubscriptionStatus(paymentStatus) {
  void paymentStatus;
  return "INCOMPLETE";
}

function shouldGrantPaidPlanFromCheckoutFallback(paymentStatus) {
  // Even when paid, fallback must not upgrade plan without subscription retrieve
  void paymentStatus;
  return false;
}

function mapSubscriptionStatus(status) {
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

function planAfterSubscriptionSync(subscriptionStatus, resolvedPlan) {
  const inactive =
    subscriptionStatus === "CANCELED" ||
    subscriptionStatus === "UNPAID" ||
    subscriptionStatus === "NONE" ||
    subscriptionStatus === "INCOMPLETE";
  return inactive ? "STARTER" : resolvedPlan;
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

// B: duplicate-subscription status matrix
const blockMatrix = [
  ["ACTIVE", "sub_1", true],
  ["TRIALING", "sub_1", true],
  ["PAST_DUE", "sub_1", true],
  ["UNPAID", "sub_1", true],
  ["INCOMPLETE", "sub_1", true],
  ["CANCELED", "sub_1", false],
  ["NONE", "sub_1", false],
  ["ACTIVE", null, false],
  ["TRIALING", null, false],
  ["PAST_DUE", null, false],
  ["CANCELED", null, false],
  ["NONE", null, false],
];

for (const [subscriptionStatus, stripeSubscriptionId, expected] of blockMatrix) {
  assert.equal(
    shouldBlockDuplicateCheckout({ subscriptionStatus, stripeSubscriptionId }),
    expected,
    `shouldBlockDuplicateCheckout(${subscriptionStatus}, ${stripeSubscriptionId})`,
  );
}

// C: checkout payment_status fulfillment rules
assert.equal(checkoutPaymentAllowsFulfillment("paid"), true);
assert.equal(checkoutPaymentAllowsFulfillment("no_payment_required"), true);
assert.equal(checkoutPaymentAllowsFulfillment("unpaid"), false);
assert.equal(checkoutPaymentAllowsFulfillment(null), false);
assert.equal(checkoutPaymentAllowsFulfillment(undefined), false);

assert.equal(checkoutFallbackSubscriptionStatus("paid"), "INCOMPLETE");
assert.equal(checkoutFallbackSubscriptionStatus("unpaid"), "INCOMPLETE");
assert.equal(shouldGrantPaidPlanFromCheckoutFallback("paid"), false);
assert.equal(shouldGrantPaidPlanFromCheckoutFallback("unpaid"), false);

// Subscription sync distinguishes paid vs trialing vs unpaid/incomplete
assert.equal(mapSubscriptionStatus("active"), "ACTIVE");
assert.equal(mapSubscriptionStatus("trialing"), "TRIALING");
assert.equal(mapSubscriptionStatus("unpaid"), "UNPAID");
assert.equal(mapSubscriptionStatus("incomplete"), "INCOMPLETE");
assert.equal(planAfterSubscriptionSync("ACTIVE", "BUSINESS"), "BUSINESS");
assert.equal(planAfterSubscriptionSync("TRIALING", "PRO"), "PRO");
assert.equal(planAfterSubscriptionSync("INCOMPLETE", "BUSINESS"), "STARTER");
assert.equal(planAfterSubscriptionSync("UNPAID", "PRO"), "STARTER");
assert.equal(planAfterSubscriptionSync("CANCELED", "BUSINESS"), "STARTER");

// Paid features require ACTIVE/TRIALING + sub id (not unpaid/incomplete invent)
assert.equal(
  canExportPdf({
    plan: "BUSINESS",
    subscriptionStatus: "INCOMPLETE",
    stripeSubscriptionId: "sub_new",
  }),
  false,
);
assert.equal(
  canExportPdf({
    plan: "BUSINESS",
    subscriptionStatus: "UNPAID",
    stripeSubscriptionId: "sub_new",
  }),
  false,
);
assert.equal(
  canExportPdf({
    plan: "BUSINESS",
    subscriptionStatus: "TRIALING",
    stripeSubscriptionId: "sub_new",
  }),
  true,
);

console.log("verify-stripe-hardening: OK");
