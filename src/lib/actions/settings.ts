"use server";

import { createHash, randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import type { MembershipRole } from "@prisma/client";
import { auth } from "@/auth";
import { getMaxUsers } from "@/lib/billing/plans";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";
import {
  getEmailFrom,
  getResendClient,
  isEmailConfigured,
} from "@/lib/email/resend";
import {
  companyProfileSchema,
  inviteSchema,
  membershipIdSchema,
  membershipRoleUpdateSchema,
  passwordChangeSchema,
  personalProfileSchema,
  type CompanyProfileInput,
  type InviteInput,
  type PasswordChangeInput,
  type PersonalProfileInput,
} from "@/lib/validations/settings";

export type SettingsActionResult =
  | { ok: true; inviteUrl?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

async function requireTenant() {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) return null;
  return {
    userId: session.user.id,
    organizationId: session.user.organizationId,
    role: (session.user.role as MembershipRole | null) ?? null,
  };
}

function revalidateSettings() {
  revalidatePath("/app");
  revalidatePath("/app/seaded");
  revalidatePath("/app/seaded/ettevote");
  revalidatePath("/app/seaded/profiil");
  revalidatePath("/app/seaded/meeskond");
  revalidatePath("/app/seaded/tellimus");
}

async function requireAdmin(tenant: {
  userId: string;
  organizationId: string;
}) {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: tenant.userId,
        organizationId: tenant.organizationId,
      },
    },
  });
  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    return null;
  }
  return membership;
}

export async function updateCompanyProfileAction(
  input: CompanyProfileInput,
): Promise<SettingsActionResult> {
  const tenant = await requireTenant();
  if (!tenant) {
    return { ok: false, error: "Sessioon aegus. Palun logi uuesti sisse." };
  }
  const admin = await requireAdmin(tenant);
  if (!admin) {
    return { ok: false, error: "Ainult omanik või admin saab ettevõtet muuta." };
  }

  const parsed = companyProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Palun paranda vormi vead",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  await prisma.organization.update({
    where: { id: tenant.organizationId },
    data: {
      name: parsed.data.name.trim(),
      registryCode: parsed.data.registryCode.trim() || null,
      vatNumber: parsed.data.vatNumber.trim() || null,
      address: parsed.data.address.trim() || null,
      email: parsed.data.email.trim().toLowerCase() || null,
      phone: parsed.data.phone.trim() || null,
    },
  });

  revalidateSettings();
  return { ok: true };
}

export async function uploadCompanyLogoAction(
  formData: FormData,
): Promise<SettingsActionResult> {
  const tenant = await requireTenant();
  if (!tenant) {
    return { ok: false, error: "Sessioon aegus. Palun logi uuesti sisse." };
  }
  const admin = await requireAdmin(tenant);
  if (!admin) {
    return { ok: false, error: "Ainult omanik või admin saab logo üles laadida." };
  }

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Palun vali logo fail." };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { ok: false, error: "Logo peab olema alla 2 MB." };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Logo peab olema pildifail." };
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    return {
      ok: false,
      error:
        "Logo üleslaadimine pole seadistatud (BLOB_READ_WRITE_TOKEN puudub). Lisa Vercel Blob token.",
    };
  }

  try {
    const blob = await put(
      `org-logos/${tenant.organizationId}/${Date.now()}-${file.name}`,
      file,
      { access: "public", token: process.env.BLOB_READ_WRITE_TOKEN },
    );
    await prisma.organization.update({
      where: { id: tenant.organizationId },
      data: { logoUrl: blob.url },
    });
    revalidateSettings();
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Logo üleslaadimine ebaõnnestus";
    return { ok: false, error: message };
  }
}

export async function updatePersonalProfileAction(
  input: PersonalProfileInput,
): Promise<SettingsActionResult> {
  const tenant = await requireTenant();
  if (!tenant) {
    return { ok: false, error: "Sessioon aegus. Palun logi uuesti sisse." };
  }

  const parsed = personalProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Palun paranda vormi vead",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const existing = await prisma.user.findFirst({
    where: { email, NOT: { id: tenant.userId } },
    select: { id: true },
  });
  if (existing) {
    return {
      ok: false,
      error: "See e-post on juba kasutusel",
      fieldErrors: { email: ["See e-post on juba kasutusel"] },
    };
  }

  await prisma.user.update({
    where: { id: tenant.userId },
    data: { name: parsed.data.name.trim(), email },
  });

  revalidateSettings();
  return { ok: true };
}

export async function changePasswordAction(
  input: PasswordChangeInput,
): Promise<SettingsActionResult> {
  const tenant = await requireTenant();
  if (!tenant) {
    return { ok: false, error: "Sessioon aegus. Palun logi uuesti sisse." };
  }

  const parsed = passwordChangeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Palun paranda vormi vead",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: tenant.userId },
    select: { passwordHash: true },
  });
  if (!user) return { ok: false, error: "Kasutajat ei leitud" };

  const ok = await verifyPassword(
    parsed.data.currentPassword,
    user.passwordHash,
  );
  if (!ok) {
    return {
      ok: false,
      error: "Praegune parool on vale",
      fieldErrors: { currentPassword: ["Praegune parool on vale"] },
    };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({
    where: { id: tenant.userId },
    data: { passwordHash },
  });

  return { ok: true };
}

