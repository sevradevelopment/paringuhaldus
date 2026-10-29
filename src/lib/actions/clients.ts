"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { findDuplicateClientHints } from "@/lib/clients/queries";
import { prisma } from "@/lib/db";
import {
  clientFormSchema,
  clientIdSchema,
  type ClientFormInput,
} from "@/lib/validations/client";

export type ClientActionResult =
  | { ok: true; clientId?: string }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
      duplicateWarning?: {
        kind: "email" | "company";
        clientId: string;
        clientName: string;
      };
    };

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

function revalidateClientPaths(clientId?: string) {
  revalidatePath("/app");
  revalidatePath("/app/kliendid");
  revalidatePath("/app/paringud");
  if (clientId) {
    revalidatePath(`/app/kliendid/${clientId}`);
    revalidatePath(`/app/kliendid/${clientId}/muuda`);
  }
}

function normalizeClientData(data: ClientFormInput) {
  const email = data.email.trim().toLowerCase();
  return {
    name: data.name.trim(),
    companyName: data.companyName.trim() || null,
    email: email || null,
    phone: data.phone.trim() || null,
    registryCode: data.registryCode.trim() || null,
    notes: data.notes.trim() || null,
  };
}

async function checkDuplicates(
  organizationId: string,
  data: ReturnType<typeof normalizeClientData>,
  confirmDuplicate: boolean | undefined,
  excludeClientId?: string,
): Promise<ClientActionResult | null> {
  const hints = await findDuplicateClientHints(organizationId, {
    email: data.email,
    companyName: data.companyName,
    excludeClientId,
  });

  if (hints.emailMatch) {
    return {
      ok: false,
      error: `Sama e-postiga klient on juba olemas: ${hints.emailMatch.name}. Kasuta olemasolevat klienti või muuda e-posti.`,
      duplicateWarning: {
        kind: "email",
        clientId: hints.emailMatch.id,
        clientName: hints.emailMatch.name,
      },
    };
  }

  if (hints.companyMatch && !confirmDuplicate) {
    return {
      ok: false,
      error: `Sarnase ettevõtte nimega klient on juba olemas: ${hints.companyMatch.name}. Kui soovid siiski jätkata, kinnita duplikaat.`,
      duplicateWarning: {
        kind: "company",
        clientId: hints.companyMatch.id,
        clientName: hints.companyMatch.name,
      },
    };
  }

  return null;
}

export async function createClientAction(
  input: ClientFormInput,
): Promise<ClientActionResult> {
  const tenant = await requireTenant();
  if (!tenant) {
    return { ok: false, error: "Sessioon aegus. Palun logi uuesti sisse." };
  }

  const parsed = clientFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Palun paranda vormi vead",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = normalizeClientData(parsed.data);
  const duplicate = await checkDuplicates(
    tenant.organizationId,
    data,
    parsed.data.confirmDuplicate,
  );
  if (duplicate) {
    return duplicate;
  }

  try {
    const client = await prisma.$transaction(async (tx) => {
      const created = await tx.client.create({
        data: {
          organizationId: tenant.organizationId,
          ...data,
        },
      });

      await tx.clientActivity.create({
        data: {
          organizationId: tenant.organizationId,
          clientId: created.id,
          actorId: tenant.userId,
          type: "CREATED",
          message: "Klient loodi",
        },
      });

      return created;
    });

    revalidateClientPaths(client.id);
    return { ok: true, clientId: client.id };
  } catch {
    return { ok: false, error: "Kliendi loomine ebaõnnestus. Proovi uuesti." };
  }
}

