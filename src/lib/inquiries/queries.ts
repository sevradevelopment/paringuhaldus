import type {
  InquiryPriority,
  InquiryStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { MONTHLY_INQUIRY_LIMIT } from "@/lib/inquiries/constants";

export type InquiryListSort =
  | "createdAt_desc"
  | "createdAt_asc"
  | "title_asc"
  | "title_desc"
  | "status_asc"
  | "priority_desc";

export type InquiryListParams = {
  q?: string;
  status?: InquiryStatus | "ALL";
  priority?: InquiryPriority | "ALL";
  archived?: "active" | "archived" | "all";
  sort?: InquiryListSort;
};

export type InquiryListItem = {
  id: string;
  title: string;
  status: InquiryStatus;
  priority: InquiryPriority;
  createdAt: Date;
  archivedAt: Date | null;
  clientName: string | null;
};

function sortToOrderBy(
  sort: InquiryListSort | undefined,
): Prisma.InquiryOrderByWithRelationInput {
  switch (sort) {
    case "createdAt_asc":
      return { createdAt: "asc" };
    case "title_asc":
      return { title: "asc" };
    case "title_desc":
      return { title: "desc" };
    case "status_asc":
      return { status: "asc" };
    case "priority_desc":
      return { priority: "desc" };
    case "createdAt_desc":
    default:
      return { createdAt: "desc" };
  }
}

export async function listInquiries(
  organizationId: string,
  params: InquiryListParams = {},
): Promise<InquiryListItem[]> {
  const archived = params.archived ?? "active";
  const where: Prisma.InquiryWhereInput = {
    organizationId,
  };

  if (archived === "active") {
    where.archivedAt = null;
  } else if (archived === "archived") {
    where.archivedAt = { not: null };
  }

  if (params.status && params.status !== "ALL") {
    where.status = params.status;
  }

  if (params.priority && params.priority !== "ALL") {
    where.priority = params.priority;
  }

  const q = params.q?.trim();
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { client: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const rows = await prisma.inquiry.findMany({
    where,
    orderBy: sortToOrderBy(params.sort),
    take: 200,
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      createdAt: true,
      archivedAt: true,
      client: { select: { name: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    priority: row.priority,
    createdAt: row.createdAt,
    archivedAt: row.archivedAt,
    clientName: row.client?.name ?? null,
  }));
}

export async function getInquiryDetail(
  organizationId: string,
  inquiryId: string,
) {
  return prisma.inquiry.findFirst({
    where: { id: inquiryId, organizationId },
    include: {
      client: true,
      notes: {
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          actor: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
}

export async function listOrgClients(organizationId: string) {
  return prisma.client.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  });
}

export function monthStartUtc(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export async function countInquiriesCreatedThisMonth(
  organizationId: string,
): Promise<number> {
  return prisma.inquiry.count({
    where: {
      organizationId,
      createdAt: { gte: monthStartUtc() },
    },
  });
}

export async function getMonthlyInquiryUsage(organizationId: string) {
  const used = await countInquiriesCreatedThisMonth(organizationId);
  return {
    used,
    limit: MONTHLY_INQUIRY_LIMIT,
    remaining: Math.max(0, MONTHLY_INQUIRY_LIMIT - used),
  };
}
