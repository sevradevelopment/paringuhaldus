"use server";

import { revalidatePath } from "next/cache";
import type { InquiryPriority, InquiryStatus, Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { MONTHLY_INQUIRY_LIMIT } from "@/lib/inquiries/constants";
import {
  inquiryStatusLabel,
  inquiryPriorityLabel,
} from "@/lib/inquiries/labels";
import { countInquiriesCreatedThisMonth } from "@/lib/inquiries/queries";
import {
  inquiryFormSchema,
  inquiryIdSchema,
  inquiryNoteSchema,
  inquiryStatusUpdateSchema,
  type InquiryFormInput,
} from "@/lib/validations/inquiry";

export type InquiryActionResult =
  | { ok: true; inquiryId?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

async function requireTenant() {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return null;
  }
  return {
    userId: session.user.id,
    organizationId: session.user.organizationId,
  };
}

function revalidateInquiryPaths(inquiryId?: string) {
  revalidatePath("/app");
  revalidatePath("/app/paringud");
  if (inquiryId) {
    revalidatePath(`/app/paringud/${inquiryId}`);
    revalidatePath(`/app/paringud/${inquiryId}/muuda`);
  }
}

async function resolveClientId(
  tx: Prisma.TransactionClient,
  organizationId: string,
  input: InquiryFormInput,
): Promise<string | null> {
  if (input.clientId && input.clientId !== "__new__") {
    const existing = await tx.client.findFirst({
      where: { id: input.clientId, organizationId },
      select: { id: true },
    });
    if (!existing) {
      throw new Error("CLIENT_NOT_FOUND");
    }
    return existing.id;
  }

  if (input.clientId === "__new__") {
    const name = input.newClientName.trim();
    if (!name) {
      throw new Error("CLIENT_NAME_REQUIRED");
    }
    const created = await tx.client.create({
      data: {
        organizationId,
        name,
        email: input.newClientEmail.trim() || null,
        phone: input.newClientPhone.trim() || null,
      },
      select: { id: true },
    });
    return created.id;
  }

  return null;
}

export async function createInquiryAction(
  input: InquiryFormInput,
): Promise<InquiryActionResult> {
  const tenant = await requireTenant();
  if (!tenant) {
    return { ok: false, error: "Sessioon aegus. Palun logi uuesti sisse." };
  }

  const parsed = inquiryFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Palun paranda vormi vead",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const createdThisMonth = await countInquiriesCreatedThisMonth(
    tenant.organizationId,
  );
  if (createdThisMonth >= MONTHLY_INQUIRY_LIMIT) {
    return {
      ok: false,
      error: `Starteri limiit on täis: sellel kalendrikuul saab luua kuni ${MONTHLY_INQUIRY_LIMIT} uut päringut. Proovi uuesti järgmisel kuul või uuenda plaani.`,
    };
  }

  try {
    const inquiry = await prisma.$transaction(async (tx) => {
      const clientId = await resolveClientId(
        tx,
        tenant.organizationId,
        parsed.data,
      );

      const created = await tx.inquiry.create({
        data: {
          organizationId: tenant.organizationId,
          title: parsed.data.title.trim(),
          description: parsed.data.description?.trim() || null,
          status: parsed.data.status,
          priority: parsed.data.priority,
          clientId,
        },
      });

      await tx.inquiryActivity.create({
        data: {
          organizationId: tenant.organizationId,
          inquiryId: created.id,
          actorId: tenant.userId,
          type: "CREATED",
          message: "Päring loodi",
          meta: {
            status: created.status,
            priority: created.priority,
            clientId,
          },
        },
      });

      if (clientId) {
        await tx.inquiryActivity.create({
          data: {
            organizationId: tenant.organizationId,
            inquiryId: created.id,
            actorId: tenant.userId,
            type: "CLIENT_LINKED",
            message: "Klient seoti päringuga",
            meta: { clientId },
          },
        });
      }

      return created;
    });

    revalidateInquiryPaths(inquiry.id);
    return { ok: true, inquiryId: inquiry.id };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "CLIENT_NOT_FOUND") {
        return { ok: false, error: "Valitud klienti ei leitud" };
      }
      if (error.message === "CLIENT_NAME_REQUIRED") {
        return {
          ok: false,
          error: "Uue kliendi nimi on kohustuslik",
          fieldErrors: { newClientName: ["Uue kliendi nimi on kohustuslik"] },
        };
      }
    }
    return { ok: false, error: "Päringu loomine ebaõnnestus. Proovi uuesti." };
  }
}

