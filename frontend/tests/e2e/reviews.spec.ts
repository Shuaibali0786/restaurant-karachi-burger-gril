import { expect, test, type Page } from "@playwright/test";
import { completeDeliveryTiming } from "./helpers";

const PASSWORD = "fire-wings-8";

/** Signs a fresh customer up, places one order through the real checkout, and returns its number. */
async function signUpAndOrder(page: Page, name: string): Promise<string> {
  await page.goto("/signup");
  await page.evaluate(() => localStorage.clear());
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email", { exact: true }).fill(`review-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(PASSWORD);
  await page.getByRole("textbox", { name: "Confirm password" }).fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/account\/orders$/, { timeout: 10_000 });

  await page.goto("/menu");
  await page.getByRole("button", { name: "Add Burns Road Zinger", exact: true }).first().click();
  const sheet = page.locator("dialog[open]");
  await sheet.locator("label", { has: page.locator('input[value="single"]') }).click();
  await sheet.getByRole("button", { name: /^Add to cart/ }).click();
  await page.getByRole("button", { name: /^Open cart/ }).click();
  await page.locator("dialog[open]").getByRole("link", { name: /^Checkout/ }).click();
  await page.getByLabel("Mobile number").fill("03001234567");
  await page.getByLabel("Delivery area").selectOption("clifton");
  await page.getByLabel("Full address").fill("House 12, Street 4, Block 5");
  await completeDeliveryTiming(page);
  await page.getByRole("button", { name: /^Place order/ }).click();
  await expect(page).toHaveURL(/\/order\/(KBG-\d{5})$/, { timeout: 10_000 });
  return new URL(page.url()).pathname.split("/").pop()!;
}

test("delivered order -> review -> admin approves -> home page shows real reviews", async ({ browser }, info) => {
  test.skip(info.project.name !== "desktop-1280", "changes shared data and is rate limited: one viewport only");
  test.skip(!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD, "set ADMIN_EMAIL/ADMIN_PASSWORD to run this spec");
  test.setTimeout(300_000);

  const run = Date.now();
  const customers = ["Sana Ahmed", "Bilal Raza", "Hina Malik"];
  const quotes = customers.map((_, index) => `E2E review ${run} number ${index + 1}, tasty and hot`);

  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await admin.goto("/admin/login");
  await admin.getByLabel("Email or mobile number").fill(process.env.ADMIN_EMAIL!);
  await admin.getByRole("textbox", { name: "Password" }).fill(process.env.ADMIN_PASSWORD!);
  await admin.getByRole("button", { name: "Sign in" }).click();
  await expect(admin).toHaveURL(/\/admin$/, { timeout: 10_000 });

  for (const [index, name] of customers.entries()) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const orderId = await signUpAndOrder(page, name);

    // Before delivery there is no review form.
    await page.goto("/account/orders");
    await expect(page.getByRole("link", { name: orderId })).toBeVisible();
    await expect(page.getByText("How was this order?")).toHaveCount(0);

    // Staff deliver it.
    let expected = "confirmed";
    for (const next of ["preparing", "on-the-way", "delivered"]) {
      const response = await admin.request.patch(`/api/v1/admin/orders/${orderId}/status`, {
        data: { status: next, expectedStatus: expected },
        headers: { Origin: "http://localhost:3100" },
      });
      expect(response.ok()).toBe(true);
      expected = next;
    }

    // The customer reviews it from My orders.
    await page.reload();
    await expect(page.getByText("How was this order?")).toBeVisible();
    await page.getByRole("radio", { name: "5 stars" }).click();
    await page.getByLabel("A short comment").fill(quotes[index]!);
    await page.getByRole("button", { name: "Send review" }).click();
    await expect(page.getByText("Awaiting approval")).toBeVisible();
    await context.close();
  }

  // Admin approves the three in the Reviews tab.
  await admin.getByRole("link", { name: /^Reviews/ }).click();
  for (const quote of quotes) {
    const card = admin.getByRole("listitem").filter({ hasText: quote });
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: "Approve" }).click();
    await expect(card.getByText("approved", { exact: true })).toBeVisible();
  }

  // The API switches from samples to real reviews straight away.
  const api = await (await admin.request.get("/api/v1/testimonials")).json();
  expect(api.some((t: { isSample: boolean }) => t.isSample)).toBe(false);
  expect(api.some((t: { quote: string }) => quotes.includes(t.quote))).toBe(true);

  // The home page is cached for up to a minute, so reload until it catches up.
  const visitor = await browser.newContext();
  const home = await visitor.newPage();
  await expect(async () => {
    await home.goto("/");
    await expect(home.getByText("Sample reviews", { exact: true })).toHaveCount(0);
    await expect(home.getByText(quotes[2]!)).toBeVisible();
  }).toPass({ timeout: 150_000, intervals: [5_000] });
  await visitor.close();

  // Put the samples back for the next person: reject what this run approved.
  const reviews = await (await admin.request.get("/api/v1/admin/reviews")).json();
  for (const review of reviews.filter((r: { comment: string }) => quotes.includes(r.comment))) {
    await admin.request.patch(`/api/v1/admin/reviews/${review.id}`, {
      data: { status: "rejected" },
      headers: { Origin: "http://localhost:3100" },
    });
  }
  await adminContext.close();
});
