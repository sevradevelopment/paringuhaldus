import type { InquiryStatus } from "@prisma/client";

export const inquiryStatusLabel: Record<InquiryStatus, string> = {
  UUS: "Uus",
  TOOS: "Töös",
  PAKKUMINE: "Pakkumine",
  VOIDETUD: "Võidetud",
  KAOTATUD: "Kaotatud",
};

export const ACTIVE_INQUIRY_STATUSES: InquiryStatus[] = [
  "UUS",
  "TOOS",
  "PAKKUMINE",
];

export function formatEtDate(date: Date): string {
  return new Intl.DateTimeFormat("et-EE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
