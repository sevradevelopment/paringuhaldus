import type { InquiryStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ACTIVE_INQUIRY_STATUSES } from "@/lib/inquiries/labels";

export type DashboardStats = {
  totalInquiries: number;
  activeInquiries: number;
  pendingQuotes: number;
  clientsCount: number;
};

export type RecentInquiryRow = {
  id: string;
  title: string;
  status: InquiryStatus;
  createdAt: Date;
  clientName: string | null;
};

export async function getDashboardStats(
  organizationId: string,
): Promise<DashboardStats> {
  const [totalInquiries, activeInquiries, pendingQuotes, clientsCount] =
    await Promise.all([
      prisma.inquiry.count({
        where: { organizationId, archivedAt: null },
      }),
      prisma.inquiry.count({
        where: {
          organizationId,
          archivedAt: null,
          status: { in: ACTIVE_INQUIRY_STATUSES },
        },
      }),
      prisma.quote.count({
        where: {
          organizationId,
          archivedAt: null,
          status: { in: ["PENDING", "SENT"] },
        },
      }),
      prisma.client.count({
        where: { organizationId, archivedAt: null },
      }),
    ]);

  return {
    totalInquiries,
    activeInquiries,
    pendingQuotes,
    clientsCount,
  };
}

export async function getRecentInquiries(
  organizationId: string,
  take = 8,
): Promise<RecentInquiryRow[]> {
  const rows = await prisma.inquiry.findMany({
    where: { organizationId, archivedAt: null },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      client: { select: { name: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    createdAt: row.createdAt,
    clientName: row.client?.name ?? null,
  }));
}
