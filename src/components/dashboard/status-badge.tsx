import type { InquiryStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { inquiryStatusLabel } from "@/lib/inquiries/labels";

const statusStyles: Record<InquiryStatus, string> = {
  UUS: "bg-sky-50 text-sky-800 ring-sky-200",
  TOOS: "bg-amber-50 text-amber-900 ring-amber-200",
  OOTEL: "bg-violet-50 text-violet-900 ring-violet-200",
  LOPETATUD: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  TYHISTATUD: "bg-stone-100 text-stone-600 ring-stone-200",
};

export function StatusBadge({ status }: { status: InquiryStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
        statusStyles[status],
      )}
    >
      {inquiryStatusLabel[status]}
    </span>
  );
}
