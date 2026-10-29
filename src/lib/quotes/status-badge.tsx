import type { QuoteStatus } from "@prisma/client";
import { quoteStatusLabel } from "@/lib/quotes/labels";
import { cn } from "@/lib/utils";

const styles: Record<QuoteStatus, string> = {
  PENDING: "bg-stone-100 text-stone-700 ring-stone-200",
  SENT: "bg-sky-50 text-sky-700 ring-sky-200",
  ACCEPTED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  REJECTED: "bg-red-50 text-red-700 ring-red-200",
  EXPIRED: "bg-amber-50 text-amber-800 ring-amber-200",
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
        styles[status],
      )}
    >
      {quoteStatusLabel[status]}
    </span>
  );
}
