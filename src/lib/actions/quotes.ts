"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { canExportPdf } from "@/lib/billing/plans";
import { prisma } from "@/lib/db";
import { getEmailFrom, getResendClient, isEmailConfigured } from "@/lib/email/resend";
import { quoteStatusLabel } from "@/lib/quotes/labels";
import { computeQuoteTotals, decimalToString } from "@/lib/quotes/money";
import { buildQuotePdfBuffer } from "@/lib/quotes/pdf";
import { nextQuoteNumber } from "@/lib/quotes/queries";
import {
  quoteFormSchema,
  quoteIdSchema,
  quoteSendSchema,
  type QuoteFormInput,
} from "@/lib/validations/quote";

export type QuoteActionResult =
  | { ok: true; quoteId?: string; pdfBase64?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

async function requireTenant() {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) return null;
  return {
    userId: session.user.id,
    organizationId: session.user.organizationId,
  };
}

function revalidateQuotePaths(quoteId?: string) {
  revalidatePath("/app");
  revalidatePath("/app/hinnapakkumised");
  if (quoteId) {
    revalidatePath(`/app/hinnapakkumised/${quoteId}`);
    revalidatePath(`/app/hinnapakkumised/${quoteId}/muuda`);
  }
}

function parseDate(value: string): Date | null {
  if (!value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function assertClientAndInquiry(
  organizationId: string,
  clientId: string | null,
  inquiryId: string | null,
) {
  if (clientId) {
    const client = await prisma.client.findFirst({
      where: { id: clientId, organizationId },
      select: { id: true },
    });
    if (!client) throw new Error("CLIENT_NOT_FOUND");
  }
  if (inquiryId) {
    const inquiry = await prisma.inquiry.findFirst({
      where: { id: inquiryId, organizationId },
      select: { id: true, clientId: true },
    });
    if (!inquiry) throw new Error("INQUIRY_NOT_FOUND");
  }
}

function lineCreateData(
  organizationId: string,
  totals: ReturnType<typeof computeQuoteTotals>,
) {
  return totals.lines.map((line, index) => ({
    organizationId,
    name: line.name,
    quantity: new Prisma.Decimal(line.quantity.toString()),
    unitPrice: new Prisma.Decimal(line.unitPrice.toString()),
    vatRate: new Prisma.Decimal(line.vatRate.toString()),
    lineSubtotal: new Prisma.Decimal(decimalToString(line.lineSubtotal)),
    lineVat: new Prisma.Decimal(decimalToString(line.lineVat)),
    lineTotal: new Prisma.Decimal(decimalToString(line.lineTotal)),
    position: index,
  }));
}

export async function createQuoteAction(
  input: QuoteFormInput,
): Promise<QuoteActionResult> {
  const tenant = await requireTenant();
  if (!tenant) {
    return { ok: false, error: "Sessioon aegus. Palun logi uuesti sisse." };
  }

  const parsed = quoteFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Palun paranda vormi vead",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const issueDate = parseDate(parsed.data.issueDate);
  if (!issueDate) {
    return {
      ok: false,
      error: "Vigane kuupäev",
      fieldErrors: { issueDate: ["Vigane kuupäev"] },
    };
  }

  const clientId = parsed.data.clientId || null;
  const inquiryId = parsed.data.inquiryId || null;
  const totals = computeQuoteTotals(parsed.data.lineItems);

  try {
    await assertClientAndInquiry(tenant.organizationId, clientId, inquiryId);
    const number = await nextQuoteNumber(tenant.organizationId);

    const quote = await prisma.$transaction(async (tx) => {
      const created = await tx.quote.create({
        data: {
          organizationId: tenant.organizationId,
          number,
          title: parsed.data.title.trim(),
          description: parsed.data.description.trim() || null,
          status: parsed.data.status,
          issueDate,
          validUntil: parseDate(parsed.data.validUntil),
          clientId,
          inquiryId,
          subtotal: new Prisma.Decimal(decimalToString(totals.subtotal)),
          vatTotal: new Prisma.Decimal(decimalToString(totals.vatTotal)),
          total: new Prisma.Decimal(decimalToString(totals.total)),
          lineItems: {
            create: lineCreateData(tenant.organizationId, totals),
          },
        },
      });

      await tx.quoteActivity.create({
        data: {
          organizationId: tenant.organizationId,
          quoteId: created.id,
          actorId: tenant.userId,
          type: "CREATED",
          message: `Hinnapakkumine ${created.number} loodi`,
        },
      });

      return created;
    });

    revalidateQuotePaths(quote.id);
    return { ok: true, quoteId: quote.id };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "CLIENT_NOT_FOUND") {
        return { ok: false, error: "Valitud klienti ei leitud" };
      }
      if (error.message === "INQUIRY_NOT_FOUND") {
        return { ok: false, error: "Valitud päringut ei leitud" };
      }
    }
    return { ok: false, error: "Hinnapakkumise loomine ebaõnnestus." };
  }
}