export async function updateInquiryAction(
  inquiryId: string,
  input: InquiryFormInput,
): Promise<InquiryActionResult> {
  const tenant = await requireTenant();
  if (!tenant) {
    return { ok: false, error: "Sessioon aegus. Palun logi uuesti sisse." };
  }

  const idParsed = inquiryIdSchema.safeParse({ inquiryId });
  if (!idParsed.success) {
    return { ok: false, error: "Vigane päringu ID" };
  }

  const parsed = inquiryFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Palun paranda vormi vead",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const existing = await prisma.inquiry.findFirst({
    where: {
      id: inquiryId,
      organizationId: tenant.organizationId,
    },
  });
  if (!existing) {
    return { ok: false, error: "Päringut ei leitud" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const clientId = await resolveClientId(
        tx,
        tenant.organizationId,
        parsed.data,
      );

      const updated = await tx.inquiry.update({
        where: { id: inquiryId },
        data: {
          title: parsed.data.title.trim(),
          description: parsed.data.description?.trim() || null,
          status: parsed.data.status,
          priority: parsed.data.priority,
          clientId,
        },
      });

      const changes: string[] = [];
      if (existing.title !== updated.title) changes.push("pealkiri");
      if ((existing.description ?? "") !== (updated.description ?? "")) {
        changes.push("kirjeldus");
      }
      if (existing.priority !== updated.priority) {
        changes.push(
          `prioriteet → ${inquiryPriorityLabel[updated.priority as InquiryPriority]}`,
        );
      }
      if (existing.clientId !== updated.clientId) {
        changes.push("klient");
      }

      if (existing.status !== updated.status) {
        await tx.inquiryActivity.create({
          data: {
            organizationId: tenant.organizationId,
            inquiryId,
            actorId: tenant.userId,
            type: "STATUS_CHANGED",
            message: `Staatus: ${inquiryStatusLabel[existing.status]} → ${inquiryStatusLabel[updated.status]}`,
            meta: {
              from: existing.status,
              to: updated.status,
            },
          },
        });
      }

      if (changes.length > 0) {
        await tx.inquiryActivity.create({
          data: {
            organizationId: tenant.organizationId,
            inquiryId,
            actorId: tenant.userId,
            type: "UPDATED",
            message: `Uuendatud: ${changes.join(", ")}`,
          },
        });
      }

      if (existing.clientId !== clientId && clientId) {
        await tx.inquiryActivity.create({
          data: {
            organizationId: tenant.organizationId,
            inquiryId,
            actorId: tenant.userId,
            type: "CLIENT_LINKED",
            message: "Klient seoti päringuga",
            meta: { clientId },
          },
        });
      }
    });

    revalidateInquiryPaths(inquiryId);
    return { ok: true, inquiryId };
  } catch (error) {
    if (error instanceof Error && error.message === "CLIENT_NOT_FOUND") {
      return { ok: false, error: "Valitud klienti ei leitud" };
    }
    return {
      ok: false,
      error: "Päringu salvestamine ebaõnnestus. Proovi uuesti.",
    };
  }
}

export async function updateInquiryStatusAction(input: {
  inquiryId: string;
  status: InquiryStatus;
}): Promise<InquiryActionResult> {
  const tenant = await requireTenant();
  if (!tenant) {
    return { ok: false, error: "Sessioon aegus. Palun logi uuesti sisse." };
  }

  const parsed = inquiryStatusUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Vigased andmed" };
  }

  const existing = await prisma.inquiry.findFirst({
    where: {
      id: parsed.data.inquiryId,
      organizationId: tenant.organizationId,
    },
  });
  if (!existing) {
    return { ok: false, error: "Päringut ei leitud" };
  }

  if (existing.status === parsed.data.status) {
    return { ok: true, inquiryId: existing.id };
  }

  await prisma.$transaction(async (tx) => {
    await tx.inquiry.update({
      where: { id: existing.id },
      data: { status: parsed.data.status },
    });
    await tx.inquiryActivity.create({
      data: {
        organizationId: tenant.organizationId,
        inquiryId: existing.id,
        actorId: tenant.userId,
        type: "STATUS_CHANGED",
        message: `Staatus: ${inquiryStatusLabel[existing.status]} → ${inquiryStatusLabel[parsed.data.status]}`,
        meta: { from: existing.status, to: parsed.data.status },
      },
    });
  });

  revalidateInquiryPaths(existing.id);
  return { ok: true, inquiryId: existing.id };
}

