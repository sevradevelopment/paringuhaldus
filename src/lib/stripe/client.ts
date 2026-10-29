import Stripe from "stripe";

function secretKey(): string | undefined {
  return process.env.STRIPE_SECRET_KEY?.trim() || undefined;
}

function publishableKey(): string | undefined {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || undefined;
}

/** Accepts sk_/rk_ test or live secret keys. */
export function isStripeSecretKey(key: string): boolean {
  return /^(sk|rk)_(test|live)_/.test(key);
}

export function isStripePublishableKey(key: string): boolean {
  return /^pk_(test|live)_/.test(key);
}

export function isStripeLiveMode(): boolean {
  const secret = secretKey();
  const pub = publishableKey();
  return Boolean(
    secret?.includes("_live_") && pub?.startsWith("pk_live_"),
  );
}

export function getStripe(): Stripe | null {
  const key = secretKey();
  if (!key) return null;
  if (!isStripeSecretKey(key)) {
    console.warn(
      "[stripe] Expected a Stripe secret key (sk_test_/sk_live_/rk_test_/rk_live_). Refusing invalid key.",
    );
    return null;
  }
  return new Stripe(key);
}

export function isStripeConfigured(): boolean {
  const secret = secretKey();
  const pub = publishableKey();
  if (!secret || !pub) return false;
  if (!isStripeSecretKey(secret) || !isStripePublishableKey(pub)) return false;
  const secretLive = secret.includes("_live_");
  const pubLive = pub.startsWith("pk_live_");
  if (secretLive !== pubLive) {
    console.warn(
      "[stripe] Secret and publishable key mode mismatch (test vs live).",
    );
    return false;
  }
  return true;
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