export async function inviteTeamMemberAction(
  input: InviteInput,
): Promise<SettingsActionResult> {
  const tenant = await requireTenant();
  if (!tenant) {
    return { ok: false, error: "Sessioon aegus. Palun logi uuesti sisse." };
  }
  const admin = await requireAdmin(tenant);
  if (!admin) {
    return { ok: false, error: "Ainult omanik või admin saab kutsuda." };
  }

  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Palun paranda vormi vead",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: tenant.organizationId },
  });
  const maxUsers = getMaxUsers(org.plan);
  const memberCount = await prisma.membership.count({
    where: { organizationId: tenant.organizationId },
  });
  const pendingInvites = await prisma.organizationInvite.count({
    where: {
      organizationId: tenant.organizationId,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (maxUsers !== null && memberCount + pendingInvites >= maxUsers) {
    return {
      ok: false,
      error: `Paketi limiit on täis (${maxUsers} kasutajat). Uuenda paketti või eemalda kasutaja.`,
    };
  }

  const existingMember = await prisma.membership.findFirst({
    where: {
      organizationId: tenant.organizationId,
      user: { email },
    },
  });
  if (existingMember) {
    return { ok: false, error: "See kasutaja on juba meeskonnas." };
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.organizationInvite.create({
    data: {
      organizationId: tenant.organizationId,
      email,
      role: parsed.data.role,
      tokenHash,
      expiresAt,
      invitedById: tenant.userId,
    },
  });

  const baseUrl =
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  const inviteUrl = `${baseUrl}/invite/${token}`;

  if (isEmailConfigured()) {
    const resend = getResendClient();
    if (resend) {
      const result = await resend.emails.send({
        from: getEmailFrom(),
        to: email,
        subject: `Kutse meeskonda: ${org.name}`,
        text: `Sind kutsuti organisatsiooni ${org.name}. Ava kutse: ${inviteUrl}`,
      });
      if (result.error) {
        revalidateSettings();
        return {
          ok: false,
          error: `Kutse salvestati, kuid e-posti saatmine ebaõnnestus: ${result.error.message}. Kutse link: ${inviteUrl}`,
          // Still expose link so admin can copy
        };
      }
    }
    revalidateSettings();
    return { ok: true };
  }

  revalidateSettings();
  return {
    ok: true,
    inviteUrl,
  };
}

export async function updateMemberRoleAction(input: {
  membershipId: string;
  role: MembershipRole;
}): Promise<SettingsActionResult> {
  const tenant = await requireTenant();
  if (!tenant) {
    return { ok: false, error: "Sessioon aegus. Palun logi uuesti sisse." };
  }
  const admin = await requireAdmin(tenant);
  if (!admin) {
    return { ok: false, error: "Puudub õigus rolle muuta." };
  }

  const parsed = membershipRoleUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Vigased andmed" };

  const membership = await prisma.membership.findFirst({
    where: {
      id: parsed.data.membershipId,
      organizationId: tenant.organizationId,
    },
  });
  if (!membership) return { ok: false, error: "Liiget ei leitud" };

  if (membership.role === "OWNER" && parsed.data.role !== "OWNER") {
    const ownerCount = await prisma.membership.count({
      where: { organizationId: tenant.organizationId, role: "OWNER" },
    });
    if (ownerCount <= 1) {
      return { ok: false, error: "Viimast omanikku ei saa alandada." };
    }
  }

  if (admin.role !== "OWNER" && parsed.data.role === "OWNER") {
    return { ok: false, error: "Ainult omanik saab teha teise omanikuks." };
  }

  await prisma.membership.update({
    where: { id: membership.id },
    data: { role: parsed.data.role },
  });

  revalidateSettings();
  return { ok: true };
}

export async function removeMemberAction(input: {
  membershipId: string;
}): Promise<SettingsActionResult> {
  const tenant = await requireTenant();
  if (!tenant) {
    return { ok: false, error: "Sessioon aegus. Palun logi uuesti sisse." };
  }
  const admin = await requireAdmin(tenant);
  if (!admin) {
    return { ok: false, error: "Puudub õigus liikmeid eemaldada." };
  }

  const parsed = membershipIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Vigased andmed" };

  const membership = await prisma.membership.findFirst({
    where: {
      id: parsed.data.membershipId,
      organizationId: tenant.organizationId,
    },
  });
  if (!membership) return { ok: false, error: "Liiget ei leitud" };

  if (membership.userId === tenant.userId) {
    return { ok: false, error: "Ennast ei saa eemaldada." };
  }

  if (membership.role === "OWNER") {
    const ownerCount = await prisma.membership.count({
      where: { organizationId: tenant.organizationId, role: "OWNER" },
    });
    if (ownerCount <= 1) {
      return { ok: false, error: "Viimast omanikku ei saa eemaldada." };
    }
  }

  await prisma.membership.delete({ where: { id: membership.id } });
  revalidateSettings();
  return { ok: true };
}
