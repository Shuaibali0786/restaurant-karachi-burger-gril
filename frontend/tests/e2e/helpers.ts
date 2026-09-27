import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export const ROUTES = [
  "/",
  "/menu",
  "/menu/burns-road-zinger",
  "/combos",
  "/favourites",
  "/login",
  "/signup",
  "/about",
  "/contact",
  "/faq",
  "/privacy",
  "/terms",
  "/track",
  "/cart",
  "/checkout",
  "/this-page-does-not-exist",
];

/** WCAG 2.1 A/AA scan; fails with a readable list of violations. */
export async function expectNoA11yViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const summary = results.violations.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes[0]?.target.join(" ")}`);
  expect(summary, `a11y violations on ${label}`).toEqual([]);
}

/** Starts every test from an empty cart/favourites/orders. */
export async function freshStart(page: Page, path = "/") {
  await page.goto(path);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

/** Adds an item the only way the site allows: through the item view. */
export async function addViaItemView(page: Page, itemName: string, option: string) {
  await page.getByRole("button", { name: `Add ${itemName}`, exact: true }).first().click();
  const dialog = page.locator("dialog[open]");
  await dialog.locator("label", { has: page.locator(`input[value="${option}"]`) }).click();
  await dialog.getByRole("button", { name: /^Add to cart/ }).click();
  await expect(page.locator("dialog[open]")).toHaveCount(0);
}
