"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { uniqueOrgSlug } from "@/lib/auth/slug";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

export type AuthActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function registerAction(
  input: RegisterInput,
): Promise<AuthActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Palun paranda vormi vead",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, password, companyName } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      ok: false,
      error: "Selle e-posti aadressiga konto on juba olemas",
      fieldErrors: { email: ["Selle e-posti aadressiga konto on juba olemas"] },
    };
  }

  const passwordHash = await hashPassword(password);
  const slug = uniqueOrgSlug(companyName);

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
        },
      });

      const organization = await tx.organization.create({
        data: {
          name: companyName,
          slug,
        },
      });

      await tx.membership.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "OWNER",
        },
      });
    });
  } catch {
    return {
      ok: false,
      error: "Registreerimine ebaõnnestus. Proovi uuesti.",
    };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        ok: false,
        error:
          "Konto loodi, kuid sisselogimine ebaõnnestus. Palun logi sisse käsitsi.",
      };
    }
    throw error;
  }

  return { ok: true };
}

export async function loginAction(input: {
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  try {
    await signIn("credentials", {
      email: input.email,
      password: input.password,
      redirect: false,
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        ok: false,
        error: "Vale e-post või parool",
      };
    }
    throw error;
  }
}
