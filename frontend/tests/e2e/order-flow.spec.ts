import { expect, test } from "@playwright/test";
import { addViaItemView, completeDeliveryTiming, expectNoA11yViolations, freshStart } from "./helpers";

test("customise → cart → checkout → confirmation (real backend)", async ({ page }) => {
  await freshStart(page, "/menu");

  // Opening an item never adds it; the add button is gated on the option.
  await page.getByRole("button", { name: "Add Burns Road Zinger", exact: true }).first().click();
  const sheet = page.locator("dialog[open]");
  await expect(sheet).toBeVisible();
  await expect(page).toHaveURL(/item=burns-road-zinger/);
  await expect(sheet.getByRole("button", { name: /^Add to cart/ })).toHaveAttribute("aria-disabled", "true");
  // aria-disabled (not disabled) so a tap can point the customer at what's missing.
  await sheet.getByRole("button", { name: /^Add to cart/ }).click({ force: true });
  await expect(sheet.getByRole("alert")).toContainText("Please choose an option");

  await sheet.locator("label", { has: page.locator('input[value="double"]') }).click();
  await sheet.locator("label", { hasText: "Extra cheese" }).click();
  await sheet.getByRole("button", { name: /^Increase quantity/ }).click();
  await expect(sheet.getByRole("button", { name: /^Add to cart/ })).toContainText("Rs 2,180");
  await sheet.getByRole("button", { name: /^Add to cart/ }).click();
  await expect(page.getByRole("button", { name: "Open cart, 2 items" })).toBeVisible();

  // Drawer shows the line and free delivery (Rs 2,180 ≥ Rs 1,500).
  await page.getByRole("button", { name: /^Open cart/ }).click();
  const drawer = page.locator("dialog[open]");
  await expect(drawer).toContainText("Double");
  await expect(drawer).toContainText("Extra cheese");
  await expect(drawer).toContainText("You've unlocked free delivery!");
  await drawer.getByRole("link", { name: /^Checkout/ }).click();

  // Checkout validation, then a valid Cash on Delivery order.
  await expect(page).toHaveURL(/\/checkout$/);
  await page.getByRole("button", { name: /^Place order/ }).click();
  await expect(page.getByRole("alert").first()).toContainText("highlighted fields");
  await expect(page.getByLabel("Full name")).toBeFocused();
  await expectNoA11yViolations(page, "checkout with errors");

  await page.getByLabel("Full name").fill("Ayesha Khan");
  await page.getByLabel("Mobile number").fill("03001234567");
  await page.getByLabel("Delivery area").selectOption("clifton");
  await page.getByLabel("Full address").fill("House 12, Street 4, Block 5");
  await completeDeliveryTiming(page); // ASAP if the real kitchen is open right now, otherwise the next slot
  await page.getByRole("button", { name: /^Place order · Rs 2,180/ }).click();

  // A real, server-saved KBG- order (checked directly against the database in
  // backend/tests/integration/test_orders_api.py). GET /api/v1/orders/{number} — the public tracker
  // read this page will eventually poll — is User Story 3; this page still reads its own copy from
  // this device until then, which is exactly what it shows next.
  await expect(page).toHaveURL(/\/order\/KBG-\d{5}$/, { timeout: 10_000 });
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Your order is confirmed");
  await expect(page.locator('li[aria-current="step"]')).toContainText("Order confirmed");
  await expect(page.getByRole("button", { name: "Open cart, empty" })).toBeVisible();
  await expect(page.getByText("Rs 2,180").first()).toBeVisible();
});

test("the server ignores a price the browser sends and refuses an unknown field", async ({ request }) => {
  const response = await request.post("/api/v1/orders", {
    headers: { "Idempotency-Key": crypto.randomUUID(), "Content-Type": "application/json" },
    data: {
      customer: { name: "Ayesha Khan", phone: "0300-1234567" },
      delivery: { area: "clifton", address: "House 12, Street 4, Block 5" },
      timing: { type: "asap" },
      payment: "cod",
      lines: [
        {
          itemSlug: "burns-road-zinger",
          optionId: "single",
          addonIds: [],
          note: "",
          quantity: 1,
          addedAt: new Date().toISOString(),
          unitPrice: 1, // tampered: the schema forbids unknown fields, so this is rejected outright
        },
      ],
    },
  });
  expect(response.status()).toBe(422);
  const body = await response.json();
  expect(body.error.code).toBe("VALIDATION_FAILED");
});

test("delivery fee applies below Rs 1,500 with a nudge", async ({ page }) => {
  await freshStart(page, "/menu");
  await addViaItemView(page, "Double Trouble Cheese", "single");
  await page.goto("/cart");
  await expect(page.locator("main")).toContainText("Add Rs 310 more for free delivery");
  await expect(page.locator("main")).toContainText("Rs 1,340");
});

test("keyboard only: open an item, choose, add, focus returns", async ({ page }, info) => {
  test.skip(info.project.name === "mobile-360", "keyboard flow checked on desktop sizes");
  await freshStart(page, "/menu");
  const add = page.getByRole("button", { name: "Add Saddar Shawarma", exact: true }).first();
  await add.focus();
  await page.keyboard.press("Enter");
  const dialog = page.locator("dialog[open]");
  await expect(dialog).toBeVisible();

  await dialog.locator('input[value="regular"]').focus();
  await page.keyboard.press("Space");
  await dialog.getByRole("button", { name: /^Add to cart/ }).focus();
  await expect(dialog.getByRole("button", { name: /^Add to cart/ })).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await expect(add).toBeFocused();
  await expect(page.getByRole("button", { name: "Open cart, 1 item" })).toBeVisible();
});

test("reduced motion keeps every section visible and removes decorative motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".animate-ember-rise").first()).toBeHidden();
  for (const heading of ["Most Loved Items", "Fresh off the coals", "What Karachi says", "Taste the fire"]) {
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
});
