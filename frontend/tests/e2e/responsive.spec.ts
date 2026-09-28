import { expect, test } from "@playwright/test";
import { freshStart, ROUTES } from "./helpers";

test.describe("responsive layout", () => {
  for (const route of ROUTES) {
    test(`no horizontal overflow on ${route}`, async ({ page }) => {
      await page.goto(route);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow).toBe(0);
    });
  }

  for (const route of ["/menu", "/login", "/signup", "/admin/login"]) {
    test(`primary controls are at least 44×44 px on ${route}`, async ({
      page,
    }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      const small = await page.evaluate(() =>
        [
          ...document.querySelectorAll(
            "header button, header a, main button:not([role=tab]), main select, main input",
          ),
        ]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            // Skip hidden elements and the stretched card-title buttons (their ::after covers the whole card).
            if (
              r.width === 0 ||
              cs.visibility === "hidden" ||
              el.classList.contains("sr-only") ||
              el.closest("h3")
            )
              return false;
            return r.height < 43.5 || r.width < 43.5;
          })
          .map(
            (el) =>
              `${el.tagName} ${el.getAttribute("aria-label") ?? el.textContent?.trim()}`,
          ),
      );
      expect(small).toEqual([]);
    });
  }
});

// Screenshots for the README / portfolio (run with SCREENSHOTS=1).
test.describe("screenshots", () => {
  test.skip(
    !process.env.SCREENSHOTS,
    "set SCREENSHOTS=1 to refresh docs/screenshots",
  );
  for (const [route, name] of [
    ["/", "home"],
    ["/menu", "menu"],
    ["/about", "about"],
  ] as const) {
    test(`capture ${name}`, async ({ page }, info) => {
      await page.goto(route);
      await page.waitForTimeout(600);
      await page.screenshot({
        path: `../docs/screenshots/${name}-${info.project.name}.jpg`,
        type: "jpeg",
        quality: 80,
      });
    });
  }

  test("capture ordering journey", async ({ page }, info) => {
    const shot = async (name: string) => {
      // Start every view from the top (including scrollable dialog panels) with no toast in the way.
      await expect(page.getByRole("button", { name: "Dismiss" })).toBeHidden({
        timeout: 10_000,
      });
      await page.evaluate(() => {
        window.scrollTo(0, 0);
        document
          .querySelectorAll("dialog[open] *")
          .forEach((el) => el.scrollTo?.(0, 0));
      });
      await page.waitForTimeout(400);
      await page.screenshot({
        path: `../docs/screenshots/${name}-${info.project.name}.jpg`,
        type: "jpeg",
        quality: 80,
      });
    };
    // Thursday 8 PM PKT: open for ASAP delivery.
    await page.clock.setFixedTime(new Date("2026-09-24T15:00:00Z"));
    await freshStart(page, "/menu");

    await page
      .getByRole("button", { name: "Add Burns Road Zinger", exact: true })
      .first()
      .click();
    const sheet = page.locator("dialog[open]");
    await sheet
      .locator("label", { has: page.locator('input[value="double"]') })
      .click();
    await page.waitForTimeout(600);
    await shot("item");
    await sheet.getByRole("button", { name: /^Add to cart/ }).click();
    await expect(
      page.getByRole("button", { name: /^Open cart, 1 item/ }),
    ).toBeVisible();

    await page.getByRole("button", { name: /^Open cart/ }).click();
    await page.waitForTimeout(600);
    await shot("cart");

    await page
      .locator("dialog[open]")
      .getByRole("link", { name: /^Checkout/ })
      .click();
    await page.getByLabel("Full name").fill("Ayesha Khan");
    await page.getByLabel("Mobile number").fill("03001234567");
    await page.getByLabel("Delivery area").selectOption("clifton");
    await page.getByLabel("Full address").fill("House 12, Street 4, Block 5");
    await page.waitForTimeout(300);
    await shot("checkout");

    await page.getByRole("button", { name: /^Place order/ }).click();
    await expect(page).toHaveURL(/\/order\/KBG-\d{5}$/, { timeout: 10_000 });
    await page.waitForTimeout(600);
    await shot("order");
  });
});
