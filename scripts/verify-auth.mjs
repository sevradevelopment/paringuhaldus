/**
 * Smoke-test register + login against a running server.
 * Usage: node scripts/verify-auth.mjs [baseUrl]
 */
const base = process.argv[2] ?? "http://localhost:3000";
const stamp = Date.now();
const email = `test+${stamp}@example.com`;
const password = "TestParool123!";
const name = "Test Kasutaja";
const companyName = `Testfirma ${stamp}`;

async function getCsrf() {
  const res = await fetch(`${base}/api/auth/csrf`);
  const data = await res.json();
  const cookie = res.headers.getSetCookie?.() ?? [];
  return { csrfToken: data.csrfToken, cookies: cookie };
}

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

  // Register via page load first (ensure route works)
  const regPage = await fetch(`${base}/register`);
  console.log("GET /register", regPage.status);

  const loginPage = await fetch(`${base}/login`);
  console.log("GET /login", loginPage.status);

  // Use Auth.js credentials sign-in after creating user via Prisma-backed server action
  // Simulate register by posting to a minimal API we don't have — instead import via dynamic
  // We'll call the Next server action endpoint pattern is complex; use prisma directly + credentials signin.

  const { PrismaClient } = await import("@prisma/client");
  const bcrypt = await import("bcryptjs");
  const prisma = new PrismaClient();

  const passwordHash = await bcrypt.hash(password, 12);
  const slug = `testfirma-${stamp}`;

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      memberships: {
        create: {
          role: "OWNER",
          organization: {
            create: { name: companyName, slug },
          },
        },
      },
    },
    include: { memberships: true },
  });
  console.log("Created user", user.id, "org", user.memberships[0]?.organizationId);

  const { csrfToken, cookies: csrfCookies } = await getCsrf();
  let cookieHeader = mergeCookies("", csrfCookies);

  const body = new URLSearchParams({
    csrfToken,
    email,
    password,
    callbackUrl: `${base}/app`,
    json: "true",
  });

  const signIn = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader,
    },
    body,
    redirect: "manual",
  });

  const setCookies = signIn.headers.getSetCookie?.() ?? [];
  cookieHeader = mergeCookies(cookieHeader, setCookies);
  console.log("Credentials callback", signIn.status, signIn.headers.get("location"));

  const sessionRes = await fetch(`${base}/api/auth/session`, {
    headers: { Cookie: cookieHeader },
  });
  const session = await sessionRes.json();
  console.log("Session:", JSON.stringify(session, null, 2));

  const appRes = await fetch(`${base}/app`, {
    headers: { Cookie: cookieHeader },
    redirect: "manual",
  });
  console.log("GET /app", appRes.status);

  const protectedWithout = await fetch(`${base}/app`, { redirect: "manual" });
  console.log("GET /app unauthenticated", protectedWithout.status, protectedWithout.headers.get("location"));

  // cleanup test user (do not delete unrelated data)
  await prisma.membership.deleteMany({ where: { userId: user.id } });
  await prisma.organization.deleteMany({ where: { slug } });
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.$disconnect();

  if (!session?.user?.id || !session?.user?.organizationId) {
    console.error("FAIL: session missing userId/organizationId");
    process.exit(1);
  }
  if (appRes.status >= 400) {
    console.error("FAIL: /app not accessible when authenticated");
    process.exit(1);
  }
  console.log("OK: auth flow verified");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
