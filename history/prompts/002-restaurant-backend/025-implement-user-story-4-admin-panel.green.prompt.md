---
id: 025
title: Implement user story 4 admin panel
stage: green
date: 2026-09-27
surface: agent
model: claude-sonnet-5
feature: 002-restaurant-backend
branch: 002-restaurant-backend
user: Shuaibali0786
command: /sp.implement
labels: ["backend", "frontend", "admin", "auth", "optimistic-locking", "polling", "e2e"]
links:
  spec: specs/002-restaurant-backend/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - backend/app/schemas/auth.py
 - backend/app/schemas/admin.py
 - backend/app/schemas/admin_catalog.py
 - backend/app/services/auth.py
 - backend/app/services/admin.py
 - backend/app/services/admin_catalog.py
 - backend/app/services/orders.py
 - backend/app/api/routes/auth.py
 - backend/app/api/routes/admin/auth.py
 - backend/app/api/routes/admin/orders.py
 - backend/app/api/routes/admin/summary.py
 - backend/app/api/routes/admin/areas.py
 - backend/app/main.py
 - backend/tests/unit/test_transitions.py
 - backend/tests/integration/test_admin_orders_api.py
 - frontend/src/lib/types.ts
 - frontend/src/lib/api.ts
 - frontend/src/lib/validation.ts
 - frontend/src/lib/chime.ts
 - frontend/src/stores/session.ts
 - frontend/src/proxy.ts
 - frontend/src/app/layout.tsx
 - frontend/src/components/layout/SiteChrome.tsx
 - frontend/src/app/admin/login/page.tsx
 - frontend/src/components/admin/AdminLoginForm.tsx
 - frontend/src/app/admin/(panel)/layout.tsx
 - frontend/src/components/admin/AdminShell.tsx
 - frontend/src/components/admin/TodayStats.tsx
 - frontend/src/components/admin/NewOrderAlert.tsx
 - frontend/src/components/admin/OrdersBoard.tsx
 - frontend/src/app/admin/(panel)/page.tsx
 - frontend/src/components/admin/OrderDetail.tsx
 - frontend/src/components/admin/StatusControl.tsx
 - frontend/src/components/admin/AdminOrderView.tsx
 - frontend/src/app/admin/(panel)/orders/[id]/page.tsx
 - frontend/src/components/admin/MenuTable.tsx
 - frontend/src/app/admin/(panel)/menu/page.tsx
 - frontend/src/components/admin/AreasTable.tsx
 - frontend/src/app/admin/(panel)/areas/page.tsx
 - frontend/tests/e2e/order-lifecycle.spec.ts
 - frontend/tests/e2e/helpers.ts
 - specs/002-restaurant-backend/tasks.md
tests:
 - backend: uv run ruff check . -> all clean
 - backend: uv run mypy app -> Success, no issues found in 47 source files
 - backend: uv run pytest -q -> 71 passed, 67 skipped (need TEST_DATABASE_URL); test_transitions.py covers forward steps, cancel-from-any-non-terminal, skip-rejected, terminal-immutable, expected_status conflict/success; test_admin_orders_api.py covers 401/403, admin-only login, list/detail/status/summary
 - frontend: npx tsc --noEmit -> clean
 - frontend: npm run lint -> clean
 - e2e (real backend, real Neon dev DB, production build on port 3100): new order-lifecycle.spec.ts passes standalone and serially with the rest of order-flow.spec.ts (guest checkout -> admin login -> Preparing -> On the way -> Delivered, customer tracker verified after each step); full suite re-run clean at --workers=1 (a --workers=4 run hit transient "socket hang up" from the single dev backend under parallel load against remote Neon, not a product bug)
 - manual (curl through the Next.js proxy on port 3000, real Neon dev DB): admin login, GET /admin/orders, GET /admin/orders/{id} (full phone/address for admin, masked/hidden for the public tracker), PATCH .../status through confirmed->preparing->on-the-way->delivered, a stale expectedStatus correctly rejected with 409 INVALID_TRANSITION, GET /admin/summary/today, GET/PATCH /admin/menu-items (price edit, reverted to the seeded 690), GET /admin/delivery-areas
 - manual: curl HTTP 200 on /admin, /admin/orders/[id], /admin/menu, /admin/areas with a session cookie; 307 to /admin/login without one (proxy.ts)
---

## Prompt

