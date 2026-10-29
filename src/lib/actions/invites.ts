"use server";

import { createHash } from "crypto";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";
import { getMaxUsers } from "@/lib/billing/plans";
import { z } from "zod";

const acceptSchema = z.object({
  token: z.string().min(20),
  name: z.string().trim().min(2).max(120),
  password: z.string().min(8).max(128),
});

export type InviteActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function acceptInviteAction(input: {
  token: string;
  name: string;
  password: string;
}): Promise<InviteActionResult> {
  const parsed = acceptSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Palun kontrolli nime ja parooli." };
  }

  const tokenHash = createHash("sha256")
    .update(parsed.data.token)
    .digest("hex");

  const invite = await prisma.organizationInvite.findFirst({
    where: {
      tokenHash,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { organization: true },
  });

  if (!invite) {
    return { ok: false, error: "Kutse on vigane või aegunud." };
  }

  const maxUsers = getMaxUsers(invite.organization.plan);
  const memberCount = await prisma.membership.count({
    where: { organizationId: invite.organizationId },
  });
  if (maxUsers !== null && memberCount >= maxUsers) {
    return {
      ok: false,
      error: "Organisatsiooni kasutajalimiit on täis. Palu adminil paketti uuendada.",
    };
  }

  const email = invite.email.toLowerCase();
  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const valid = await verifyPassword(
      parsed.data.password,
      user.passwordHash,
    );
    if (!valid) {
      return {
        ok: false,
        error: "Konto on juba olemas — sisesta oma praegune parool.",
      };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (!user) {
        user = await tx.user.create({
          data: {
            email,
            name: parsed.data.name,
            passwordHash: await hashPassword(parsed.data.password),
          },
        });
      } else {
        const existingMembership = await tx.membership.findUnique({
          where: {
            userId_organizationId: {
              userId: user.id,
              organizationId: invite.organizationId,
            },
          },
        });
        if (existingMembership) {
          throw new Error("ALREADY_MEMBER");
        }
        if (parsed.data.name.trim()) {
          await tx.user.update({
            where: { id: user.id },
            data: { name: parsed.data.name.trim() },
          });
        }
      }

      await tx.membership.create({
        data: {
          userId: user!.id,
          organizationId: invite.organizationId,
          role: invite.role,
        },
      });

      await tx.organizationInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ALREADY_MEMBER") {
      return { ok: false, error: "Oled juba selle organisatsiooni liige." };
    }
    return { ok: false, error: "Kutse vastuvõtmine ebaõnnestus." };
  }

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        ok: false,
        error: "Konto loodi, kuid sisselogimine ebaõnnestus. Proovi sisse logida.",
      };
    }
  }

  return { ok: true };
}

export async function getInvitePreview(token: string) {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return prisma.organizationInvite.findFirst({
    where: {
      tokenHash,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      organization: { select: { name: true } },
    },
  });
}
