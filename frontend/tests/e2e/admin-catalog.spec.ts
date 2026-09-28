import { expect, test, type Page } from "@playwright/test";

async function signInAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email or mobile number").fill(process.env.ADMIN_EMAIL!);
  await page.getByRole("textbox", { name: "Password" }).fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/, { timeout: 10_000 });
}

test("admin adds a delivery area, sees it offered to customers, then removes it", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop-1280", "changes shared data: one viewport only");
  test.skip(!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD, "set ADMIN_EMAIL/ADMIN_PASSWORD to run this spec");
  const name = `E2E Area ${Date.now()}`;
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  await signInAsAdmin(page);
  await page.goto("/admin/areas");
  await page.getByLabel("New area name").fill(name);
  await page.getByLabel("Fee (Rs)").fill("275");
  await page.getByRole("button", { name: "Add area" }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();

  const offered = await (await page.request.get("/api/v1/delivery-areas")).json();
  expect(offered.find((area: { id: string; fee: number }) => area.id === id)?.fee).toBe(275);

  await page.getByRole("button", { name: `Remove ${name}` }).click();
  await page.getByRole("button", { name: "Yes, remove" }).click();
  await expect(page.getByText(name, { exact: true })).toBeHidden();
  const after = await (await page.request.get("/api/v1/delivery-areas")).json();
  expect(after.some((area: { id: string }) => area.id === id)).toBe(false);
});

test("admin changes a menu price and the API serves the new price", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop-1280", "changes shared data: one viewport only");
  test.skip(!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD, "set ADMIN_EMAIL/ADMIN_PASSWORD to run this spec");
  await signInAsAdmin(page);
  await page.goto("/admin/menu");
  const price = page.getByLabel("Price for Burns Road Zinger");
  const original = await price.inputValue();
  await price.fill("777");
  await price.press("Enter");
  await expect(async () => {
    const item = await (await page.request.get("/api/v1/menu-items/burns-road-zinger")).json();
    expect(item.basePrice).toBe(777);
  }).toPass({ timeout: 10_000 });
  await price.fill(original);
  await price.press("Enter");
  await expect(async () => {
    const item = await (await page.request.get("/api/v1/menu-items/burns-road-zinger")).json();
    expect(item.basePrice).toBe(Number(original));
  }).toPass({ timeout: 10_000 });
});