Commit User Story 3. Then /sp.implement User Story 4 only (admin panel at /admin, in our fire theme):
- Admin sign-in page (separate from customer login), using the admin from .env.
- Dashboard: today's orders count and sales total, and a live orders list (refresh every 15 seconds) with a sound/visual alert for new orders.
- Order detail: items, options, extras, notes, customer name, phone, address; buttons to move status Confirmed → Preparing → On the way → Delivered, or Cancel (with confirmation).
- Menu management: change price, mark sold out / available / hidden.
- Delivery areas: edit fee and turn areas on/off.
- Works well on a phone too, since the restaurant may use it on a mobile.
Stop after US4 and tell me in simple steps: how to open the admin panel, log in, and move a test order through all statuses while watching the customer tracker update.

## Response snapshot

Confirmed US3 was already committed (94e406e). Implemented US4 plus, at the user's explicit request, the menu- and delivery-area-management pieces normally scoped to US6 (noted as pulled forward in tasks.md, same precedent as T069). Backend: `auth.authenticate()` (shared identifier/password login with a generic error and LoginGuard lockout, `require_role` for admin-only), admin login/logout/me routes with the `kbg_session` cookie, `services/admin.py` (`list_admin_orders`, `today_summary`, aggregating in Python since mypy rejects typed-column `.in_()`/`.group_by()`), `change_status` extended with an `expected_status` optimistic-lock parameter (409 `INVALID_TRANSITION` with `details.currentStatus` on conflict), and `admin/orders.py`/`admin/summary.py`/`admin/areas.py` routes — all verified against the real Neon dev database via curl through the Next.js proxy, including a live stale-lock 409 and a full confirmed→preparing→on-the-way→delivered walk with the public tracker checked after each step. Frontend: `AdminLoginForm`/`admin/login` page, `AdminShell` (nav + session guard), `TodayStats`/`NewOrderAlert` (Web Audio chime, `aria-live`, title badge)/`OrdersBoard` (15s polling, new-order highlight, status/date filters), `OrderDetail`/`StatusControl`/`AdminOrderView` (order detail page with the same optimistic-lock conflict handled by refetching instead of reloading), `MenuTable`/`AreasTable` (inline price/fee editing, sold-out/hidden/enabled toggles). Discovered the single root layout was wrapping every route including `/admin/*` in the customer nav/footer; fixed with a new `SiteChrome` client component doing a pathname check rather than Next's more invasive "multiple root layouts" restructuring. Wrote `order-lifecycle.spec.ts` (guest checkout → admin login → all three status moves → tracker verified live) and added `/admin/login` to the shared `ROUTES` list for a11y/responsive coverage; `/admin` and `/admin/orders/[id]` need a session so aren't in that unauthenticated list — covered instead by the new e2e spec and manual verification. Fixed three `react-hooks/set-state-in-effect` lint errors (derived-state-from-props pattern moved to render-time adjustment instead of an effect) and one stale `NEXT_LABEL`/`STATUS_LABEL` mix-up where the conflict message would have shown the wrong human-readable status name.

## Outcome

- ✅ Impact: staff can sign in separately from customers, run the live order board with a sound/visual new-order alert, move any order through its full lifecycle with race-safe optimistic locking, and edit menu prices/availability and delivery-area fees/on-off — all mobile-friendly (44px targets, no horizontal scroll)
- 🧪 Tests: 71 backend unit/integration tests, full frontend typecheck/lint clean, e2e order-lifecycle spec passing against the real dev backend, full e2e suite re-run clean serially
- 📁 Files: ~40 changed/new files across backend/ and frontend/
- 🔁 Next prompts: User Story 5 (customer accounts/login) is the natural next step; remaining US6 scope (add-area, contact messages/newsletter subscriber screens) is still open
- 🧠 Reflection: Playwright's own webServer (port 3100) vs. the backend's `FRONTEND_URL` (3000) needs a temporary multi-origin override for e2e runs — recurring friction across US1/US3/US4 sessions, worth a permanent `.env` entry or a documented one-line export instead of rediscovering it each time

## Evaluation notes (flywheel)

- Failure modes observed: React Compiler's `react-hooks/set-state-in-effect` flagged three places where a prop-derived local input value was synced via `useEffect(() => setValue(...), [prop])` — fixed by adjusting state during render instead (the React-docs-recommended pattern), not by suppressing the rule
- Graders run and results (PASS/FAIL): ruff/mypy/pytest/eslint/tsc all PASS; e2e PASS serially, transient parallel-worker socket-hangup against the single dev backend is an infra artifact, not a regression
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): keep a documented `FRONTEND_URL=http://localhost:3000,http://localhost:3100` note (or a dedicated `.env.e2e`) so this CORS friction stops recurring every time e2e specs touch the real backend
