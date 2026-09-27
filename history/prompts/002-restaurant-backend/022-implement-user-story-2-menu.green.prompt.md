---
id: 022
title: Implement user story 2 menu
stage: green
date: 2026-09-27
surface: agent
model: claude-sonnet-5
feature: 002-restaurant-backend
branch: 002-restaurant-backend
user: Shuaibali0786
command: /sp.implement
labels: ["backend", "frontend", "menu", "pricing", "admin", "sold-out"]
links:
  spec: specs/002-restaurant-backend/spec.md
  ticket: null
  adr: history/adr/0003-server-authoritative-pricing-and-parity.md
  pr: null
files:
 - backend/app/schemas/menu.py
 - backend/app/services/menu.py
 - backend/app/api/routes/menu.py
 - backend/app/services/pricing.py
 - backend/app/schemas/admin_catalog.py
 - backend/app/services/admin_catalog.py
 - backend/app/api/routes/admin/menu.py
 - backend/app/main.py
 - backend/app/cli.py
 - backend/tests/unit/test_pricing.py
 - backend/tests/unit/test_pricing_parity.py
 - backend/tests/integration/test_menu_api.py
 - backend/tests/conftest.py
 - frontend/src/lib/api.ts
 - frontend/src/app/menu/page.tsx
 - frontend/src/app/menu/[slug]/page.tsx
 - frontend/src/app/layout.tsx
 - frontend/src/components/menu/ProductCard.tsx
 - frontend/src/components/menu/ItemDetail.tsx
 - frontend/src/components/menu/ItemModal.tsx
 - frontend/src/components/menu/MenuBrowser.tsx
 - frontend/src/components/cart/CartDrawer.tsx
 - frontend/src/components/cart/CartLine.tsx
 - frontend/src/hooks/useCatalog.ts
 - frontend/tests/unit/catalogue.test.ts
 - frontend/tests/unit/pricing.test.ts
 - frontend/tests/unit/cart-totals.test.ts
 - specs/002-restaurant-backend/tasks.md
tests:
 - backend: uv run pytest -q -> 71 passed, 16 skipped (need TEST_DATABASE_URL); includes 15 new pricing unit/parity tests against the real seed JSON
 - backend: ruff check/format, mypy app -> all clean
 - frontend: npm test -> 75 passed (catalogue.test.ts and pricing.test.ts switched to lib/menu-view.ts)
 - frontend: npm run lint / tsc --noEmit / next build -> all clean, 33 item pages generated
 - e2e (against the real Neon dev DB + a running backend): a11y.spec.ts, menu.spec.ts (43 passed, 1 skip), responsive.spec.ts (68 passed, 16 skipped screenshot-only tests)
 - manual: curl + a real browser (Playwright) confirmed sold-out and hidden states end to end against the dev database, then reverted
---

## Prompt

Commit the Setup and Foundational work.
Then /sp.implement User Story 2 only (menu from the database): menu API endpoints, pricing module with parity tests against the frontend, and switch the frontend menu, categories, item modal and /menu/[slug] to load from the API. Admin can mark an item sold out (API only for now).
Stop after US2 and tell me exactly how to run backend + frontend together and what I should check in the browser to prove the menu now comes from the database (for example, mark one item sold out and see it on the site).

## Response snapshot

Committed the Setup/Foundational work first (commit d276b45), catching and deleting a stray file that had leaked the real admin password in plaintext before it was ever staged or committed. Then implemented US2: the full pricing module (unit_price, active_promo_for, promo_discount_per_unit, resolve_cart, cart_totals) proven identical to the frontend across 319 unit-price cases and 20 cart scenarios; the public menu API (/categories, /menu-items, /menu-items/{slug}, /promos, /delivery-areas); an admin-only PATCH /admin/menu-items/{slug} (brought forward from US6 at the user's explicit request) so staff can toggle sold-out/available/price now; and the full frontend switch (api.ts, the item detail page's dynamicParams + "not available" state, sold-out UI in ProductCard/ItemDetail/CartLine, and friendly load-failure states in MenuBrowser/useCatalog/CartDrawer/ItemModal). Found and fixed a site-wide bug along the way: the root layout's getPromos() call had no failure guard, so an unreachable backend would take down every page, not just /menu — added a .catch(() => []) fallback. Verified end to end with a real browser: marked Burns Road Zinger sold out via the admin API against the live Neon dev database and watched the "Sold out" badge/disabled button appear on the menu grid and in the item dialog, then hid Crispy Bucket and confirmed the "This item isn't available right now" page, then reverted both. Ran the existing a11y/menu/responsive Playwright suites against the seeded backend (111 passed, 0 regressions). Marked T035-T044 done in tasks.md (T034 and T069 were already done from earlier sessions).

## Outcome

- ✅ Impact: the live site's menu, item pages and item dialog now read from the database; staff can mark items sold out via the API
- 🧪 Tests: 71 backend + 75 frontend unit tests, 111 e2e tests, all passing; pricing parity proven for every menu item
- 📁 Files: ~28 changed/new files across backend/ and frontend/
- 🔁 Next prompts: /sp.implement User Story 1 (real orders), or continue toward US3/US4
- 🧠 Reflection: switching a shared root-layout data call to the network has a much larger blast radius than switching a single page — worth checking on every future API cutover

## Evaluation notes (flywheel)

- Failure modes observed: a stale backend process from an earlier session held port 8000, so a fresh server silently failed to bind and old (route-less) responses looked like a routing bug for several minutes; `sleep N && ...` is blocked by the harness and had to be replaced with a background poll loop
- Graders run and results (PASS/FAIL): ruff/mypy/eslint/tsc/pytest/vitest/playwright all PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): kill server processes by port (netstat/Get-NetTCPConnection) rather than by name, to avoid the stale-process trap
