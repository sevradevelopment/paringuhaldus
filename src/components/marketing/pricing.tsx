"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  PricingCard,
  type PricingPlan,
} from "@/components/marketing/pricing-card";
import { createCheckoutSessionAction } from "@/lib/actions/billing";
import type { PlanId } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";

const YEARLY_DISCOUNT = 0.2;

const plans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 19,
    description: "Sobib alustavale ettevõttele, kes soovib päringud korras hoida.",
    features: [
      "1 kasutaja",
      "50 päringut kuus",
      "Klientide haldus",
      "Hinnapakkumised",
    ],
  },
  {
    id: "business",
    name: "Business",
    monthlyPrice: 39,
    description: "Kasvavale meeskonnale, kes vajab rohkem mahtu ja ülevaadet.",
    features: [
      "Kuni 5 kasutajat",
      "Piiramatult päringuid",
      "PDF-pakkumised",
      "Statistika",
      "Failide lisamine",
    ],
    highlighted: true,
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 79,
    description: "Suuremale organisatsioonile, kes vajab automatiseerimist ja API-t.",
    features: [
      "Piiramatult kasutajaid",
      "Piiramatult päringuid",
      "Automatiseerimine",
      "API ligipääs",
      "Integratsioonid",
    ],
  },
];

function formatEuro(value: number): string {
  return (
    new Intl.NumberFormat("et-EE", {
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(value) + " €"
  );
}

export function Pricing() {
  const router = useRouter();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const priceByPlan = useMemo(() => {
    return Object.fromEntries(
      plans.map((plan) => {
        if (billing === "monthly") {
          return [
            plan.id,
            {
              label: formatEuro(plan.monthlyPrice),
              hint: undefined as string | undefined,
            },
          ];
        }

        const monthlyEquivalent =
          Math.round(plan.monthlyPrice * (1 - YEARLY_DISCOUNT) * 100) / 100;
        const yearlyTotal = Math.round(monthlyEquivalent * 12 * 100) / 100;

        return [
          plan.id,
          {
            label: formatEuro(monthlyEquivalent),
            hint: `Aastamakse: ${formatEuro(yearlyTotal)} (−20%)`,
          },
        ];
      }),
    ) as Record<string, { label: string; hint?: string }>;
  }, [billing]);

  function handleSelect(planId: string) {
    const plan = plans.find((item) => item.id === planId);
    if (!plan) return;

    setNotice(null);
    startTransition(async () => {
      const result = await createCheckoutSessionAction({
        plan: planId as PlanId,
        interval: billing,
      });
      if (!result.ok) {
        if (result.error.includes("logi sisse")) {
          router.push(
            `/login?next=${encodeURIComponent(`/app/seaded/tellimus?plan=${planId}&interval=${billing}`)}`,
          );
          return;
        }
        setNotice(result.error);
        if (result.portalUrl) {
          window.location.href = result.portalUrl;
        }
        return;
      }
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      setNotice("Checkout URL puudub.");
    });
  }

  return (
    <section
      id="hinnad"
      className="scroll-mt-20 border-t border-[var(--border)]/80 bg-[var(--surface-muted)]/60"
      aria-labelledby="pricing-heading"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="pricing-heading"
            className="font-display text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-4xl"
          >
            Lihtne ja läbipaistev hinnastamine
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--ink-muted)] sm:text-lg">
            Vali oma ettevõttele sobiv pakett. Aastamaksega säästad 20%.
          </p>

          <div
            className="mt-8 inline-flex items-center rounded-xl border border-[var(--border)] bg-white/80 p-1 shadow-sm"
            role="group"
            aria-label="Arveldusperiood"
          >
            <button
              type="button"
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200",
                billing === "monthly"
                  ? "bg-[var(--brand)] text-white shadow-sm"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink)]",
              )}
              aria-pressed={billing === "monthly"}
              onClick={() => setBilling("monthly")}
            >
              Kuumakse
            </button>
            <button
              type="button"
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200",
                billing === "yearly"
                  ? "bg-[var(--brand)] text-white shadow-sm"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink)]",
              )}
              aria-pressed={billing === "yearly"}
              onClick={() => setBilling("yearly")}
            >
              Aastamakse
              <span
                className={cn(
                  "ml-2 rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide",
                  billing === "yearly"
                    ? "bg-white/20 text-white"
                    : "bg-[var(--brand)]/10 text-[var(--brand)]",
                )}
              >
                −20%
              </span>
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:mt-12 lg:grid-cols-3 lg:items-stretch lg:gap-6">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              billing={billing}
              priceLabel={priceByPlan[plan.id].label}
              billingHint={priceByPlan[plan.id].hint}
              onSelect={handleSelect}
            />
          ))}
        </div>

        {pending ? (
          <p className="mx-auto mt-8 text-center text-sm text-[var(--ink-muted)]">
            Suunan Stripe Checkouti…
          </p>
        ) : null}
        {notice ? (
          <p
            role="status"
            className="mx-auto mt-8 max-w-2xl rounded-xl border border-[var(--border)] bg-white/90 px-4 py-3 text-center text-sm text-[var(--ink-muted)] shadow-sm"
          >
            {notice}
          </p>
        ) : null}
      </div>
    </section>
  );
}
