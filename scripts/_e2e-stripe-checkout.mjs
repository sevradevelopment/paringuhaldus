/**
 * Sandbox E2E: register → billing Checkout (4242) → verify redirect + DB.
 * Does not print secrets.
 */
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const stamp = Date.now();
const email = `e2e.part18.${stamp}@example.com`;
const password = "TestPass123!";
const results = {
  register: "NOT TESTED",
  checkoutRedirect: "NOT TESTED",
  priceInSession: "NOT TESTED",
  payment4242: "NOT TESTED",
  successRedirect: "NOT TESTED",
  dbActivation: "NOT TESTED",
  webhookListenActivity: "NOT TESTED",
  duplicateBlock: "NOT TESTED",
  portalButton: "NOT TESTED",
  errors: [],
};

function loadEnvLocal() {
  const t = fs.readFileSync(".env.local", "utf8");
  const map = {};
  for (const line of t.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    let v = line.slice(i + 1);
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    )
      v = v.slice(1, -1);
    map[line.slice(0, i)] = v;
  }
  return map;
}

const env = loadEnvLocal();
const expectedBusinessMonthly = env.STRIPE_PRICE_BUSINESS_MONTHLY;
const listenLog =
  process.env.STRIPE_LISTEN_LOG ||
  path.join(
    process.env.USERPROFILE || "",
    ".cursor",
    "projects",
    "c-Users-karel-Desktop-paringuhaldus",
    "terminals",
    "7690.txt",
  );

const prisma = new PrismaClient();

