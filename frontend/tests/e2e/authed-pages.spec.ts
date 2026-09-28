import { expect, request as pwRequest, test, type APIRequestContext, type Page } from "@playwright/test";
import { isOpenNow, scheduleSlots } from "../../src/lib/time";
import { expectNoA11yViolations } from "./helpers";

/** Pages behind a login: axe, no horizontal scroll, and 44 px tap targets, at every project width. */
async function checkPage(page: Page, route: string) {
  await page.goto(route);
  await expect(page.locator("h1").first()).toBeVisible({ timeout: 15_000 });
  // Let polled/loaded content settle before measuring.
  await page.waitForLoadState("networkidle");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect.soft(overflow, `horizontal overflow on ${route}`).toBe(0);

  const small = await page.evaluate(() =>
    [...document.querySelectorAll("header button, header a, main button, main select, main input:not([type=checkbox]), main textarea")]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        if (r.width === 0 || cs.visibility === "hidden" || el.classList.contains("sr-only")) return false;
        return r.height < 43.5 || r.width < 43.5;
      })
      .map((el) => `${el.tagName} ${el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 30)}`),
  );
  expect.soft(small, `controls under 44px on ${route}`).toEqual([]);

  await expectNoA11yViolations(page, route);
}

async function adminApi(): Promise<APIRequestContext> {
  const api = await pwRequest.newContext({ baseURL: "http://localhost:3100", extraHTTPHeaders: { Origin: "http://localhost:3100" } });
  const login = await api.post("/api/v1/admin/auth/login", {
    data: { identifier: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
  });
  expect(login.ok()).toBe(true);
  return api;
}

test("admin pages: accessible, no horizontal scroll, 44px controls", async ({ page, context }) => {
  test.skip(!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD, "set ADMIN_EMAIL/ADMIN_PASSWORD to run this spec");
  test.setTimeout(180_000);

  await page.goto("/admin/login");
  await page.getByLabel("Email or mobile number").fill(process.env.ADMIN_EMAIL!);
  await page.getByRole("textbox", { name: "Password" }).fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/, { timeout: 10_000 });

  const all = await (await context.request.get("/api/v1/admin/orders")).json();
  const orderId = all[0]?.id;

  const routes = ["/admin", "/admin/menu", "/admin/areas", "/admin/messages", "/admin/reviews"];
  if (orderId) routes.push(`/admin/orders/${orderId}`);
  for (const route of routes) await checkPage(page, route);
});

test("customer account page (with an order to review and repeat): accessible and responsive", async ({ page, context }) => {
  test.skip(!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD, "set ADMIN_EMAIL/ADMIN_PASSWORD to run this spec");
  test.setTimeout(120_000);

  const email = `axe-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  const signup = await context.request.post("/api/v1/auth/signup", { data: { name: "Axe Tester", email, password: "fire-wings-8" } });
  expect(signup.status()).toBe(201);

  // Empty state first.
  await checkPage(page, "/account/orders");

  // Then a delivered order, which shows the review form and "Order again".
  const now = new Date();
  const timing = isOpenNow(now) ? { type: "asap" } : { type: "scheduled", slot: scheduleSlots(now)[0]!.toISOString() };
  const placed = await context.request.post("/api/v1/orders", {
    headers: { "Idempotency-Key": crypto.randomUUID() },
    data: {
      customer: { name: "Axe Tester", phone: "0300-1234567" },
      delivery: { area: "clifton", address: "House 12, Street 4, Block 5" },
      timing,
      payment: "cod",
      lines: [{ itemSlug: "burns-road-zinger", optionId: "single", addonIds: [], note: "", quantity: 1, addedAt: now.toISOString() }],
    },
  });
  expect(placed.status()).toBe(201);
  const orderId = (await placed.json()).id as string;

  const admin = await adminApi();
  let expected = "confirmed";
  for (const next of ["preparing", "on-the-way", "delivered"]) {
    expect((await admin.patch(`/api/v1/admin/orders/${orderId}/status`, { data: { status: next, expectedStatus: expected } })).ok()).toBe(true);
    expected = next;
  }
  await admin.dispose();

  await checkPage(page, "/account/orders");
  await expect(page.getByText("How was this order?")).toBeVisible();
});
