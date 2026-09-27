import { expect, test } from "@playwright/test";
import { completeDeliveryTiming, freshStart } from "./helpers";

/**
 * Guest checkout → admin sign-in → admin sees the order and moves it through every status →
 * the customer's public tracker (a separate, unauthenticated page) reflects each change.
 * Admin credentials come from the environment (never hardcoded) — see backend/.env's
 * ADMIN_EMAIL/ADMIN_PASSWORD, exported before running this spec.
 */
test("admin moves an order through its full lifecycle while the customer tracker updates", async ({ page }) => {
  test.skip(!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD, "set ADMIN_EMAIL/ADMIN_PASSWORD to run this spec");

  await freshStart(page, "/menu");
  await page.getByRole("button", { name: "Add Burns Road Zinger", exact: true }).first().click();
  const sheet = page.locator("dialog[open]");
  await sheet.locator("label", { has: page.locator('input[value="single"]') }).click();
  await sheet.getByRole("button", { name: /^Add to cart/ }).click();
  await page.getByRole("button", { name: /^Open cart/ }).click();
  await page.locator("dialog[open]").getByRole("link", { name: /^Checkout/ }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await page.getByLabel("Full name").fill("Lifecycle Test");
  await page.getByLabel("Mobile number").fill("03001234567");
  await page.getByLabel("Delivery area").selectOption("clifton");
  await page.getByLabel("Full address").fill("House 12, Street 4, Block 5");
  await completeDeliveryTiming(page);
  await page.getByRole("button", { name: /^Place order/ }).click();
  await expect(page).toHaveURL(/\/order\/(KBG-\d{5})$/, { timeout: 10_000 });
  const orderId = new URL(page.url()).pathname.split("/").pop()!;

  // Admin signs in on a separate browser context — a different device/tab from the customer's.
  const adminContext = await page.context().browser()!.newContext();
  const adminPage = await adminContext.newPage();
  await adminPage.goto("/admin/login");
  await adminPage.getByLabel("Email or mobile number").fill(process.env.ADMIN_EMAIL!);
  await adminPage.getByRole("textbox", { name: "Password" }).fill(process.env.ADMIN_PASSWORD!);
  await adminPage.getByRole("button", { name: "Sign in" }).click();
  await expect(adminPage).toHaveURL(/\/admin$/, { timeout: 10_000 });

  // The new order shows up in the live board without a manual reload.
  await expect(adminPage.getByRole("link", { name: new RegExp(orderId) })).toBeVisible({ timeout: 20_000 });
  await adminPage.getByRole("link", { name: new RegExp(orderId) }).click();
  await expect(adminPage).toHaveURL(new RegExp(`/admin/orders/${orderId}$`));

  const steps: { label: RegExp; trackerStage: string }[] = [
    { label: /Mark as Preparing/, trackerStage: "Preparing" },
    { label: /Mark as On the way/, trackerStage: "On the way" },
    { label: /Mark as Delivered/, trackerStage: "Delivered" },
  ];

  for (const step of steps) {
    await adminPage.getByRole("button", { name: step.label }).click();
    await expect(adminPage.getByText(step.trackerStage).first()).toBeVisible();

    // The customer's own tab, on the public tracker, picks up the same change via its 15 s poll —
    // reload here instead of waiting the full interval to keep the test fast.
    await page.reload();
    await expect(page.locator('li[aria-current="step"]')).toContainText(step.trackerStage);
  }

  await adminContext.close();
});