export async function updateClientAction(
  clientId: string,
  input: ClientFormInput,
): Promise<ClientActionResult> {
  const tenant = await requireTenant();
  if (!tenant) {
    return { ok: false, error: "Sessioon aegus. Palun logi uuesti sisse." };
  }

  const idParsed = clientIdSchema.safeParse({ clientId });
  if (!idParsed.success) {
    return { ok: false, error: "Vigane kliendi ID" };
  }

  const parsed = clientFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Palun paranda vormi vead",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const existing = await prisma.client.findFirst({
    where: { id: clientId, organizationId: tenant.organizationId },
  });
  if (!existing) {
    return { ok: false, error: "Klienti ei leitud" };
  }

  const data = normalizeClientData(parsed.data);
  const duplicate = await checkDuplicates(
    tenant.organizationId,
    data,
    parsed.data.confirmDuplicate,
    clientId,
  );
  if (duplicate) {
    return duplicate;
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.client.update({
        where: { id: clientId },
        data,
      });

      const changes: string[] = [];
      if (existing.name !== data.name) changes.push("nimi");
      if ((existing.companyName ?? "") !== (data.companyName ?? "")) {
        changes.push("ettevõte");
      }
      if ((existing.email ?? "") !== (data.email ?? "")) changes.push("e-post");
      if ((existing.phone ?? "") !== (data.phone ?? "")) changes.push("telefon");
      if ((existing.registryCode ?? "") !== (data.registryCode ?? "")) {
        changes.push("registrikood");
      }
      if ((existing.notes ?? "") !== (data.notes ?? "")) changes.push("märkmed");

      if (changes.length > 0) {
        await tx.clientActivity.create({
          data: {
            organizationId: tenant.organizationId,
            clientId,
            actorId: tenant.userId,
            type: "UPDATED",
            message: `Uuendatud: ${changes.join(", ")}`,
          },
        });
      }
    });

    revalidateClientPaths(clientId);
    return { ok: true, clientId };
  } catch {
    return {
      ok: false,
      error: "Kliendi salvestamine ebaõnnestus. Proovi uuesti.",
    };
  }
}

export async function archiveClientAction(
  clientId: string,
): Promise<ClientActionResult> {
  const tenant = await requireTenant();
  if (!tenant) {
    return { ok: false, error: "Sessioon aegus. Palun logi uuesti sisse." };
  }

  const parsed = clientIdSchema.safeParse({ clientId });
  if (!parsed.success) {
    return { ok: false, error: "Vigane kliendi ID" };
  }

  const existing = await prisma.client.findFirst({
    where: { id: clientId, organizationId: tenant.organizationId },
  });
  if (!existing) {
    return { ok: false, error: "Klienti ei leitud" };
  }

  if (existing.archivedAt) {
    return { ok: true, clientId };
  }

  await prisma.$transaction(async (tx) => {
    await tx.client.update({
      where: { id: clientId },
      data: { archivedAt: new Date() },
    });
    await tx.clientActivity.create({
      data: {
        organizationId: tenant.organizationId,
        clientId,
        actorId: tenant.userId,
        type: "ARCHIVED",
        message: "Klient arhiveeriti",
      },
    });
  });

  revalidateClientPaths(clientId);
  return { ok: true, clientId };
}

export async function restoreClientAction(
  clientId: string,
): Promise<ClientActionResult> {
  const tenant = await requireTenant();
  if (!tenant) {
    return { ok: false, error: "Sessioon aegus. Palun logi uuesti sisse." };
  }

  const parsed = clientIdSchema.safeParse({ clientId });
  if (!parsed.success) {
    return { ok: false, error: "Vigane kliendi ID" };
  }

  const existing = await prisma.client.findFirst({
    where: { id: clientId, organizationId: tenant.organizationId },
  });
  if (!existing) {
    return { ok: false, error: "Klienti ei leitud" };
  }

  if (!existing.archivedAt) {
    return { ok: true, clientId };
  }

  await prisma.$transaction(async (tx) => {
    await tx.client.update({
      where: { id: clientId },
      data: { archivedAt: null },
    });
    await tx.clientActivity.create({
      data: {
        organizationId: tenant.organizationId,
        clientId,
        actorId: tenant.userId,
        type: "RESTORED",
        message: "Klient taastati arhiivist",
      },
    });
  });

  revalidateClientPaths(clientId);
  return { ok: true, clientId };
}
