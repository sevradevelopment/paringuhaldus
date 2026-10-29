import Stripe from "stripe";

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (!key.startsWith("sk_test_")) {
    console.warn(
      "[stripe] Expected a Stripe TEST secret key (sk_test_…). Refusing non-test key.",
    );
    return null;
  }
  return new Stripe(key);
}

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim()?.startsWith("sk_test_") &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()?.startsWith(
        "pk_test_",
      ),
  );
}

export type StripePriceEnv = {
  plan: "starter" | "business" | "pro";
  interval: "monthly" | "yearly";
  envKey: string;
};

export const STRIPE_PRICE_ENV_KEYS: StripePriceEnv[] = [
  { plan: "starter", interval: "monthly", envKey: "STRIPE_PRICE_STARTER_MONTHLY" },
  { plan: "starter", interval: "yearly", envKey: "STRIPE_PRICE_STARTER_YEARLY" },
  { plan: "business", interval: "monthly", envKey: "STRIPE_PRICE_BUSINESS_MONTHLY" },
  { plan: "business", interval: "yearly", envKey: "STRIPE_PRICE_BUSINESS_YEARLY" },
  { plan: "pro", interval: "monthly", envKey: "STRIPE_PRICE_PRO_MONTHLY" },
  { plan: "pro", interval: "yearly", envKey: "STRIPE_PRICE_PRO_YEARLY" },
];

export function getStripePriceId(
  plan: "starter" | "business" | "pro",
  interval: "monthly" | "yearly",
): string | null {
  const found = STRIPE_PRICE_ENV_KEYS.find(
    (item) => item.plan === plan && item.interval === interval,
  );
  if (!found) return null;
  return process.env[found.envKey]?.trim() || null;
}
