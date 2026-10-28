import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PricingPlan = {
  id: string;
  name: string;
  monthlyPrice: number;
  description: string;
  features: string[];
  highlighted?: boolean;
};

type PricingCardProps = {
  plan: PricingPlan;
  billing: "monthly" | "yearly";
  priceLabel: string;
  billingHint?: string;
  onSelect: (planId: string) => void;
};

export function PricingCard({
  plan,
  billing,
  priceLabel,
  billingHint,
  onSelect,
}: PricingCardProps) {
  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-2xl border bg-white/80 p-6 shadow-sm transition-all duration-200 sm:p-7",
        plan.highlighted
          ? "border-[var(--brand)]/50 shadow-md ring-1 ring-[var(--brand)]/20 lg:-translate-y-1"
          : "border-[var(--border)] hover:-translate-y-0.5 hover:border-[var(--brand)]/35 hover:shadow-md",
      )}
    >
      {plan.highlighted ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--brand)] px-3 py-1 font-display text-xs font-bold tracking-wide text-white shadow-sm">
          Populaarseim
        </span>
      ) : null}

      <div className="flex flex-1 flex-col">
        <h3 className="font-display text-xl font-bold tracking-tight text-[var(--ink)]">
          {plan.name}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
          {plan.description}
        </p>

        <div className="mt-6">
          <p className="flex items-baseline gap-1">
            <span className="font-display text-4xl font-extrabold tracking-tight text-[var(--ink)]">
              {priceLabel}
            </span>
            <span className="text-sm font-medium text-[var(--ink-muted)]">
              /kuu
            </span>
          </p>
          {billing === "yearly" && billingHint ? (
            <p className="mt-1 text-xs font-medium text-[var(--brand)]">
              {billingHint}
            </p>
          ) : (
            <p className="mt-1 text-xs text-[var(--ink-muted)]">
              Arveldatakse igakuiselt
            </p>
          )}
        </div>

        <ul className="mt-6 flex flex-1 flex-col gap-2.5">
          {plan.features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2.5 text-sm text-[var(--ink-muted)]"
            >
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[var(--brand)]">
                <Check className="h-3.5 w-3.5" aria-hidden strokeWidth={2.5} />
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          type="button"
          variant={plan.highlighted ? "primary" : "secondary"}
          size="lg"
          className="mt-8 w-full"
          onClick={() => onSelect(plan.id)}
        >
          Vali pakett
        </Button>
      </div>
    </article>
  );
}
