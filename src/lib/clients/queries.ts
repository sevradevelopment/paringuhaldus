import type { InquiryPriority, InquiryStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type ClientListSort =
  | "name_asc"
  | "name_desc"
  | "createdAt_desc"
  | "createdAt_asc"
  | "company_asc";

export type ClientListParams = {
  q?: string;
  archived?: "active" | "archived" | "all";
  sort?: ClientListSort;
};

export type ClientListItem = {
  id: string;
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  registryCode: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  inquiryCount: number;
};

function sortToOrderBy(
  sort: ClientListSort | undefined,
): Prisma.ClientOrderByWithRelationInput {
  switch (sort) {
    case "name_desc":
      return { name: "desc" };
    case "createdAt_desc":
      return { createdAt: "desc" };
    case "createdAt_asc":
      return { createdAt: "asc" };
    case "company_asc":
      return { companyName: "asc" };
    case "name_asc":
    default:
      return { name: "asc" };
  }
}

export async function listClients(
  organizationId: string,
  params: ClientListParams = {},
): Promise<ClientListItem[]> {
  const archived = params.archived ?? "active";
  const where: Prisma.ClientWhereInput = {
    organizationId,
  };

  if (archived === "active") {
    where.archivedAt = null;
  } else if (archived === "archived") {
    where.archivedAt = { not: null };
  }

  const q = params.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { registryCode: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.client.findMany({
    where,
    orderBy: sortToOrderBy(params.sort),
    take: 200,
    select: {
      id: true,
      name: true,
      companyName: true,
      email: true,
      phone: true,
      registryCode: true,
      archivedAt: true,
      createdAt: true,
      _count: { select: { inquiries: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    companyName: row.companyName,
    email: row.email,
    phone: row.phone,
    registryCode: row.registryCode,
    archivedAt: row.archivedAt,
    createdAt: row.createdAt,
    inquiryCount: row._count.inquiries,
  }));
}

export async function getClientDetail(
  organizationId: string,
  clientId: string,
) {
  return prisma.client.findFirst({
    where: { id: clientId, organizationId },
    include: {
      inquiries: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true,
          archivedAt: true,
        },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          actor: { select: { id: true, name: true, email: true } },
        },
      },
      _count: { select: { inquiries: true } },
    },
  });
}

export type ClientInquiryRow = {
  id: string;
  title: string;
  status: InquiryStatus;
  priority: InquiryPriority;
  createdAt: Date;
  archivedAt: Date | null;
};

export async function listOrgClients(
  organizationId: string,
  options: { includeArchivedIds?: string[] } = {},
) {
  const includeIds = options.includeArchivedIds?.filter(Boolean) ?? [];

  return prisma.client.findMany({
    where: {
      organizationId,
      OR: [
        { archivedAt: null },
        ...(includeIds.length > 0 ? [{ id: { in: includeIds } }] : []),
      ],
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      companyName: true,
      email: true,
      phone: true,
      archivedAt: true,
    },
  });
}

export async function findDuplicateClientHints(
  organizationId: string,
  input: {
    email?: string | null;
    companyName?: string | null;
    excludeClientId?: string;
  },
) {
  const email = input.email?.trim().toLowerCase() || null;
  const companyName = input.companyName?.trim() || null;

  const [emailMatch, companyMatch] = await Promise.all([
    email
      ? prisma.client.findFirst({
          where: {
            organizationId,
            email: { equals: email, mode: "insensitive" },
            ...(input.excludeClientId
              ? { id: { not: input.excludeClientId } }
              : {}),
          },
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
            archivedAt: true,
          },
        })
      : Promise.resolve(null),
    companyName
      ? prisma.client.findFirst({
          where: {
            organizationId,
            companyName: { equals: companyName, mode: "insensitive" },
            ...(input.excludeClientId
              ? { id: { not: input.excludeClientId } }
              : {}),
          },
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
            archivedAt: true,
          },
        })
      : Promise.resolve(null),
  ]);

  return { emailMatch, companyMatch };
}
