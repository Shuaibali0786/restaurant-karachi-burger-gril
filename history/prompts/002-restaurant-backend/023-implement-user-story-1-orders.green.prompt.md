---
id: 023
title: Implement user story 1 orders
stage: green
date: 2026-09-27
surface: agent
model: claude-sonnet-5
feature: 002-restaurant-backend
branch: 002-restaurant-backend
user: Shuaibali0786
command: /sp.implement
labels: ["backend", "frontend", "orders", "pricing", "checkout", "idempotency"]
links:
  spec: specs/002-restaurant-backend/spec.md
  ticket: null
  adr: history/adr/0003-server-authoritative-pricing-and-parity.md
  pr: null
files:
 - backend/app/schemas/orders.py
 - backend/app/services/orders.py
 - backend/app/api/routes/orders.py
 - backend/app/main.py
 - backend/app/services/menu.py
 - backend/tests/integration/test_orders_api.py
 - frontend/src/lib/api.ts
 - frontend/src/lib/pricing.ts
 - frontend/src/lib/validation.ts
 - frontend/src/components/checkout/CheckoutForm.tsx
 - frontend/src/components/checkout/CheckoutView.tsx
 - frontend/tests/unit/pricing-fee.test.ts
 - frontend/tests/unit/orders.test.ts
 - frontend/tests/e2e/helpers.ts
 - frontend/tests/e2e/order-flow.spec.ts
 - specs/002-restaurant-backend/tasks.md
tests:
 - backend: uv run pytest -q -> 71 passed, 32 skipped (need TEST_DATABASE_URL); test_orders_api.py covers happy path, tampering, Wednesday/area pricing, closed hours, invalid slots, sold-out/hidden items, unknown item/option, area validation, field validation, idempotent replay + conflict, missing header, rate limit
 - backend: ruff check/format, mypy app -> all clean
 - frontend: npm test -> 79 passed (pricing-fee.test.ts added, orders.test.ts rewritten for the network placeOrder)
 - frontend: lint / tsc --noEmit / next build -> clean
 - e2e (real backend, real Neon dev DB): order-flow.spec.ts full checkout -> confirmation on desktop + mobile, tampered-field rejection, all a11y/menu suites re-run with no regressions
 - manual: a real order placed through the running site (curl mimicking the browser through the /api rewrite) and confirmed directly in the database (order, line snapshot, status event)
---

## Prompt

Commit User Story 2. Then /sp.implement User Story 1 only (real Cash-on-Delivery orders with server-side pricing, delivery areas, opening hours, rate limit, order numbers). Switch the frontend checkout to the API. Stop after US1 and tell me in simple steps how to place a test order from the website and how to see that it was saved in the database.

## Response snapshot

Confirmed US2 was already committed clean from the prior turn (e03e638). Implemented US1: `place_order` (idempotency lookup/race handling, phone normalisation, area/menu/timing validation with specific error codes, pricing via the already-proven pricing module, one-transaction insert of the order + line snapshots + initial status event), `POST /api/v1/orders` (Idempotency-Key header, 10/hour rate limit, 201/200 semantics), and the full frontend switch (api.ts placeOrder now calls the API, CheckoutForm creates one idempotency key per attempt, area-fee-aware totals, and error-code-specific messages for sold-out/closed/area/slot/validation cases). Found and fixed a real bug during e2e verification: CartLine's extra `key` field was being sent straight through to the strict `extra="forbid"` schema, causing every real checkout to fail with a generic validation error — fixed by mapping to only the allowed fields before sending. Also caught that the planned e2e assertion for T056 assumed `GET /api/v1/orders/{number}` (User Story 3's own task, not yet built) and adjusted the test to check the confirmation page instead, without building ahead of scope. Verified end to end: the Playwright order-flow suite placed and confirmed real orders on desktop and mobile against the live Neon dev database, and a final manual curl (mimicking the browser through the same-origin proxy) produced order KBG-10005, confirmed directly in the database with its correct line snapshot and status event.

## Outcome

- ✅ Impact: checkout now places real, server-priced orders with enforced business rules; no client price is ever trusted
- 🧪 Tests: 71 backend + 79 frontend unit tests, 9 new/updated e2e tests (all passing against the real backend)
- 📁 Files: ~16 changed/new files across backend/ and frontend/
- 🔁 Next prompts: User Story 3 (live tracking) is the natural next step, since US4 (admin) and US1 both need it
- 🧠 Reflection: TypeScript's structural typing let an extra field (CartLine.key) silently ride along into a network request; only a real end-to-end run against the real backend caught it, not the type checker

## Evaluation notes (flywheel)

- Failure modes observed: (1) CartLine's extra `key` field broke every real order until mapped out explicitly; (2) Playwright's own webServer runs on a different port (3100) than dev (3000), and the backend's CORS/Origin allow-list didn't include it, so the very first e2e attempt was rejected as a forbidden origin — not a product bug, a local verification config gap; (3) a planned e2e assertion assumed a not-yet-built endpoint from a later user story
- Graders run and results (PASS/FAIL): ruff/mypy/eslint/tsc/pytest/vitest/playwright all PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): when e2e-testing against a real backend on a nonstandard port, set FRONTEND_URL to include that port up front instead of discovering the CORS gap via test failure
