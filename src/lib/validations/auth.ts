import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nimi peab olema vähemalt 2 tähemärki")
    .max(100, "Nimi on liiga pikk"),
  email: z
    .string()
    .trim()
    .email("Sisesta kehtiv e-posti aadress")
    .max(255, "E-posti aadress on liiga pikk"),
  password: z
    .string()
    .min(8, "Parool peab olema vähemalt 8 tähemärki")
    .max(128, "Parool on liiga pikk"),
  companyName: z
    .string()
    .trim()
    .min(2, "Ettevõtte nimi peab olema vähemalt 2 tähemärki")
    .max(150, "Ettevõtte nimi on liiga pikk"),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Sisesta kehtiv e-posti aadress")
    .max(255, "E-posti aadress on liiga pikk"),
  password: z
    .string()
    .min(1, "Parool on kohustuslik")
    .max(128, "Parool on liiga pikk"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
