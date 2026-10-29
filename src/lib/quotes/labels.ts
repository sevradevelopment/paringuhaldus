import type { QuoteStatus } from "@prisma/client";

export const quoteStatusLabel: Record<QuoteStatus, string> = {
  PENDING: "Mustand",
  SENT: "Saadetud",
  ACCEPTED: "Kinnitatud",
  REJECTED: "Tagasi lükatud",
  EXPIRED: "Aegunud",
};

export const QUOTE_STATUSES = Object.keys(quoteStatusLabel) as QuoteStatus[];

export { formatEtDate, formatEtDateTime } from "@/lib/inquiries/labels";