async function fillStripeCheckout(page) {
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 60000 });
  await page.waitForTimeout(2000);

  // Email may already be filled from customer
  const emailInput = page.locator('input[type="email"]').first();
  if (await emailInput.count()) {
    const val = await emailInput.inputValue().catch(() => "");
    if (!val) await emailInput.fill(email);
  }

  // Prefer card payment over Link / wallets if a tab exists
  const cardTab = page.getByRole("tab", { name: /card|kaart/i });
  if (await cardTab.count()) {
    await cardTab.first().click().catch(() => {});
  }
  const cardRadio = page.locator(
    '#payment-method-accordion-item-title-card, [data-testid="card-accordion-item"]',
  );
  if (await cardRadio.count()) {
    await cardRadio.first().click().catch(() => {});
  }

  let filled = false;

  // Iterate all frames for classic hosted fields
  for (const frame of page.frames()) {
    const number = frame.locator(
      'input[name="cardnumber"], input[autocomplete="cc-number"], input[name="number"]',
    );
    if (await number.count()) {
      await number.first().fill("4242424242424242");
      filled = true;
    }
    const exp = frame.locator(
      'input[name="exp-date"], input[name="expiry"], input[autocomplete="cc-exp"]',
    );
    if (await exp.count()) await exp.first().fill("1234");
    const cvc = frame.locator(
      'input[name="cvc"], input[autocomplete="cc-csc"]',
    );
    if (await cvc.count()) await cvc.first().fill("123");
  }

  // New Checkout often exposes inputs in the main page (shadow/host)
  const pageCard = page.locator(
    'input[name="number"], input[autocomplete="cc-number"], input[placeholder*="1234"]',
  );
  if (await pageCard.count()) {
    await pageCard.first().click();
    await pageCard.first().fill("4242424242424242");
    filled = true;
  }
  const pageExp = page.locator(
    'input[name="expiry"], input[autocomplete="cc-exp"], input[placeholder*="KK"], input[placeholder*="MM"]',
  );
  if (await pageExp.count()) {
    await pageExp.first().fill("12 / 34");
  }
  const pageCvc = page.locator(
    'input[name="cvc"], input[autocomplete="cc-csc"], input[placeholder*="CVC"]',
  );
  if (await pageCvc.count()) {
    await pageCvc.first().fill("123");
  }

  // Billing details
  const name = page.locator(
    'input[name="billingName"], input[name="name"], input[autocomplete="name"]',
  );
  if (await name.count()) {
    const v = await name.first().inputValue().catch(() => "");
    if (!v) await name.first().fill("E2E Test");
  }
  const zip = page.locator(
    'input[name="billingPostalCode"], input[name="postal"], input[autocomplete="postal-code"]',
  );
  if (await zip.count()) {
    const v = await zip.first().inputValue().catch(() => "");
    if (!v) await zip.first().fill("10111");
  }

  // Screenshot for debugging without secrets in report
  await page.screenshot({
    path: "scripts/_e2e-checkout-debug.png",
    fullPage: true,
  });

  const payBtn = page
    .locator(
      'button[data-testid="hosted-payment-submit-button"], button:has-text("Subscribe"), button:has-text("Pay"), button:has-text("Maksa"), button:has-text("Start trial"), button[type="submit"]',
    )
    .first();
  await payBtn.click({ timeout: 20000 });
  return filled;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(45000);

  try {
    // 1) Register
    await page.goto(`${BASE}/register`);
    await page.locator("#name").fill("E2E Part18");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.locator("#companyName").fill(`E2E Org ${stamp}`);
    await page.getByRole("button", { name: "Loo konto" }).click();
    await page.waitForURL(/\/app/, { timeout: 30000 });
    results.register = "PASS";

    // 2) Billing page → Business checkout
    await page.goto(`${BASE}/app/seaded/tellimus`);
    await page.getByRole("button", { name: "Vali Business" }).click();

    // Wait for Stripe Checkout
    try {
      await page.waitForURL(/checkout\.stripe\.com/, { timeout: 45000 });
      results.checkoutRedirect = "PASS";
    } catch (e) {
      results.checkoutRedirect = "FAIL";
      results.errors.push("Checkout redirect failed: " + String(e.message || e));
      // capture page text for debug (no secrets)
      const body = (await page.locator("body").innerText().catch(() => "")).slice(
        0,
        500,
      );
      results.errors.push("pageBody=" + body.replace(/\s+/g, " "));
      throw e;
    }

    // Verify price id in session via Stripe API from URL cs_test_...
    const url = page.url();
    const csMatch = url.match(/cs_(test|live)_[A-Za-z0-9]+/);
    if (csMatch) {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(env.STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.retrieve(csMatch[0], {
        expand: ["line_items"],
      });
      const priceId = session.line_items?.data?.[0]?.price?.id;
      results.priceInSession =
        priceId === expectedBusinessMonthly ? "PASS" : "FAIL";
      if (priceId !== expectedBusinessMonthly) {
        results.errors.push(
          `price mismatch got=${priceId} expected=${expectedBusinessMonthly}`,
        );
      }
      if (csMatch[1] === "live") {
        results.errors.push("LIVE checkout session — abort");
        throw new Error("LIVE checkout");
      }
    } else {
      results.priceInSession = "FAIL";
    }

    // 3) Pay with 4242
    const listenBefore = fs.existsSync(listenLog)
      ? fs.readFileSync(listenLog, "utf8").length
      : 0;
    const cardFilled = await fillStripeCheckout(page);
    if (!cardFilled) {
      results.payment4242 = "FAIL";
      results.errors.push("Could not fill card fields");
      // dump frames for debug
      results.errors.push(
        "frames=" + page.frames().map((f) => f.url()).join(" | ").slice(0, 800),
      );
    }

    // Wait success redirect
    try {
      await page.waitForURL(/seaded\/tellimus.*checkout=success/, {
        timeout: 90000,
      });
      results.payment4242 = results.payment4242 === "FAIL" ? "FAIL" : "PASS";
      results.successRedirect = "PASS";
    } catch (e) {
      results.payment4242 =
        results.payment4242 === "FAIL" ? "FAIL" : "FAIL";
      results.successRedirect = "FAIL";
      results.errors.push(
        "success redirect failed url=" +
          page.url() +
          " err=" +
          String(e.message || e),
      );
    }

    // 4) DB activation — poll while webhooks settle
    let org = null;
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const user = await prisma.user.findUnique({
        where: { email },
        include: { memberships: { include: { organization: true } } },
      });
      org = user?.memberships?.[0]?.organization ?? null;
      if (
        org &&
        (org.subscriptionStatus === "ACTIVE" ||
          org.subscriptionStatus === "TRIALING") &&
        org.stripeSubscriptionId &&
        org.plan === "BUSINESS"
      ) {
        break;
      }
    }
    if (
      org &&
      (org.subscriptionStatus === "ACTIVE" ||
        org.subscriptionStatus === "TRIALING") &&
      org.stripeSubscriptionId &&
      org.plan === "BUSINESS"
    ) {
      results.dbActivation = "PASS";
    } else {
      results.dbActivation = "FAIL";
      results.errors.push(
        `org status=${org?.subscriptionStatus} plan=${org?.plan} sub=${Boolean(org?.stripeSubscriptionId)}`,
      );
    }

    // 5) Webhook listen activity
    if (fs.existsSync(listenLog)) {
      const after = fs.readFileSync(listenLog, "utf8").slice(listenBefore);
      const hasCompleted = /checkout\.session\.completed/.test(after);
      const hasInvoice = /invoice\.paid/.test(after);
      const hasSub = /customer\.subscription\.(created|updated)/.test(after);
      results.webhookListenActivity =
        hasCompleted || hasInvoice || hasSub ? "PASS" : "FAIL";
      if (!hasCompleted) results.errors.push("listen missing checkout.session.completed");
      if (!hasInvoice) results.errors.push("listen missing invoice.paid (may arrive later)");
    }

    // 6) Duplicate block UI
    await page.goto(`${BASE}/app/seaded/tellimus`);
    await page.waitForTimeout(1000);
    const blockedBtn = page.getByRole("button", { name: "Kasuta portaali" });
    const managedMsg = page.getByText(/uut Checkouti ei avata/i);
    if ((await blockedBtn.count()) || (await managedMsg.count())) {
      results.duplicateBlock = "PASS";
    } else {
      // try clicking Vali again
      const vali = page.getByRole("button", { name: "Vali Business" });
      if (await vali.count()) {
        results.duplicateBlock = "FAIL";
        results.errors.push("Vali Business still enabled after subscription");
      } else {
        results.duplicateBlock = "PASS";
      }
    }

    // 7) Portal button present
    const portal = page.getByRole("button", {
      name: "Halda arveldust (Stripe)",
    });
    results.portalButton = (await portal.count()) ? "PASS" : "FAIL";

    results.email = email;
    results.orgId = org?.id || null;
  } catch (e) {
    results.errors.push(String(e.message || e));
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }

  console.log(JSON.stringify(results, null, 2));
  const hardFail =
    results.payment4242 !== "PASS" ||
    results.successRedirect !== "PASS" ||
    results.dbActivation !== "PASS";
  process.exit(hardFail ? 1 : 0);
}

main();
