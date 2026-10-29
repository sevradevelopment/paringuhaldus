import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)]/50 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-[var(--brand)] shadow-sm ring-1 ring-[var(--border)]">
        <Icon className="size-5" aria-hidden />
      </span>
      <h3 className="mt-4 font-display text-lg font-bold text-[var(--ink)]">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--ink-muted)]">
        {description}
      </p>
    </div>
  );
}
