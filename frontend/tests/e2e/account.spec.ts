import { expect, test } from "@playwright/test";
import { completeDeliveryTiming, freshStart } from "./helpers";

// Signup is limited to 5 per hour per IP, so the account journey runs on one viewport only.
test("sign up, checkout pre-filled, My orders, Order again, log out and in", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop-1280", "account journey checked on one viewport (signup rate limit)");
  const email = `e2e-${Date.now()}@example.com`;
  const password = "fire-wings-8";

  await freshStart(page, "/signup");
  await page.getByLabel("Full name").fill("Sana Ahmed");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Mobile number").fill("03211234567");
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
  await page.getByRole("textbox", { name: "Confirm password" }).fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/account\/orders$/, { timeout: 10_000 });
  await expect(page.getByText("No orders yet")).toBeVisible();

  // Checkout starts with the saved name and phone.
  await page.goto("/menu");
  await page.getByRole("button", { name: "Add Burns Road Zinger", exact: true }).first().click();
  const sheet = page.locator("dialog[open]");
  await sheet.locator("label", { has: page.locator('input[value="single"]') }).click();
  await sheet.getByRole("button", { name: /^Add to cart/ }).click();
  await page.getByRole("button", { name: /^Open cart/ }).click();
  await page.locator("dialog[open]").getByRole("link", { name: /^Checkout/ }).click();
  await expect(page.getByLabel("Full name")).toHaveValue("Sana Ahmed");
  await expect(page.getByLabel("Mobile number")).toHaveValue(/3211234567/);
  await page.getByLabel("Delivery area").selectOption("clifton");
  await page.getByLabel("Full address").fill("House 12, Street 4, Block 5");
  await completeDeliveryTiming(page);
  await page.getByRole("button", { name: /^Place order/ }).click();
  await expect(page).toHaveURL(/\/order\/(KBG-\d{5})$/, { timeout: 10_000 });
  const orderId = new URL(page.url()).pathname.split("/").pop()!;

  // Log out and back in, then see the order and order it again.
  await page.getByRole("button", { name: "Log out" }).click();
  await page.goto("/login");
  await page.getByLabel("Email or mobile number").fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/account\/orders$/, { timeout: 10_000 });
  await expect(page.getByRole("link", { name: orderId })).toBeVisible();
  await page.getByRole("button", { name: "Order again" }).first().click();
  await expect(page.locator("dialog[open]")).toContainText("Burns Road Zinger");
});

test("guest checkout still works with no account", async ({ page }) => {
  await freshStart(page, "/menu");
  await page.getByRole("button", { name: "Add Burns Road Zinger", exact: true }).first().click();
  const sheet = page.locator("dialog[open]");
  await sheet.locator("label", { has: page.locator('input[value="single"]') }).click();
  await sheet.getByRole("button", { name: /^Add to cart/ }).click();
  await page.getByRole("button", { name: /^Open cart/ }).click();
  await page.locator("dialog[open]").getByRole("link", { name: /^Checkout/ }).click();
  await expect(page.getByLabel("Full name")).toHaveValue("");
  await page.getByLabel("Full name").fill("Guest Buyer");
  await page.getByLabel("Mobile number").fill("03001234567");
  await page.getByLabel("Delivery area").selectOption("clifton");
  await page.getByLabel("Full address").fill("House 12, Street 4, Block 5");
  await completeDeliveryTiming(page);
  await page.getByRole("button", { name: /^Place order/ }).click();
  await expect(page).toHaveURL(/\/order\/KBG-\d{5}$/, { timeout: 10_000 });
});

test("account pages send a visitor with no session to log in", async ({ page }) => {
  await page.goto("/account/orders");
  await expect(page).toHaveURL(/\/login\?from=%2Faccount%2Forders$/);
});
