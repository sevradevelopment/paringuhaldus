import type { Prisma, QuoteStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type QuoteListSort =
  | "createdAt_desc"
  | "createdAt_asc"
  | "number_asc"
  | "number_desc"
  | "total_desc";

export type QuoteListParams = {
  q?: string;
  status?: QuoteStatus | "ALL";
  archived?: "active" | "archived" | "all";
  sort?: QuoteListSort;
};

export type QuoteListItem = {
  id: string;
  number: string;
  title: string;
  status: QuoteStatus;
  total: string;
  issueDate: Date;
  validUntil: Date | null;
  archivedAt: Date | null;
  clientName: string | null;
};

function sortToOrderBy(
  sort: QuoteListSort | undefined,
): Prisma.QuoteOrderByWithRelationInput {
  switch (sort) {
    case "createdAt_asc":
      return { createdAt: "asc" };
    case "number_asc":
      return { number: "asc" };
    case "number_desc":
      return { number: "desc" };
    case "total_desc":
      return { total: "desc" };
    case "createdAt_desc":
    default:
      return { createdAt: "desc" };
  }
}

export async function listQuotes(
  organizationId: string,
  params: QuoteListParams = {},
): Promise<QuoteListItem[]> {
  const archived = params.archived ?? "active";
  const where: Prisma.QuoteWhereInput = { organizationId };

  if (archived === "active") where.archivedAt = null;
  else if (archived === "archived") where.archivedAt = { not: null };

  if (params.status && params.status !== "ALL") {
    where.status = params.status;
  }

  const q = params.q?.trim();
  if (q) {
    where.OR = [
      { number: { contains: q, mode: "insensitive" } },
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { client: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const rows = await prisma.quote.findMany({
    where,
    orderBy: sortToOrderBy(params.sort),
    take: 200,
    select: {
      id: true,
      number: true,
      title: true,
      status: true,
      total: true,
      issueDate: true,
      validUntil: true,
      archivedAt: true,
      client: { select: { name: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    number: row.number,
    title: row.title,
    status: row.status,
    total: row.total.toString(),
    issueDate: row.issueDate,
    validUntil: row.validUntil,
    archivedAt: row.archivedAt,
    clientName: row.client?.name ?? null,
  }));
}

export async function getQuoteDetail(
  organizationId: string,
  quoteId: string,
) {
  return prisma.quote.findFirst({
    where: { id: quoteId, organizationId },
    include: {
      client: true,
      inquiry: { select: { id: true, title: true } },
      lineItems: { orderBy: { position: "asc" } },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          actor: { select: { id: true, name: true, email: true } },
        },
      },
      sendLogs: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          actor: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
}

export async function nextQuoteNumber(
  organizationId: string,
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `HP-${year}-`;
  const latest = await prisma.quote.findFirst({
    where: {
      organizationId,
      number: { startsWith: prefix },
    },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  let seq = 1;
  if (latest?.number) {
    const parts = latest.number.split("-");
    const last = Number(parts[parts.length - 1]);
    if (Number.isFinite(last)) seq = last + 1;
  }

  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function getQuoteStats(organizationId: string) {
  const [pending, sent, accepted, totalActive] = await Promise.all([
    prisma.quote.count({
      where: { organizationId, archivedAt: null, status: "PENDING" },
    }),
    prisma.quote.count({
      where: { organizationId, archivedAt: null, status: "SENT" },
    }),
    prisma.quote.count({
      where: { organizationId, archivedAt: null, status: "ACCEPTED" },
    }),
    prisma.quote.count({
      where: { organizationId, archivedAt: null },
    }),
  ]);

  return { pending, sent, accepted, totalActive };
}
