import type { InquiryPriority, InquiryStatus } from "@prisma/client";

export const inquiryStatusLabel: Record<InquiryStatus, string> = {
  UUS: "Uus",
  TOOS: "Töös",
  OOTEL: "Ootel",
  LOPETATUD: "Lõpetatud",
  TYHISTATUD: "Tühistatud",
};

export const inquiryPriorityLabel: Record<InquiryPriority, string> = {
  MADAL: "Madal",
  TAVALINE: "Tavaline",
  KORGE: "Kõrge",
};

export const ACTIVE_INQUIRY_STATUSES: InquiryStatus[] = [
  "UUS",
  "TOOS",
  "OOTEL",
];

export const INQUIRY_STATUSES = Object.keys(
  inquiryStatusLabel,
) as InquiryStatus[];

export const INQUIRY_PRIORITIES = Object.keys(
  inquiryPriorityLabel,
) as InquiryPriority[];

export function formatEtDate(date: Date): string {
  return new Intl.DateTimeFormat("et-EE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatEtDateTime(date: Date): string {
  return new Intl.DateTimeFormat("et-EE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
