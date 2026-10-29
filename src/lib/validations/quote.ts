import { z } from "zod";

export const quoteStatusSchema = z.enum([
  "PENDING",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
]);

const decimalString = z
  .string()
  .trim()
  .regex(/^\d+([.,]\d{1,4})?$/, "Palun sisesta kehtiv number")
  .transform((v) => v.replace(",", "."));

export const quoteLineItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Rea nimi on kohustuslik")
    .max(300, "Rea nimi on liiga pikk"),
  quantity: decimalString,
  unitPrice: decimalString,
  vatRate: decimalString,
});

export const quoteFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Pealkiri peab olema vähemalt 2 tähemärki")
    .max(200, "Pealkiri on liiga pikk"),
  description: z.string().trim().max(10000, "Kirjeldus on liiga pikk"),
  clientId: z.union([z.literal(""), z.string().cuid()]),
  inquiryId: z.union([z.literal(""), z.string().cuid()]),
  status: quoteStatusSchema,
  issueDate: z.string().trim().min(1, "Kuupäev on kohustuslik"),
  validUntil: z.string().trim(),
  lineItems: z
    .array(quoteLineItemSchema)
    .min(1, "Lisa vähemalt üks rida"),
});

export const quoteIdSchema = z.object({
  quoteId: z.string().cuid(),
});

export const quoteSendSchema = z.object({
  quoteId: z.string().cuid(),
  toEmail: z.string().trim().email("Palun sisesta kehtiv e-post"),
  subject: z
    .string()
    .trim()
    .min(2, "Teema on kohustuslik")
    .max(200, "Teema on liiga pikk"),
  message: z.string().trim().max(5000, "Sõnum on liiga pikk").optional(),
});

export type QuoteFormInput = z.infer<typeof quoteFormSchema>;
export type QuoteSendInput = z.infer<typeof quoteSendSchema>;