export async function updateQuoteAction(
  quoteId: string,
  input: QuoteFormInput,
): Promise<QuoteActionResult> {
  const tenant = await requireTenant();
  if (!tenant) {
    return { ok: false, error: "Sessioon aegus. Palun logi uuesti sisse." };
  }

  const idParsed = quoteIdSchema.safeParse({ quoteId });
  if (!idParsed.success) return { ok: false, error: "Vigane ID" };

  const parsed = quoteFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Palun paranda vormi vead",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const existing = await prisma.quote.findFirst({
    where: { id: quoteId, organizationId: tenant.organizationId },
  });
  if (!existing) return { ok: false, error: "Hinnapakkumist ei leitud" };

  // Confirmed quotes: create a new version instead of silent edit
  if (existing.status === "ACCEPTED") {
    return duplicateQuoteAsNewVersion(existing.id, tenant, parsed.data);
  }

  const issueDate = parseDate(parsed.data.issueDate);
  if (!issueDate) {
    return { ok: false, error: "Vigane kuupäev" };
  }

  const clientId = parsed.data.clientId || null;
  const inquiryId = parsed.data.inquiryId || null;
  const totals = computeQuoteTotals(parsed.data.lineItems);

  try {
    await assertClientAndInquiry(tenant.organizationId, clientId, inquiryId);

    await prisma.$transaction(async (tx) => {
      await tx.quoteLineItem.deleteMany({ where: { quoteId } });
      await tx.quote.update({
        where: { id: quoteId },
        data: {
          title: parsed.data.title.trim(),
          description: parsed.data.description.trim() || null,
          status: parsed.data.status,
          issueDate,
          validUntil: parseDate(parsed.data.validUntil),
          clientId,
          inquiryId,
          subtotal: new Prisma.Decimal(decimalToString(totals.subtotal)),
          vatTotal: new Prisma.Decimal(decimalToString(totals.vatTotal)),
          total: new Prisma.Decimal(decimalToString(totals.total)),
          lineItems: {
            create: lineCreateData(tenant.organizationId, totals),
          },
        },
      });

      await tx.quoteActivity.create({
        data: {
          organizationId: tenant.organizationId,
          quoteId,
          actorId: tenant.userId,
          type: "UPDATED",
          message: "Hinnapakkumine uuendati",
        },
      });

      if (existing.status !== parsed.data.status) {
        await tx.quoteActivity.create({
          data: {
            organizationId: tenant.organizationId,
            quoteId,
            actorId: tenant.userId,
            type: "STATUS_CHANGED",
            message: `Staatus: ${quoteStatusLabel[existing.status]} → ${quoteStatusLabel[parsed.data.status]}`,
          },
        });
      }
    });

    revalidateQuotePaths(quoteId);
    return { ok: true, quoteId };
  } catch {
    return { ok: false, error: "Salvestamine ebaõnnestus." };
  }
}

async function duplicateQuoteAsNewVersion(
  sourceId: string,
  tenant: { userId: string; organizationId: string },
  data: QuoteFormInput,
): Promise<QuoteActionResult> {
  const source = await prisma.quote.findFirst({
    where: { id: sourceId, organizationId: tenant.organizationId },
    include: { lineItems: true },
  });
  if (!source) return { ok: false, error: "Hinnapakkumist ei leitud" };

  const totals = computeQuoteTotals(data.lineItems);
  const number = await nextQuoteNumber(tenant.organizationId);
  const issueDate = parseDate(data.issueDate) ?? new Date();

  const created = await prisma.$transaction(async (tx) => {
    const quote = await tx.quote.create({
      data: {
        organizationId: tenant.organizationId,
        number,
        title: data.title.trim(),
        description: data.description.trim() || null,
        status: "PENDING",
        issueDate,
        validUntil: parseDate(data.validUntil),
        clientId: data.clientId || source.clientId,
        inquiryId: data.inquiryId || source.inquiryId,
        version: source.version + 1,
        rootQuoteId: source.rootQuoteId ?? source.id,
        subtotal: new Prisma.Decimal(decimalToString(totals.subtotal)),
        vatTotal: new Prisma.Decimal(decimalToString(totals.vatTotal)),
        total: new Prisma.Decimal(decimalToString(totals.total)),
        lineItems: {
          create: lineCreateData(tenant.organizationId, totals),
        },
      },
    });

    await tx.quoteActivity.create({
      data: {
        organizationId: tenant.organizationId,
        quoteId: quote.id,
        actorId: tenant.userId,
        type: "VERSIONED",
        message: `Uus versioon loodi kinnitatud pakkumise ${source.number} põhjal`,
        meta: { sourceQuoteId: source.id },
      },
    });

    return quote;
  });

  revalidateQuotePaths(created.id);
  return { ok: true, quoteId: created.id };
}

