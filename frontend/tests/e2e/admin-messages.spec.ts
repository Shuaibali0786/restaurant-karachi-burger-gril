import { expect, test } from "@playwright/test";

// Contact-form and newsletter sign-ups are limited to 5 per hour per IP, so this runs on one viewport.
test("a contact message and a newsletter sign-up reach the admin panel; mark as read", async ({ page, browser }, info) => {
  test.skip(info.project.name !== "desktop-1280", "rate limit: one viewport only");
  test.skip(!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD, "set ADMIN_EMAIL/ADMIN_PASSWORD to run this spec");

  const stamp = Date.now();
  const text = `Do you do catering for 40 people? (${stamp})`;
  const news = `fan-${stamp}@example.com`;

  await page.goto("/contact");
  await page.getByLabel("Your name").fill("E2E Visitor");
  await page.getByLabel("Mobile number").fill("03001234567");
  await page.getByLabel("Message").fill(text);
  await page.getByRole("button", { name: /send/i }).click();
  await expect(page.getByText("Thanks! We'll get back to you soon.")).toBeVisible();

  await page.getByLabel("Email address").fill(news);
  await page.getByRole("button", { name: "Subscribe" }).click();
  await expect(page.getByText("You're on the list!")).toBeVisible();

  const context = await browser.newContext();
  const admin = await context.newPage();
  await admin.goto("/admin/login");
  await admin.getByLabel("Email or mobile number").fill(process.env.ADMIN_EMAIL!);
  await admin.getByRole("textbox", { name: "Password" }).fill(process.env.ADMIN_PASSWORD!);
  await admin.getByRole("button", { name: "Sign in" }).click();
  await expect(admin).toHaveURL(/\/admin$/, { timeout: 10_000 });
  await admin.getByRole("link", { name: /^Messages/ }).click();

  const card = admin.getByRole("listitem").filter({ hasText: text });
  await expect(card).toBeVisible();
  await expect(card).toContainText("New");
  await card.getByRole("button", { name: "Mark as read" }).click();
  await expect(card.getByRole("button", { name: "Mark as unread" })).toBeVisible();

  await admin.getByRole("tab", { name: /Newsletter sign-ups/ }).click();
  await expect(admin.getByText(news)).toBeVisible();
  await context.close();
});
