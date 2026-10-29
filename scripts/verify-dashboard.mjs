/**
 * Smoke-test dashboard shell against a running server.
 * Usage: node scripts/verify-dashboard.mjs [baseUrl]
 */
const base = process.argv[2] ?? "http://localhost:3000";
const stamp = Date.now();
const email = `dash+${stamp}@example.com`;
const password = "TestParool123!";
const name = "Dashboard Test";
const companyName = `Dashfirma ${stamp}`;
const slug = `dashfirma-${stamp}`;

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

async function main() {
  console.log("Base:", base);

  const unauth = await fetch(`${base}/app`, { redirect: "manual" });
  const unauthLoc = unauth.headers.get("location") ?? "";
  console.log("GET /app unauth", unauth.status, unauthLoc);
  if (!(unauth.status === 307 || unauth.status === 302 || unauth.status === 303)) {
    throw new Error("Expected redirect for unauthenticated /app");
  }
  if (!unauthLoc.includes("/login")) {
    throw new Error("Unauthenticated /app should redirect to /login");
  }

  const { PrismaClient } = await import("@prisma/client");
  const bcrypt = await import("bcryptjs");
  const prisma = new PrismaClient();

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      memberships: {
        create: {
          role: "OWNER",
          organization: { create: { name: companyName, slug } },
        },
      },
    },
    include: { memberships: true },
  });
  const organizationId = user.memberships[0].organizationId;
  console.log("Created user", user.id, "org", organizationId);

  const csrfRes = await fetch(`${base}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  let cookieHeader = mergeCookies("", csrfRes.headers.getSetCookie?.() ?? []);

  const signIn = await fetch(`${base}/api/auth/callback/credentials`, {
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
  cookieHeader = mergeCookies(cookieHeader, signIn.headers.getSetCookie?.() ?? []);
  console.log("Sign-in", signIn.status);

  const appRes = await fetch(`${base}/app`, {
    headers: { Cookie: cookieHeader },
    redirect: "manual",
  });
  const html = await appRes.text();
  console.log("GET /app", appRes.status, "bytes", html.length);

  const checks = [
    ["org name", companyName],
    ["Ülevaade nav", "Ülevaade"],
    ["Päringud nav", "Päringud"],
    ["Kliendid nav", "Kliendid"],
    ["Hinnapakkumised nav", "Hinnapakkumised"],
    ["Seaded nav", "Seaded"],
    ["stats total", "Päringuid kokku"],
    ["stats active", "Aktiivsed päringud"],
    ["stats quotes", "Ootel hinnapakkumised"],
    ["stats clients", "Kliendid"],
    ["recent section", "Viimased päringud"],
    ["empty state", "Päringuid pole veel"],
    ["logout", "Logi välja"],
  ];

  for (const [label, needle] of checks) {
    if (!html.includes(needle)) {
      throw new Error(`Missing on dashboard: ${label} (${needle})`);
    }
    console.log("OK", label);
  }

  const placeholder = await fetch(`${base}/app/paringud`, {
    headers: { Cookie: cookieHeader },
  });
  const placeholderHtml = await placeholder.text();
  if (!placeholderHtml.includes("Peagi")) {
    throw new Error("Placeholder page missing Peagi empty state");
  }
  console.log("OK placeholder /app/paringud");

  const counts = await Promise.all([
    prisma.inquiry.count({ where: { organizationId } }),
    prisma.quote.count({ where: { organizationId } }),
    prisma.client.count({ where: { organizationId } }),
  ]);
  console.log("DB counts (inquiry/quote/client):", counts.join("/"));
  if (counts.some((n) => n !== 0)) {
    throw new Error("Expected empty tenant data for fresh org");
  }

  await prisma.membership.deleteMany({ where: { userId: user.id } });
  await prisma.organization.deleteMany({ where: { slug } });
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.$disconnect();

  console.log("OK: dashboard smoke verified");
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
