import { expect, test } from "@playwright/test";
import { ROUTES } from "./helpers";

test.describe("responsive layout", () => {
  for (const route of ROUTES) {
    test(`no horizontal overflow on ${route}`, async ({ page }) => {
      await page.goto(route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBe(0);
    });
  }

  test("primary controls are at least 44×44 px", async ({ page }) => {
    await page.goto("/menu");
    const small = await page.evaluate(() =>
      [...document.querySelectorAll("header button, header a, main button:not([role=tab]), main select, main input")]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          // Skip hidden elements and the stretched card-title buttons (their ::after covers the whole card).
          if (r.width === 0 || cs.visibility === "hidden" || el.classList.contains("sr-only") || el.closest("h3")) return false;
          return r.height < 43.5 || r.width < 43.5;
        })
        .map((el) => `${el.tagName} ${el.getAttribute("aria-label") ?? el.textContent?.trim()}`),
    );
    expect(small).toEqual([]);
  });
});

// Screenshots for the README / portfolio (run with SCREENSHOTS=1).
test.describe("screenshots", () => {
  test.skip(!process.env.SCREENSHOTS, "set SCREENSHOTS=1 to refresh docs/screenshots");
  for (const [route, name] of [
    ["/", "home"],
    ["/menu", "menu"],
    ["/checkout", "checkout"],
    ["/about", "about"],
  ] as const) {
    test(`capture ${name}`, async ({ page }, info) => {
      await page.goto(route);
      await page.waitForTimeout(600);
      await page.screenshot({ path: `../docs/screenshots/${name}-${info.project.name}.jpg`, type: "jpeg", quality: 80 });
    });
  }
});
