import { z } from "zod";

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message);

const optionalEmail = z.union([
  z.literal(""),
  z.string().trim().email("Palun sisesta kehtiv e-post"),
]);

export const companyProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Ettevõtte nimi peab olema vähemalt 2 tähemärki")
    .max(200, "Nimi on liiga pikk"),
  registryCode: optionalText(50, "Registrikood on liiga pikk"),
  vatNumber: optionalText(50, "KMKR number on liiga pikk"),
  address: optionalText(500, "Aadress on liiga pikk"),
  email: optionalEmail,
  phone: optionalText(50, "Telefon on liiga pikk"),
});

export const personalProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nimi peab olema vähemalt 2 tähemärki")
    .max(120, "Nimi on liiga pikk"),
  email: z.string().trim().email("Palun sisesta kehtiv e-post"),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Praegune parool on kohustuslik"),
    newPassword: z
      .string()
      .min(8, "Uus parool peab olema vähemalt 8 tähemärki")
      .max(128, "Parool on liiga pikk"),
    confirmPassword: z.string().min(1, "Kinnitus on kohustuslik"),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Paroolid ei kattu",
      });
    }
  });

export const inviteSchema = z.object({
  email: z.string().trim().email("Palun sisesta kehtiv e-post"),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export const membershipRoleUpdateSchema = z.object({
  membershipId: z.string().cuid(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
});

export const membershipIdSchema = z.object({
  membershipId: z.string().cuid(),
});

export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;
export type PersonalProfileInput = z.infer<typeof personalProfileSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type InviteInput = z.infer<typeof inviteSchema>;