export async function duplicateQuoteAction(
  quoteId: string,
): Promise<QuoteActionResult> {
  const tenant = await requireTenant();
  if (!tenant) {
    return { ok: false, error: "Sessioon aegus. Palun logi uuesti sisse." };
  }

  const source = await prisma.quote.findFirst({
    where: { id: quoteId, organizationId: tenant.organizationId },
    include: { lineItems: { orderBy: { position: "asc" } } },
  });
  if (!source) return { ok: false, error: "Hinnapakkumist ei leitud" };

  const number = await nextQuoteNumber(tenant.organizationId);
  const created = await prisma.$transaction(async (tx) => {
    const quote = await tx.quote.create({
      data: {
        organizationId: tenant.organizationId,
        number,
        title: `${source.title} (koopia)`,
        description: source.description,
        status: "PENDING",
        issueDate: new Date(),
        validUntil: source.validUntil,
        clientId: source.clientId,
        inquiryId: source.inquiryId,
        subtotal: source.subtotal,
        vatTotal: source.vatTotal,
        total: source.total,
        lineItems: {
          create: source.lineItems.map((line, index) => ({
            organizationId: tenant.organizationId,
            name: line.name,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            vatRate: line.vatRate,
            lineSubtotal: line.lineSubtotal,
            lineVat: line.lineVat,
            lineTotal: line.lineTotal,
            position: index,
          })),
        },
      },
    });

    await tx.quoteActivity.create({
      data: {
        organizationId: tenant.organizationId,
        quoteId: quote.id,
        actorId: tenant.userId,
        type: "DUPLICATED",
        message: `Kopeeritud pakkumisest ${source.number}`,
        meta: { sourceQuoteId: source.id },
      },
    });

    return quote;
  });

  revalidateQuotePaths(created.id);
  return { ok: true, quoteId: created.id };
}

export async function archiveQuoteAction(
  quoteId: string,
): Promise<QuoteActionResult> {
  const tenant = await requireTenant();
  if (!tenant) {
    return { ok: false, error: "Sessioon aegus. Palun logi uuesti sisse." };
  }

  const existing = await prisma.quote.findFirst({
    where: { id: quoteId, organizationId: tenant.organizationId },
  });
  if (!existing) return { ok: false, error: "Hinnapakkumist ei leitud" };
  if (existing.archivedAt) return { ok: true, quoteId };

  await prisma.$transaction(async (tx) => {
    await tx.quote.update({
      where: { id: quoteId },
      data: { archivedAt: new Date() },
    });
    await tx.quoteActivity.create({
      data: {
        organizationId: tenant.organizationId,
        quoteId,
        actorId: tenant.userId,
        type: "ARCHIVED",
        message: "Hinnapakkumine arhiveeriti",
      },
    });
  });

  revalidateQuotePaths(quoteId);
  return { ok: true, quoteId };
}

export async function restoreQuoteAction(
  quoteId: string,
): Promise<QuoteActionResult> {
  const tenant = await requireTenant();
  if (!tenant) {
    return { ok: false, error: "Sessioon aegus. Palun logi uuesti sisse." };
  }

  const existing = await prisma.quote.findFirst({
    where: { id: quoteId, organizationId: tenant.organizationId },
  });
  if (!existing) return { ok: false, error: "Hinnapakkumist ei leitud" };
  if (!existing.archivedAt) return { ok: true, quoteId };

  await prisma.$transaction(async (tx) => {
    await tx.quote.update({
      where: { id: quoteId },
      data: { archivedAt: null },
    });
    await tx.quoteActivity.create({
      data: {
        organizationId: tenant.organizationId,
        quoteId,
        actorId: tenant.userId,
        type: "RESTORED",
        message: "Hinnapakkumine taastati arhiivist",
      },
    });
  });

  revalidateQuotePaths(quoteId);
  return { ok: true, quoteId };
}

