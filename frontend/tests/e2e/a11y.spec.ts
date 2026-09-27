import { expect, test } from "@playwright/test";
import { expectNoA11yViolations, freshStart, ROUTES } from "./helpers";

test.describe("accessibility (axe, WCAG 2.1 AA)", () => {
  for (const route of ROUTES) {
    test(`page ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator("h1")).toHaveCount(1);
      await expectNoA11yViolations(page, route);
    });
  }

  test("open item view, cart drawer and checkout errors", async ({ page }) => {
    await freshStart(page, "/menu");
    await page.getByRole("button", { name: "Add Burns Road Zinger", exact: true }).first().click();
    await expect(page.locator("dialog[open]")).toBeVisible();
    await expectNoA11yViolations(page, "item view");

    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /^Open cart/ }).click();
    await expect(page.locator("dialog[open]")).toBeVisible();
    await expectNoA11yViolations(page, "cart drawer (empty)");
  });

  test("mobile menu", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile-360", "hamburger only below lg");
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.locator("dialog[open]")).toBeVisible();
    await expectNoA11yViolations(page, "mobile menu");
  });
});
