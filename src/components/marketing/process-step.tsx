import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ProcessStepProps = {
  step: number;
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
};

export function ProcessStep({
  step,
  icon: Icon,
  title,
  description,
  className,
}: ProcessStepProps) {
  return (
    <article
      className={cn(
        "group relative rounded-2xl border border-[var(--border)] bg-white/80 p-6 shadow-sm transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-[var(--brand)]/35 hover:bg-white hover:shadow-md",
        "sm:p-7",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--brand)] transition-colors duration-200 group-hover:border-[var(--brand)]/30 group-hover:bg-[var(--brand)]/10">
            <Icon className="h-5 w-5" aria-hidden strokeWidth={1.75} />
          </div>
          <span className="absolute -right-1.5 -top-1.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--brand)] px-1.5 font-display text-xs font-bold text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
            {step}
          </span>
        </div>

        <div className="min-w-0 pt-0.5">
          <h3 className="font-display text-lg font-bold tracking-tight text-[var(--ink)]">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)] sm:text-[0.9375rem]">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}
