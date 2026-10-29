/**
 * Smoke-test inquiries CRUD against a running server + Prisma.
 * Usage: node scripts/verify-inquiries.mjs [baseUrl]
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const base = process.argv[2] ?? "http://localhost:3000";
const stamp = Date.now();
const email = `inq+${stamp}@example.com`;
const password = "TestParool123!";
const slug = `inqfirma-${stamp}`;
const prisma = new PrismaClient();

function mergeCookies(existing, setCookies) {
  const jar = new Map();
  for (const part of existing.split(";").map((s) => s.trim()).filter(Boolean)) {
    const [k, ...rest] = part.split("=");
    jar.set(k, rest.join("="));
  }
  for (const sc of setCookies) {
    const [pair] = sc.split(";");
    const [k, ...rest] = pair.split("=");
    jar.set(k.trim(), rest.join("="));
  }
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function signIn() {
  const csrfRes = await fetch(`${base}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  let cookieHeader = mergeCookies("", csrfRes.headers.getSetCookie?.() ?? []);
  const signInRes = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader,
    },
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      callbackUrl: `${base}/app`,
      json: "true",
    }),
    redirect: "manual",
  });
  cookieHeader = mergeCookies(cookieHeader, signInRes.headers.getSetCookie?.() ?? []);
  return cookieHeader;
}

async function main() {
  console.log("Base:", base);

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name: "Inquiry Tester",
      email,
      passwordHash,
      memberships: {
        create: {
          role: "OWNER",
          organization: { create: { name: `Inqfirma ${stamp}`, slug } },
        },
      },
    },
    include: { memberships: true },
  });
  const organizationId = user.memberships[0].organizationId;
  console.log("User/org", user.id, organizationId);

  const otherOrg = await prisma.organization.create({
    data: { name: `Other ${stamp}`, slug: `other-${stamp}` },
  });
  const foreign = await prisma.inquiry.create({
    data: {
      organizationId: otherOrg.id,
      title: "Foreign inquiry",
      status: "UUS",
      priority: "TAVALINE",
    },
  });

  const cookie = await signIn();

  const listRes = await fetch(`${base}/app/paringud`, {
    headers: { Cookie: cookie },
  });
  const listHtml = await listRes.text();
  console.log("GET /app/paringud", listRes.status);
  if (!listHtml.includes("Uus päring")) throw new Error("List page missing CTA");

  const created = await prisma.inquiry.create({
    data: {
      organizationId,
      title: `Test päring ${stamp}`,
      description: "Smoke test description",
      status: "UUS",
      priority: "KORGE",
      activities: {
        create: {
          organizationId,
          actorId: user.id,
          type: "CREATED",
          message: "Päring loodi",
        },
      },
    },
  });

  const detailRes = await fetch(`${base}/app/paringud/${created.id}`, {
    headers: { Cookie: cookie },
  });
  const detailHtml = await detailRes.text();
  console.log("GET detail", detailRes.status);
  if (!detailHtml.includes(created.title)) throw new Error("Detail missing title");
  if (!detailHtml.includes("Tegevusajalugu")) throw new Error("Detail missing activity");

  const foreignRes = await fetch(`${base}/app/paringud/${foreign.id}`, {
    headers: { Cookie: cookie },
  });
  const foreignHtml = await foreignRes.text();
  console.log("GET foreign inquiry", foreignRes.status);
  if (foreignHtml.includes("Foreign inquiry")) {
    throw new Error("Tenant isolation failed: foreign inquiry content leaked");
  }
  if (!/not.?found|404/i.test(foreignHtml) && foreignRes.status !== 404) {
    throw new Error("Tenant isolation failed: expected not-found for foreign inquiry");
  }
  console.log("OK tenant isolation");

  await prisma.inquiry.update({
    where: { id: created.id },
    data: { status: "TOOS" },
  });
  await prisma.inquiryNote.create({
    data: {
      organizationId,
      inquiryId: created.id,
      authorId: user.id,
      body: "Smoke note",
    },
  });
  await prisma.inquiry.update({
    where: { id: created.id },
    data: { archivedAt: new Date() },
  });

  const archivedList = await fetch(
    `${base}/app/paringud?archived=archived`,
    { headers: { Cookie: cookie } },
  );
  const archivedHtml = await archivedList.text();
  if (!archivedHtml.includes(created.title)) {
    throw new Error("Archived inquiry not listed");
  }
  console.log("OK archived filter");

  // Monthly limit counter (creates this month)
  const monthCount = await prisma.inquiry.count({
    where: {
      organizationId,
      createdAt: {
        gte: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)),
      },
    },
  });
  console.log("Monthly creates", monthCount);
  if (monthCount < 1) throw new Error("Monthly count should include created inquiry");

  // cleanup
  await prisma.inquiryNote.deleteMany({ where: { inquiryId: created.id } });
  await prisma.inquiryActivity.deleteMany({ where: { inquiryId: created.id } });
  await prisma.inquiry.delete({ where: { id: created.id } });
  await prisma.inquiry.delete({ where: { id: foreign.id } });
  await prisma.membership.deleteMany({ where: { userId: user.id } });
  await prisma.organization.deleteMany({ where: { id: { in: [organizationId, otherOrg.id] } } });
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.$disconnect();

  console.log("OK: inquiries smoke verified");
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
