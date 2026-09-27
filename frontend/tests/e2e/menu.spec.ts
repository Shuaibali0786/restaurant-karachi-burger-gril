import { expect, test } from "@playwright/test";

test("search, filter and sort are reflected in the URL", async ({ page }) => {
  await page.goto("/menu");
  await page.locator("main").getByLabel("Search the menu").fill("tikka");
  await expect(page).toHaveURL(/q=tikka/);
  await page.getByRole("group", { name: "Filter by category" }).getByRole("button", { name: /^BBQ/ }).click();
  await page.getByLabel("Sort by").selectOption("price-desc");
  await expect(page).toHaveURL(/category=bbq/);
  await expect(page).toHaveURL(/sort=price-desc/);
  await expect(page.locator("main article h3")).toHaveText(["Grill Mix Platter", "Charcoal Chicken Tikka"]);
});

test("no results shows a friendly empty state", async ({ page }) => {
  await page.goto("/menu?q=pizza");
  await expect(page.getByRole("heading", { name: "No matches" })).toBeVisible();
});

test("item pages are shareable and unknown items are 404", async ({ page }) => {
  await page.goto("/menu/crispy-bucket");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Crispy Bucket (6 pcs)");
  await expect(page.locator("main")).toContainText("+ Rs 3,280");

  const response = await page.goto("/menu/not-a-real-item");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("link", { name: "Back to menu" })).toBeVisible();
});

test("Meal option says what it includes", async ({ page }) => {
  await page.goto("/menu/burns-road-zinger");
  await expect(page.locator("main")).toContainText("Includes Masala Fries + Chilled Cola");
});