export async function addInquiryNoteAction(input: {
  inquiryId: string;
  body: string;
}): Promise<InquiryActionResult> {
  const tenant = await requireTenant();
  if (!tenant) {
    return { ok: false, error: "Sessioon aegus. Palun logi uuesti sisse." };
  }

  const parsed = inquiryNoteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Palun paranda vormi vead",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const existing = await prisma.inquiry.findFirst({
    where: {
      id: parsed.data.inquiryId,
      organizationId: tenant.organizationId,
    },
    select: { id: true },
  });
  if (!existing) {
    return { ok: false, error: "Päringut ei leitud" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.inquiryNote.create({
      data: {
        organizationId: tenant.organizationId,
        inquiryId: existing.id,
        authorId: tenant.userId,
        body: parsed.data.body,
      },
    });
    await tx.inquiryActivity.create({
      data: {
        organizationId: tenant.organizationId,
        inquiryId: existing.id,
        actorId: tenant.userId,
        type: "NOTE_ADDED",
        message: "Lisati märkus",
      },
    });
  });

  revalidateInquiryPaths(existing.id);
  return { ok: true, inquiryId: existing.id };
}

export async function archiveInquiryAction(
  inquiryId: string,
): Promise<InquiryActionResult> {
  const tenant = await requireTenant();
  if (!tenant) {
    return { ok: false, error: "Sessioon aegus. Palun logi uuesti sisse." };
  }

  const parsed = inquiryIdSchema.safeParse({ inquiryId });
  if (!parsed.success) {
    return { ok: false, error: "Vigane päringu ID" };
  }

  const existing = await prisma.inquiry.findFirst({
    where: {
      id: inquiryId,
      organizationId: tenant.organizationId,
    },
  });
  if (!existing) {
    return { ok: false, error: "Päringut ei leitud" };
  }

  if (existing.archivedAt) {
    return { ok: true, inquiryId };
  }

  await prisma.$transaction(async (tx) => {
    await tx.inquiry.update({
      where: { id: inquiryId },
      data: { archivedAt: new Date() },
    });
    await tx.inquiryActivity.create({
      data: {
        organizationId: tenant.organizationId,
        inquiryId,
        actorId: tenant.userId,
        type: "ARCHIVED",
        message: "Päring arhiveeriti",
      },
    });
  });

  revalidateInquiryPaths(inquiryId);
  return { ok: true, inquiryId };
}

export async function restoreInquiryAction(
  inquiryId: string,
): Promise<InquiryActionResult> {
  const tenant = await requireTenant();
  if (!tenant) {
    return { ok: false, error: "Sessioon aegus. Palun logi uuesti sisse." };
  }

  const parsed = inquiryIdSchema.safeParse({ inquiryId });
  if (!parsed.success) {
    return { ok: false, error: "Vigane päringu ID" };
  }

  const existing = await prisma.inquiry.findFirst({
    where: {
      id: inquiryId,
      organizationId: tenant.organizationId,
    },
  });
  if (!existing) {
    return { ok: false, error: "Päringut ei leitud" };
  }

  if (!existing.archivedAt) {
    return { ok: true, inquiryId };
  }

  await prisma.$transaction(async (tx) => {
    await tx.inquiry.update({
      where: { id: inquiryId },
      data: { archivedAt: null },
    });
    await tx.inquiryActivity.create({
      data: {
        organizationId: tenant.organizationId,
        inquiryId,
        actorId: tenant.userId,
        type: "RESTORED",
        message: "Päring taastati arhiivist",
      },
    });
  });

  revalidateInquiryPaths(inquiryId);
  return { ok: true, inquiryId };
}