export async function sendQuoteEmailAction(input: {
  quoteId: string;
  toEmail: string;
  subject: string;
  message?: string;
}): Promise<QuoteActionResult> {
  const tenant = await requireTenant();
  if (!tenant) {
    return { ok: false, error: "Sessioon aegus. Palun logi uuesti sisse." };
  }

  const parsed = quoteSendSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Palun paranda vormi vead",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  if (!isEmailConfigured()) {
    return {
      ok: false,
      error:
        "E-posti saatmine pole seadistatud (RESEND_API_KEY puudub). Lisa võti keskkonnamuutujatesse.",
    };
  }

  const quote = await prisma.quote.findFirst({
    where: { id: parsed.data.quoteId, organizationId: tenant.organizationId },
    include: { client: true, lineItems: true },
  });
  if (!quote) return { ok: false, error: "Hinnapakkumist ei leitud" };

  const org = await prisma.organization.findUnique({
    where: { id: tenant.organizationId },
  });
  if (!org) return { ok: false, error: "Organisatsiooni ei leitud" };

  const resend = getResendClient();
  if (!resend) {
    return { ok: false, error: "E-posti teenus pole saadaval." };
  }

  const bodyText = [
    parsed.data.message?.trim() ||
      `Tere! Lisatud on hinnapakkumine ${quote.number}.`,
    "",
    `Pealkiri: ${quote.title}`,
    `Summa: ${quote.total.toString()} €`,
    "",
    "Parimate soovidega,",
    org.name,
  ].join("\n");

  try {
    const result = await resend.emails.send({
      from: getEmailFrom(),
      to: parsed.data.toEmail,
      subject: parsed.data.subject,
      text: bodyText,
    });

    if (result.error) {
      await prisma.quoteSendLog.create({
        data: {
          organizationId: tenant.organizationId,
          quoteId: quote.id,
          actorId: tenant.userId,
          toEmail: parsed.data.toEmail,
          subject: parsed.data.subject,
          success: false,
          errorMessage: result.error.message,
        },
      });
      return {
        ok: false,
        error: `E-posti saatmine ebaõnnestus: ${result.error.message}`,
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.quoteSendLog.create({
        data: {
          organizationId: tenant.organizationId,
          quoteId: quote.id,
          actorId: tenant.userId,
          toEmail: parsed.data.toEmail,
          subject: parsed.data.subject,
          success: true,
        },
      });
      if (quote.status === "PENDING") {
        await tx.quote.update({
          where: { id: quote.id },
          data: { status: "SENT" },
        });
      }
      await tx.quoteActivity.create({
        data: {
          organizationId: tenant.organizationId,
          quoteId: quote.id,
          actorId: tenant.userId,
          type: "SENT_EMAIL",
          message: `Saadetud aadressile ${parsed.data.toEmail}`,
        },
      });
    });

    revalidateQuotePaths(quote.id);
    return { ok: true, quoteId: quote.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Tundmatu e-posti viga";
    await prisma.quoteSendLog.create({
      data: {
        organizationId: tenant.organizationId,
        quoteId: quote.id,
        actorId: tenant.userId,
        toEmail: parsed.data.toEmail,
        subject: parsed.data.subject,
        success: false,
        errorMessage: message,
      },
    });
    return { ok: false, error: `E-posti saatmine ebaõnnestus: ${message}` };
  }
}

export async function generateQuotePdfAction(
  quoteId: string,
): Promise<QuoteActionResult> {
  const tenant = await requireTenant();
  if (!tenant) {
    return { ok: false, error: "Sessioon aegus. Palun logi uuesti sisse." };
  }

  const org = await prisma.organization.findUnique({
    where: { id: tenant.organizationId },
  });
  if (!org) return { ok: false, error: "Organisatsiooni ei leitud" };

  if (!canExportPdf(org)) {
    return {
      ok: false,
      error:
        "PDF eksport on saadaval Business ja Pro paketis. Uuenda paketti Seaded → Tellimus või sea testimiseks andmebaasis Organization.plan = BUSINESS (ja subscriptionStatus = ACTIVE).",
    };
  }

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, organizationId: tenant.organizationId },
    include: { client: true, lineItems: { orderBy: { position: "asc" } } },
  });
  if (!quote) return { ok: false, error: "Hinnapakkumist ei leitud" };

  const buffer = await buildQuotePdfBuffer(org, quote);
  return {
    ok: true,
    quoteId,
    pdfBase64: buffer.toString("base64"),
  };
}
