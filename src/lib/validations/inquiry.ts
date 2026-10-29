import { z } from "zod";

export const inquiryStatusSchema = z.enum([
  "UUS",
  "TOOS",
  "OOTEL",
  "LOPETATUD",
  "TYHISTATUD",
]);

export const inquiryPrioritySchema = z.enum(["MADAL", "TAVALINE", "KORGE"]);

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message);

const optionalEmail = z.union([
  z.literal(""),
  z.string().trim().email("Palun sisesta kehtiv e-post"),
]);

export const inquiryFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Pealkiri peab olema vähemalt 2 tähemärki")
      .max(200, "Pealkiri on liiga pikk"),
    description: optionalText(10000, "Kirjeldus on liiga pikk"),
    status: inquiryStatusSchema,
    priority: inquiryPrioritySchema,
    clientId: z.union([
      z.literal(""),
      z.literal("__new__"),
      z.string().cuid(),
    ]),
    newClientName: optionalText(200, "Kliendi nimi on liiga pikk"),
    newClientEmail: optionalEmail,
    newClientPhone: optionalText(50, "Telefon on liiga pikk"),
  })
  .superRefine((data, ctx) => {
    if (data.clientId === "__new__" && !data.newClientName.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["newClientName"],
        message: "Uue kliendi nimi on kohustuslik",
      });
    }
  });

export const inquiryStatusUpdateSchema = z.object({
  inquiryId: z.string().cuid(),
  status: inquiryStatusSchema,
});

export const inquiryNoteSchema = z.object({
  inquiryId: z.string().cuid(),
  body: z
    .string()
    .trim()
    .min(1, "Märkus ei tohi olla tühi")
    .max(5000, "Märkus on liiga pikk"),
});

export const inquiryIdSchema = z.object({
  inquiryId: z.string().cuid(),
});

export type InquiryFormInput = z.infer<typeof inquiryFormSchema>;
