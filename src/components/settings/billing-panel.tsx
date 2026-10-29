"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  BillingInterval,
  OrganizationPlan,
  SubscriptionStatus,
} from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  createBillingPortalAction,
  createCheckoutSessionAction,
} from "@/lib/actions/billing";
import { PLAN_LIMITS, PLAN_PRICES_EUR, type PlanId } from "@/lib/billing/plans";
import { formatEtDate } from "@/lib/inquiries/labels";

const statusLabel: Record<SubscriptionStatus, string> = {
  NONE: "Puudub",
  ACTIVE: "Aktiivne",
  TRIALING: "Prooviperiood",
  PAST_DUE: "Makse hilinenud",
  CANCELED: "Tühistatud",
  INCOMPLETE: "Pooleli",
  UNPAID: "Maksmata",
};

function asDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function BillingPanel({
  plan,
  subscriptionStatus,
  billingInterval,
  currentPeriodEnd,
  stripeConfigured,
  stripeLiveMode,
  checkoutNotice,
}: {
  plan: OrganizationPlan;
  subscriptionStatus: SubscriptionStatus;
  billingInterval: BillingInterval | null;
  currentPeriodEnd: Date | string | null;
  stripeConfigured: boolean;
  stripeLiveMode: boolean;
  checkoutNotice?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [error, setError] = useState<string | null>(null);
  const periodEnd = asDate(currentPeriodEnd);

  function checkout(planId: PlanId) {
    setError(null);
    startTransition(async () => {
      const result = await createCheckoutSessionAction({
        plan: planId,
        interval,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.url) {
        window.location.href = result.url;
      }
    });
  }

  return (
    <div className="space-y-6">
      {checkoutNotice ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {checkoutNotice}
        </p>
      ) : null}

      <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h3 className="font-display text-lg font-bold text-[var(--ink)]">
          Praegune pakett
        </h3>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--ink-muted)]">Pakett</dt>
            <dd className="font-semibold">{PLAN_LIMITS[plan].label}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-muted)]">Staatus</dt>
            <dd className="font-semibold">{statusLabel[subscriptionStatus]}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-muted)]">Periood</dt>
            <dd className="font-semibold">
              {billingInterval === "YEARLY"
                ? "Aastane"
                : billingInterval === "MONTHLY"
                  ? "Kuine"
                  : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--ink-muted)]">Järgmine makse / lõpp</dt>
            <dd className="font-semibold">
              {periodEnd ? formatEtDate(periodEnd) : "—"}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-[var(--ink-muted)]">
          Kasutajalimiit:{" "}
          {PLAN_LIMITS[plan].maxUsers === null
            ? "piiramatu"
            : PLAN_LIMITS[plan].maxUsers}{" "}
          · PDF: {PLAN_LIMITS[plan].pdfExport ? "jah" : "ei (Starter)"}
        </p>
        {stripeConfigured ? (
          <Button
            type="button"
            variant="secondary"
            className="mt-4"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const result = await createBillingPortalAction();
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                if (result.url) window.location.href = result.url;
              });
            }}
          >
            Halda arveldust (Stripe)
          </Button>
        ) : null}
      </div>

      {!stripeConfigured ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Stripe võtmed puuduvad. Lisa{" "}
          <code>STRIPE_SECRET_KEY</code>,{" "}
          <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>, webhook secret ja
          price ID-d.
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${interval === "monthly" ? "bg-[var(--brand)] text-white" : "bg-white ring-1 ring-[var(--border)]"}`}
          onClick={() => setInterval("monthly")}
        >
          Kuine
        </button>
        <button
          type="button"
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${interval === "yearly" ? "bg-[var(--brand)] text-white" : "bg-white ring-1 ring-[var(--border)]"}`}
          onClick={() => setInterval("yearly")}
        >
          Aastane (−20%)
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {(
          [
            ["starter", "Starter", PLAN_PRICES_EUR.starter],
            ["business", "Business", PLAN_PRICES_EUR.business],
            ["pro", "Pro", PLAN_PRICES_EUR.pro],
          ] as const
        ).map(([id, label, prices]) => {
          const amount =
            interval === "monthly"
              ? prices.monthly
              : prices.yearlyMonthlyEquivalent;
          return (
            <div
              key={id}
              className="rounded-2xl border border-[var(--border)] p-4"
            >
              <h4 className="font-display text-lg font-bold">{label}</h4>
              <p className="mt-2 text-2xl font-extrabold">
                {amount.toLocaleString("et-EE")} €
                <span className="text-sm font-medium text-[var(--ink-muted)]">
                  /kuu
                </span>
              </p>
              <Button
                type="button"
                className="mt-4 w-full"
                disabled={pending || !stripeConfigured}
                onClick={() => checkout(id)}
              >
                Vali {label}
              </Button>
            </div>
          );
        })}
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <p className="text-xs text-[var(--ink-muted)]">
        {stripeLiveMode
          ? "Kasutusel on Stripe LIVE (tootmine). Makseid võetakse päris rahaga. Tasulised funktsioonid aktiveeruvad pärast Stripe webhooki (ACTIVE/TRIALING). Tühistamine Customer Portalis toimub perioodi lõpus."
          : "Kasutusel on Stripe TEST režiim. Testkaart: 4242 4242 4242 4242 (suvaline tulevane kuupäev ja CVC). Tasulised funktsioonid aktiveeruvad pärast Stripe webhooki (ACTIVE/TRIALING). Tühistamine Customer Portalis toimub perioodi lõpus."}
      </p>
      <button
        type="button"
        className="text-xs text-[var(--brand)] underline"
        onClick={() => router.refresh()}
      >
        Värskenda
      </button>
    </div>
  );
}
