import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
};

export function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
}: FeatureCardProps) {
  return (
    <article
      className={cn(
        "group rounded-2xl border border-[var(--border)] bg-white/70 p-6 shadow-sm transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-[var(--brand)]/35 hover:bg-white hover:shadow-md",
        "sm:p-7",
        className,
      )}
    >
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--brand)] transition-colors duration-200 group-hover:border-[var(--brand)]/30 group-hover:bg-[var(--brand)]/10">
        <Icon className="h-5 w-5" aria-hidden strokeWidth={1.75} />
      </div>
      <h3 className="mt-5 font-display text-lg font-bold tracking-tight text-[var(--ink)]">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)] sm:text-[0.9375rem]">
        {description}
      </p>
    </article>
  );
}
