import type { InquiryPriority } from "@prisma/client";
import { cn } from "@/lib/utils";
import { inquiryPriorityLabel } from "@/lib/inquiries/labels";

const priorityStyles: Record<InquiryPriority, string> = {
  MADAL: "bg-stone-100 text-stone-600 ring-stone-200",
  TAVALINE: "bg-slate-50 text-slate-700 ring-slate-200",
  KORGE: "bg-rose-50 text-rose-800 ring-rose-200",
};

export function PriorityBadge({ priority }: { priority: InquiryPriority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
        priorityStyles[priority],
      )}
    >
      {inquiryPriorityLabel[priority]}
    </span>
  );
}
