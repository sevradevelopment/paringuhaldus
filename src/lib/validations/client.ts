import { z } from "zod";

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message);

const optionalEmail = z.union([
  z.literal(""),
  z.string().trim().email("Palun sisesta kehtiv e-post"),
]);

export const clientFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nimi peab olema vähemalt 2 tähemärki")
    .max(200, "Nimi on liiga pikk"),
  companyName: optionalText(200, "Ettevõtte nimi on liiga pikk"),
  email: optionalEmail,
  phone: optionalText(50, "Telefon on liiga pikk"),
  registryCode: optionalText(50, "Registrikood on liiga pikk"),
  notes: optionalText(10000, "Märkmed on liiga pikad"),
  confirmDuplicate: z.boolean().optional(),
});

export const clientIdSchema = z.object({
  clientId: z.string().cuid(),
});

export type ClientFormInput = z.infer<typeof clientFormSchema>;
