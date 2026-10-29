import { prisma } from "@/lib/db";
import {
  getEffectivePlan,
  getMaxUsersForOrg,
  PLAN_LIMITS,
} from "@/lib/billing/plans";

export async function getOrganizationSettings(organizationId: string) {
  return prisma.organization.findUnique({
    where: { id: organizationId },
  });
}

export async function getTeamMembers(organizationId: string) {
  return prisma.membership.findMany({
    where: { organizationId },
    include: {
      user: {
        select: { id: true, name: true, email: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getPendingInvites(organizationId: string) {
  return prisma.organizationInvite.findMany({
    where: {
      organizationId,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPlanUsage(organizationId: string) {
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
  });
  const memberCount = await prisma.membership.count({
    where: { organizationId },
  });
  const pendingInvites = await prisma.organizationInvite.count({
    where: {
      organizationId,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  const effectivePlan = getEffectivePlan(org);
  const maxUsers = getMaxUsersForOrg(org);

  return {
    org,
    memberCount,
    pendingInvites,
    seatsUsed: memberCount + pendingInvites,
    maxUsers,
    planLabel: PLAN_LIMITS[effectivePlan].label,
  };
}
