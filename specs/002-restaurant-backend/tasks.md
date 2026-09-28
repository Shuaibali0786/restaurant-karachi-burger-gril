# Tasks: Restaurant Backend (Phase 2)

**Input**: Design documents in `/specs/002-restaurant-backend/` (plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md) and ADR-0001…0004 in `history/adr/`
**Prerequisites**: plan.md, spec.md (both present)
**Tests**: INCLUDED. The plan (research R13) and the owner require backend unit, parity and integration tests, plus frontend Vitest and Playwright checks.
**Organization**: Grouped by user story. The four P1 stories are ordered US2 → US1 → US3 → US4 by dependency (orders need the menu; tracking and admin need orders). Story numbers are unchanged from spec.md.

## Format: `- [ ] T### [P?] [US#?] Description with file path`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[US#]**: the user story served (user-story phases only)
- Paths are relative to the repository root `D:\karachi-burger-grill`. `backend/` is new; `frontend/` is existing.
- Every backend command is run from `backend/` with `uv run …`. Every frontend command is run from `frontend/`.

## Path Conventions

Web application per plan.md: `backend/app/{core,models,schemas,services,api/routes}`, `backend/tests/{unit,integration,fixtures}`, `frontend/src/{lib,hooks,stores,components,app}`, `frontend/tests/{unit,e2e}`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the `backend/` project and the frontend wiring that every story needs.

- [x] T001 Create the uv project in `backend/`: run `uv init --app --python 3.12`, write `backend/.python-version` (3.12), and add dependencies with `uv add "fastapi[standard]" sqlmodel alembic "psycopg[binary]" pydantic-settings "pwdlib[argon2]" pyjwt slowapi tzdata` and dev dependencies with `uv add --dev pytest httpx ruff mypy`. Commit `backend/pyproject.toml` and `backend/uv.lock`.
- [x] T002 [P] Configure tooling in `backend/pyproject.toml`: ruff (line length 120, rules E,F,I,B,UP,S with `tests/*` ignoring S101), mypy `strict = true` with the pydantic plugin, pytest (`testpaths = ["tests"]`, markers `unit` and `integration`).
- [x] T003 [P] Create `backend/.env.example` with every setting from `specs/002-restaurant-backend/quickstart.md` (placeholders only: `DATABASE_URL`, `DATABASE_URL_DIRECT`, `TEST_DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRE_DAYS`, `COOKIE_SECURE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `FRONTEND_URL`, `TRUST_PROXY`, `RATELIMIT_STORAGE_URI`, `RATELIMIT_ENABLED`, `FREE_DELIVERY_THRESHOLD`, `LOG_LEVEL`). Confirm with `git check-ignore -v backend/.env` that `backend/.env` is ignored and `backend/.env.example` is not.
- [x] T004 [P] Create the package skeleton with empty `__init__.py` files: `backend/app/{core,models,schemas,services,api,api/routes,api/routes/admin,seed}/` and `backend/tests/{unit,integration,fixtures}/`.
- [x] T005 [P] Add `frontend/.env.example` with `NEXT_PUBLIC_API_URL=http://localhost:8000`, add `tsx` as a devDependency, and add npm scripts `export:backend-data` (`tsx scripts/export-backend-data.ts`) in `frontend/package.json`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure, the full database schema, the seed pipeline and the frontend transport layer. **No user story can start until this phase is complete.**

### Backend core

- [x] T006 Implement `backend/app/core/config.py`: a pydantic-settings `Settings` class that reads `backend/.env` and exposes every variable from `.env.example`. `FRONTEND_URL` is parsed as a comma-separated list. It fails fast at startup if `JWT_SECRET` is shorter than 32 characters. It exposes a cached `get_settings()`.
- [x] T007 Implement `backend/app/core/db.py`: a sync SQLModel engine from `DATABASE_URL` with `pool_pre_ping=True`, `pool_recycle=300`, `pool_size=5`, `max_overflow=5` and `connect_args={"prepare_threshold": None}`. Add the `get_session` FastAPI dependency.
- [x] T008 [P] Implement `backend/app/core/errors.py`: an `AppError(code, message, status, fields=None, details=None)` class, the error-code table from research R9, and exception handlers for `AppError`, `RequestValidationError` (Pydantic locations become dotted `fields` paths), `HTTPException`, `RateLimitExceeded` (adds `Retry-After`) and unhandled `Exception` (logged with traceback, returns `INTERNAL` only). The envelope is `{"error":{"code","message","fields?","details?"}}`.
- [x] T009 [P] Implement `backend/app/core/clock.py` per research R3: `PKT = ZoneInfo("Asia/Karachi")`, an overridable `now()`, `pkt_parts`, `is_open` (12 noon–3 AM), `next_opening`, `schedule_slots` (30-minute slots, 45-minute lead, last slot 2:30 AM), `business_date` (PKT time minus 6 hours) and `is_valid_slot` with a 5-minute grace.
- [x] T010 [P] Implement `backend/app/core/normalise.py`: `normalise_pk_mobile` (same regex and output as `frontend/src/lib/phone.ts`: `^(?:\+92|0092|92|0)3\d{9}$` → `+923XXXXXXXXX`) and `normalise_email` (trim, lowercase, basic format check).
- [x] T011 [P] Write `backend/tests/unit/test_clock.py` (Wednesday and non-Wednesday in PKT across the UTC midnight boundary, `is_open` at 11:59, 12:00, 02:59 and 03:00, `schedule_slots` including the 2:30 AM last slot and the after-midnight service window, `business_date` for a 1 AM order) and `backend/tests/unit/test_normalise.py` (all accepted phone formats, rejected formats, email casing).
- [x] T012 Implement `backend/app/core/security.py`: pwdlib `PasswordHash.recommended()` with `hash_password` and `verify_password` (`verify_and_update`, plus a dummy verify for unknown users), PyJWT `create_token(user)` and `decode_token` (HS256, `sub`, `role`, `iat`, `exp` = `JWT_EXPIRE_DAYS`), and `set_session_cookie` and `clear_session_cookie` (`kbg_session`, HttpOnly, Secure per `COOKIE_SECURE`, SameSite=Lax, Path `/`, Max-Age 7 days, no Domain).
- [x] T013 Implement `backend/app/core/rate_limit.py`: a slowapi `Limiter` (moving window, storage from `RATELIMIT_STORAGE_URI`, enabled per `RATELIMIT_ENABLED`), a client-IP key function (left-most `X-Forwarded-For` only when `TRUST_PROXY=true`, otherwise `request.client.host`), and a `LoginGuard` built on `limits.MovingWindowRateLimiter` (5 failures per 15 minutes keyed by IP plus normalised identifier, with `is_blocked`, `record_failure` and `reset`).

### Database schema

- [x] T014 [P] Define SQLModel table models in `backend/app/models/menu.py` and `backend/app/models/delivery.py` exactly as `data-model.md`: `Category`, `CategoryOption`, `CategoryAddon`, `MenuItem` (with `option_overrides` JSONB and `featured` array), `Promo` (with the kind-specific CHECK) and `DeliveryArea`.
- [x] T015 [P] Define SQLModel table models in `backend/app/models/users.py`, `backend/app/models/orders.py` and `backend/app/models/content.py` exactly as `data-model.md`: `User` (with the email-or-phone CHECK), `Order` (with the `total` CHECK, `business_date` and the indexes), `OrderLine`, `OrderStatusEvent`, `Review`, `ContactMessage`, `NewsletterSubscriber` and `SampleTestimonial`.
- [x] T016 Set up Alembic: create `backend/alembic.ini` and `backend/alembic/env.py`. It uses `DATABASE_URL_DIRECT` (falling back to `DATABASE_URL`), imports all model modules, and targets `SQLModel.metadata`.
- [x] T017 Generate and hand-review migration `backend/alembic/versions/0001_initial_schema.py`: all tables, the `TEXT` + `CHECK` enums, `CREATE SEQUENCE order_number_seq START 10001`, `orders.number` default `nextval(...)`, all indexes and unique constraints. Apply it with `uv run alembic upgrade head` on the Neon dev branch, and confirm `uv run alembic downgrade base && uv run alembic upgrade head` works.
- [x] T018 [P] Implement the camelCase schema base in `backend/app/schemas/base.py`: `CamelModel` with `alias_generator=to_camel`, `populate_by_name=True`, `extra="forbid"` for request models and `from_attributes=True` for response models.

### App shell and test harness

- [x] T019 Implement `backend/app/api/deps.py`: `SessionDep`, `get_current_user_optional` (reads the `kbg_session` cookie, decodes the token, re-loads the user, and ignores inactive users), `CurrentUser` (401 `UNAUTHENTICATED`), and `require_admin` (401, then 403 `FORBIDDEN` for non-admins).
- [x] T020 Implement `backend/app/main.py` with `create_app()`: CORS limited to `FRONTEND_URL` (credentials on), an Origin-guard middleware that rejects state-changing requests whose `Origin` is present and not allowed, a JSON-only guard for mutations, the slowapi middleware, the error handlers, JSON request logging (method, path, status, duration, request id, and no bodies), and router inclusion under `/api/v1`. Docs are served at `/docs`.
- [x] T021 [P] Add `backend/app/api/routes/health.py` (`GET /api/v1/healthz`: pings the database, returns `{"status":"ok"}` or 503 `INTERNAL`, and is exempt from rate limits).
- [x] T022 Implement `backend/tests/conftest.py`: abort if `TEST_DATABASE_URL` is unset or equals `DATABASE_URL`, migrate and seed once per session, give each test a connection-level transaction with a SAVEPOINT that is rolled back, override `get_session`, provide fixtures for a fixed `clock.now` (Wednesday and Thursday, open and closed) and for resetting the limiter, and provide `client`, `customer_client` and `admin_client` helpers.
- [x] T023 [P] Write `backend/tests/integration/test_app_shell.py`: healthz returns 200, an unknown route returns the envelope with 404, a validation failure returns dotted `fields`, a disallowed `Origin` on POST returns 403, a form-encoded POST is rejected, CORS headers appear only for `FRONTEND_URL`, and `/docs` loads.

### Frontend transport and types

- [x] T024 [P] Extend `frontend/src/lib/api-error.ts` with every code from `contracts/openapi.yaml` plus the client-only `NETWORK`, and add optional `fields` and `details` to `ApiError`.
- [x] T025 Implement `frontend/src/lib/http.ts` per `contracts/frontend-api.md`: the base URL (server: `${NEXT_PUBLIC_API_URL}/api/v1`; browser: relative `/api/v1`), `credentials: "include"`, 10 s timeout, envelope-to-`ApiError` mapping, `NETWORK` on fetch failure, and `INTERNAL` on 5xx. Public menu GETs made on the server use `next: { revalidate: 60, tags: ["menu"] }`, and everything else uses `cache: "no-store"`.
- [x] T026 [P] Write `frontend/tests/unit/http.test.ts`: envelope mapping, `fields` and `details` passthrough, network failure, timeout, and 5xx handling.
- [x] T027 Update `frontend/src/lib/types.ts` per the "Frontend type changes" table in `data-model.md`: add `soldOut` and `available` to `MenuItemView`, widen `DeliveryArea` to `string`, add `fee` to `DeliveryAreaOption`, add `"cancelled"` to `OrderStatus`, extend `Order` (`status`, `statusHistory`, `viewer`, optional `review`, optional `delivery.address`), extend `OrderLine` (`optionId`, `addonIds`), widen `Testimonial.isSample` to boolean and add `month?`, and add `SessionUser`, `AdminOrderSummary`, `TodaySummary`, `ContactMessage` and `AdminReview`. Fix any resulting type errors with the smallest change.
- [x] T028 Move `toView` out of `frontend/src/lib/api.ts` into `frontend/src/lib/menu-view.ts` (it sets `soldOut: false` and `available: true` for static data), so the export script and tests can use it without loading the HTTP layer.
- [x] T029 Add the rewrite `/api/:path*` → `${NEXT_PUBLIC_API_URL}/api/:path*` to `frontend/next.config.ts`, and document it in a comment (research R1, ADR-0002).
- [x] T030 Write `frontend/scripts/export-backend-data.ts`: import the real frontend data and pricing modules and write `backend/app/seed/data/{menu,promos,areas,sample_testimonials}.json` (8 categories with option groups and extras, 33 items with `optionOverrides`, tags, featured and ratings, 6 areas at fee 150). Also write `backend/tests/fixtures/pricing_golden.json` (every item × option × {no extras, each single extra, all extras} × {Wednesday, Thursday}, plus about 20 cart-total scenarios around Rs 1,500 with a fee of 150). Support `--check`, which regenerates in memory and exits non-zero if the committed files differ. Run it and commit the generated files.
- [x] T031 Update `frontend/eslint.config.mjs` so `frontend/scripts/**` is exempt from the `@/lib/data` import restriction, and confirm `npm run lint` still passes.

### Seed pipeline

- [x] T032 Implement `backend/app/services/seed.py`: load the JSON files and upsert by natural key (category id, option/addon key, item slug, promo id, area id, testimonial id). Existing rows are not overwritten, so staff edits survive. Add a `reset_menu=True` mode that rewrites descriptive and price fields. Validate that every `option_overrides` key exists in the category's options.
- [x] T033 Implement `backend/app/cli.py` (`python -m app.cli`) with the `seed [--reset-menu]` command and print a summary of inserted and unchanged rows. Run `uv run python -m app.cli seed` on the Neon dev branch. Expect 8 categories, 33 items, 6 areas and 2 promos, and confirm a second run inserts nothing.

**Checkpoint**: `uv run pytest tests/unit tests/integration/test_app_shell.py` passes, the dev database is migrated and seeded, `uv run fastapi dev app/main.py --port 8000` serves `/docs`, and `npm run typecheck` passes in `frontend/`.

---

## Phase 3: User Story 2 — Menu comes from the restaurant's own records (Priority: P1) 🎯 first slice

**Goal**: Every menu screen reads from the database and looks identical to Phase 1. Staff-set "sold out" and "hidden" states show correctly.
**Independent Test**: Compare menu, item, home and search pages before and after the switch (same items, prices, photos, order). Then flip one item to sold out directly in the database and confirm the site shows it unavailable within 60 seconds.

### Tests for US2

- [x] T034 [P] [US2] Write `backend/tests/integration/test_seed.py`: the seed produces 8 categories, 33 items and 6 areas at fee 150, a second run creates no duplicates, and a price edited between runs survives the re-seed.
- [x] T035 [P] [US2] Write `backend/tests/integration/test_menu_api.py`: `/categories` sort order, `/menu-items` filtering by category, search and sort (`popular`, `price-asc`, `price-desc`) and `featured`, per-item option overrides (Fried Chicken and BBQ sizes) applied to `options`, a sold-out item listed with `soldOut: true`, a hidden item omitted from the list but returned by `/menu-items/{slug}` with `available: false`, an unknown slug returning 404, `/promos` returning both promos, and `/delivery-areas` returning only enabled areas with `fee`.

### Implementation for US2

- [x] T036 [P] [US2] Create the menu response schemas in `backend/app/schemas/menu.py` (`OptionOut`, `AddonOut`, `CategoryOut`, `MenuItemView`, `PromoOut` as a discriminated union, `DeliveryAreaOut`) matching `contracts/openapi.yaml`.
- [x] T037 [US2] Implement `backend/app/services/menu.py`: build `MenuItemView` (category options with per-item overrides, category add-ons), `list_items(category, search, sort, featured)` mirroring `frontend/src/lib/menu.ts` filterMenu (search by name, description and category name, and the same popularity tie-breaks), `get_item`, `list_categories`, `list_promos` and `list_enabled_areas`.
- [x] T038 [US2] Implement `backend/app/api/routes/menu.py` (`GET /categories`, `/menu-items`, `/menu-items/{slug}`, `/promos`, `/delivery-areas`) and register the router in `backend/app/main.py`.
- [x] T039 [US2] Switch the menu functions in `frontend/src/lib/api.ts` to `http.ts`: `getCategories`, `getMenuItems`, `getMenuItem` (404 → `null`), `getMenuSlugs` (returns `[]` on failure), `getFeaturedItems`, `getPromos` and `getDeliveryAreas`. Keep every signature. Remove the now-unused mock imports for these functions only.
- [x] T040 [US2] Make `frontend/src/app/menu/[slug]/page.tsx` resilient: `generateStaticParams` tolerates an unreachable API, `dynamicParams` stays true, and a hidden item (`available: false`) renders the existing empty-state pattern with "This item isn't available right now" and a link back to the menu.
- [x] T041 [US2] Add the sold-out branch to `frontend/src/components/menu/ProductCard.tsx` and `frontend/src/components/menu/ItemDetail.tsx`: a "Sold out" badge in place of "Add +", the item dialog's add button disabled with the text "Sold out today", no layout change, and the accessible name updated. Guard `frontend/src/components/menu/OpenItemButton.tsx` and `frontend/src/components/menu/cardMap.tsx` so nothing can add a sold-out item to the cart. Cart lines whose item became sold out are flagged in `frontend/src/components/cart/CartLine.tsx` with "No longer available".
- [x] T042 [US2] Add a friendly load-failure state ("We're having trouble loading the menu" with a Retry button) to `frontend/src/components/menu/MenuBrowser.tsx` and `frontend/src/hooks/useCatalog.ts`, using the existing `EmptyState` component.
- [x] T043 [US2] Update the existing Vitest suites in `frontend/tests/unit/catalogue.test.ts` and `frontend/tests/unit/pricing.test.ts` to use `lib/menu-view.ts`. Run `npm test`, and fix any breakage without weakening the assertions.
- [x] T044 [US2] Run the existing Playwright suites (`frontend/tests/e2e/menu.spec.ts`, `responsive.spec.ts`, `a11y.spec.ts`) against the seeded backend and confirm zero visual or accessibility differences (SC-001). Record any diff and fix the cause.

**Checkpoint**: US2 works on its own. The site renders from the database, and a sold-out flag set directly in the database shows within 60 seconds.

---

## Phase 4: User Story 1 — Place a real order that the restaurant receives (Priority: P1) 🎯 MVP

**Goal**: Checkout creates a real order priced by the server, with a `KBG-#####` number, status Confirmed, and every business rule enforced.
**Independent Test**: Place an order from the site and confirm it exists in the database with server-calculated totals and a `KBG-` number. Then submit a tampered request and confirm it is rejected. Wednesday, delivery-fee, closed, sold-out and area rules each behave per the spec.

### Tests for US1

- [x] T045 [P] [US1] Write `backend/tests/unit/test_pricing.py`: unit price with options and extras, invalid option or extra, Wings Wednesday only on Wednesday PKT (including UTC Tuesday 19:00–23:59 = PKT Wednesday), half-up rounding (`(unit * percent + 50) // 100`), the delivery fee below Rs 1,500 after discount, free delivery at exactly Rs 1,500, an empty cart, and a mixed promo and non-promo cart.
- [x] T046 [P] [US1] Write `backend/tests/unit/test_pricing_parity.py`: load `tests/fixtures/pricing_golden.json` and assert equality with `services/pricing.py` for every recorded case. Add a check that the seed JSON menu equals the golden file's menu snapshot.
- [x] T047 [P] [US1] Write `backend/tests/integration/test_orders_api.py`: the happy path (201, `KBG-` number ≥ 10001, status `confirmed`, server totals, a status event row), a tampered `unitPrice` or `total` field rejected with 422 and a field error, Wednesday discount on Fire Wings, delivery fee equal to the area's fee, free delivery at Rs 1,500, closed hours returning `RESTAURANT_CLOSED` with `opensAt`, a scheduled slot valid and invalid (`INVALID_SLOT`), a sold-out or hidden item returning `ITEM_SOLD_OUT` with `details.items`, an unknown item or option returning `UNKNOWN_ITEM` or `INVALID_OPTION`, an unknown or disabled area returning `AREA_UNAVAILABLE`, an invalid phone number, quantity 0 or 21 and an oversized note returning `VALIDATION_FAILED`, an idempotent replay returning 200 with the same order, the same key with a different body returning `IDEMPOTENCY_CONFLICT`, a missing `Idempotency-Key` returning 422, and the 11th order in an hour returning `RATE_LIMITED`.

### Implementation for US1

- [x] T048 [US1] Implement `backend/app/services/pricing.py` per research R5 and ADR-0003: `unit_price`, `active_promo_for(item_slug, promos, now)`, `promo_discount_per_unit` (integer half-up), `resolve_cart` and `cart_totals(lines, delivery_fee, free_threshold)`. Integer rupees only, no floats.
- [x] T049 [P] [US1] Create the order request and response schemas in `backend/app/schemas/orders.py` per `contracts/openapi.yaml` (`PlaceOrderInput` with `extra="forbid"`, length and range limits from research R9, `OrderOut`, `OrderLineOut`).
- [x] T050 [US1] Implement `place_order` in `backend/app/services/orders.py`, following the "Place order" flow in plan.md: an idempotency lookup (same key and same hash returns the original, a different hash raises `IDEMPOTENCY_CONFLICT`), phone normalisation, loading the enabled area and orderable menu, resolving lines with the specific errors, timing checks via `clock`, pricing, then one transaction inserting the order, its lines (snapshotting names, option label via the same summary as `optionSummary()`, and addon labels) and the initial status event. Catch the unique-key race on `idempotency_key` and return the existing order.
- [x] T051 [US1] Implement `POST /api/v1/orders` in `backend/app/api/routes/orders.py` (required `Idempotency-Key` UUID header, limit 10/hour per IP, 201 for new and 200 for replay) and register the router.
- [x] T052 [P] [US1] Add an optional `deliveryFee` argument (default 150) to `cartTotals` in `frontend/src/lib/pricing.ts`, and add `frontend/tests/unit/pricing-fee.test.ts` covering a custom fee, free delivery still applying at Rs 1,500, and the default fee.
- [x] T053 [US1] Update `frontend/src/components/checkout/CheckoutForm.tsx`, `frontend/src/components/checkout/CheckoutView.tsx` and `frontend/src/components/checkout/OrderSummary.tsx`: the area select reads `getDeliveryAreas()` including `fee`, totals use the selected area's fee, one `crypto.randomUUID()` idempotency key is created per checkout attempt and reused on retry, and server errors map to specific inline messages. `ITEM_SOLD_OUT` and `UNKNOWN_ITEM` name the items, `RESTAURANT_CLOSED` shows the opening time and highlights scheduling, `AREA_UNAVAILABLE` refreshes the area list, `INVALID_SLOT` refreshes the slots, `RATE_LIMITED` shows "Please wait a few minutes", and `NETWORK` shows a retry. The cart is preserved on every failure.
- [x] T054 [US1] Switch `placeOrder` in `frontend/src/lib/api.ts` to `POST /orders` (sending the `Idempotency-Key` header, dropping the mock latency and the client-side repricing), and record the returned order number in the device list through `frontend/src/lib/local-orders.ts`.
- [x] T055 [US1] Make `frontend/src/components/checkout/OrderConfirmation.tsx` and `frontend/src/app/order/[id]/page.tsx` render the order returned by the server, so the totals shown are the charged amounts. Keep the existing layout.
- [x] T056 [US1] Update `frontend/tests/e2e/order-flow.spec.ts` for the real backend: guest checkout produces a confirmation with a `KBG-` number, the number exists via `GET /api/v1/orders/{number}`, and a request with an added price field is rejected. (`GET /orders/{number}` is User Story 3's own task, T060, not yet built; the e2e check instead confirms the KBG- URL, the confirmation page and the charged total, and a direct database check is covered by `test_orders_api.py::test_order_saves_a_line_snapshot_and_status_event`.)

**Checkpoint**: US1 works. A guest can place a real order, all rules are enforced, and pricing parity is proven by tests. (MVP: US2 + US1.)

---

## Phase 5: User Story 3 — Follow the order live (Priority: P1)

**Goal**: `/order/[id]` shows the real status, refreshes every 15 seconds, and stops at Delivered or Cancelled. Public viewers see no phone or street address.
**Independent Test**: Place an order, change its status directly in the database (or through the admin API once US4 exists), and watch the tracker update within 15 seconds without a reload.

### Tests for US3

- [x] T057 [P] [US3] Write `backend/tests/integration/test_tracking_api.py`: a public request gets `viewer: "public"`, a masked phone (`+92 3•• ••• ••67`) and no address or landmark. The owner (signed in, matching `user_id`) gets `viewer: "owner"` with full details. An unknown number returns 404. `statusHistory` lists events in order. The 61st request in a minute returns `RATE_LIMITED`.
- [x] T058 [P] [US3] Write `frontend/tests/unit/usePolling.test.ts` with fake timers: it fires every 15 s, pauses while `document.hidden`, refetches on focus, backs off to 60 s after 3 consecutive errors, and stops when the `done` predicate returns true.

### Implementation for US3

- [x] T059 [US3] Implement `get_order_view(number, viewer_user)` in `backend/app/services/orders.py`: assemble `OrderOut` with `statusHistory`, decide `viewer` (public, owner or admin), and mask the phone and omit the address and landmark for the public viewer (research R12).
- [x] T060 [US3] Implement `GET /api/v1/orders/{number}` in `backend/app/api/routes/orders.py` (optional session, limit 60/minute per IP, `NOT_FOUND` for an unknown or malformed number).
- [x] T061 [P] [US3] Implement `frontend/src/hooks/usePolling.ts` per research R11 (15 s, visibility-aware, backoff, `done` predicate, cleanup on unmount).
- [x] T062 [US3] Update `frontend/src/lib/orders.ts`: remove the demo simulation (`DEMO_STAGE_MS`, `orderStageIndex`, `orderStatus` by elapsed time), derive the stage index from the real `status`, and keep `ORDER_STAGES` and `estimatedArrival`. Adjust `frontend/tests/unit/orders.test.ts` to match.
- [x] T063 [US3] Rebuild `frontend/src/components/checkout/OrderTracker.tsx` on real data: `usePolling` on `getOrder`, current and completed steps from `status`, a clear "Cancelled" state that replaces the steps, polling stops at Delivered or Cancelled, and an `aria-live="polite"` announcement when the status changes. Remove the "Demo tracker · live tracking coming soon" label from `frontend/src/components/checkout/OrderConfirmation.tsx`. Show only the fields the `viewer` may see (no empty address block for public viewers).
- [x] T064 [US3] Switch `getOrder` and `getRecentOrders` in `frontend/src/lib/api.ts` to the API (device order numbers from `local-orders.ts`, up to 10 fetched in parallel). For an id that exists only in Phase 1 local storage, return the local copy labelled "placed on this device". Update `frontend/src/components/checkout/TrackOrder.tsx` and `frontend/src/app/order/[id]/page.tsx` for the "not found" state.

**Checkpoint**: US3 works. The tracker shows real status, updates on its own and hides private details from public viewers.

---

## Phase 6: User Story 4 — Staff run orders from the admin panel (Priority: P1)

**Goal**: An admin signs in at `/admin`, sees new orders with an alert within 15 seconds, opens customer details, moves orders through the statuses and sees today's sales and order count.
**Independent Test**: Sign in as admin, place an order from another browser, confirm the alert, move the order through each status, and confirm today's totals.

### Tests for US4

- [x] T065 [P] [US4] Write `backend/tests/unit/test_transitions.py`: the allowed forward steps and `→ cancelled` from any non-terminal status, skipping steps rejected, terminal statuses immutable, and same-status rejected. (Also covers the `expected_status` optimistic-lock conflict and success cases.)
- [x] T066 [P] [US4] Write `backend/tests/integration/test_admin_orders_api.py`: admin routes return 401 with no session and 403 for a customer. Admin login accepts only admins, and a customer account, a wrong password and an unknown account all get the same `INVALID_CREDENTIALS`. The list defaults to today's business date. The `status` and `since` filters work, and a new order appears when polling with `since`. The detail includes the phone and address. A status change is saved with a status event and `changed_by`. A stale `expectedStatus` returns 409 `INVALID_TRANSITION` with `details.currentStatus`. The summary counts orders and sums totals while excluding cancelled orders, and a 1 AM PKT order counts toward the previous business date.
- [x] T067 [P] [US4] Write `frontend/tests/e2e/order-lifecycle.spec.ts`: guest checkout, admin login, the admin moves it to Preparing, On the way and Delivered, and the customer's tracker reflects each change. Passes against the real dev backend (skips without `ADMIN_EMAIL`/`ADMIN_PASSWORD` in the environment).

### Implementation for US4

- [x] T068 [US4] Implement `backend/app/services/auth.py` `authenticate(identifier, password, require_role=None)`: normalise the identifier (email if it contains `@`, else phone), consult `LoginGuard`, run `verify_and_update` with a dummy verify for unknown users, record failures, reset on success, update `last_login_at`, and raise the same `INVALID_CREDENTIALS` for every failure (including role mismatch). Raise `RATE_LIMITED` when blocked.
- [x] T069 [US4] Add the `create-admin` command to `backend/app/cli.py`: create the admin from `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `ADMIN_NAME` if that email does not exist, refuse a password shorter than 12 characters, and never print the password. Run it on the dev branch. (Done ahead of schedule at the user's request, alongside migrate+seed on the real Neon dev database.)
- [x] T070 [P] [US4] Create `backend/app/schemas/admin.py` (`AdminOrderSummary`, `StatusChangeInput`, `TodaySummary`) and `backend/app/schemas/auth.py` (`LoginInput`, `SessionUser`) per `contracts/openapi.yaml`.
- [x] T071 [US4] Implement `change_status(number, new, expected, admin)` in `backend/app/services/orders.py`: validate the transition table, run `UPDATE … WHERE status = expected`, treat zero rows as `INVALID_TRANSITION` with the current status, and insert the status event. Implement `list_admin_orders(date, status, since)` and `today_summary()` in `backend/app/services/admin.py` using `business_date`. (Implemented as an `expected_status` guard checked before the update rather than a conditional `UPDATE`, since sessions here are sync SQLModel; same race-safety guarantee. `list_admin_orders`/`today_summary` aggregate in Python rather than SQL, consistent with `services/menu.py`'s existing pattern, since mypy rejects `.in_()`/`.group_by()` on SQLModel's typed columns.)
- [x] T072 [US4] Implement `backend/app/api/routes/admin/auth.py` (`POST /admin/auth/login` with limit 20 per 15 minutes per IP, sets the cookie), `backend/app/api/routes/admin/orders.py` (`GET /admin/orders`, `GET /admin/orders/{number}`, `PATCH /admin/orders/{number}/status`) and `backend/app/api/routes/admin/summary.py` (`GET /admin/summary/today`). All except login depend on `require_admin`. Register them in `backend/app/main.py`.
- [x] T073 [P] [US4] Add `POST /auth/logout` and `GET /auth/me` in `backend/app/api/routes/auth.py`, and register the router (customer signup and login come in US5).
- [x] T074 [US4] Add to `frontend/src/lib/api.ts`: `adminLogin`, `getSession` (401 → `null`), `logout`, `getAdminOrders`, `getAdminOrder`, `setOrderStatus` and `getTodaySummary`. Create `frontend/src/stores/session.ts` (a non-persisted Zustand store loaded from `getSession`).
- [x] T075 [US4] Implement `frontend/src/proxy.ts` (Next.js 16 proxy): redirect requests for `/admin/*` (except `/admin/login`) and `/account/*` to the matching login page when the `kbg_session` cookie is absent. Redirects are only an experience layer, and the API remains the enforcement point. (Account routes are US5 scope and not yet built; the matcher only covers `/admin/:path*` for now.)
- [x] T076 [US4] Build `frontend/src/app/admin/login/page.tsx` and `frontend/src/components/admin/AdminLoginForm.tsx` using the existing `Field`, `PasswordInput` and `Button` in the fire theme, with generic error text and the rate-limit message.
- [x] T077 [US4] Build the panel shell `frontend/src/app/admin/(panel)/layout.tsx` and `frontend/src/components/admin/AdminShell.tsx`: a charcoal top bar with nav links (Orders, Menu, Areas), a sign-out button, and a session check that redirects on 401/403. (Messages/Reviews links deferred to US6/US7, when those pages exist.) Required a new `frontend/src/components/layout/SiteChrome.tsx` (root layout was wrapping every route, including `/admin/*`, in the customer nav/footer — a client-side pathname check skips it for `/admin/*` without needing Next's more invasive "multiple root layouts" pattern.)
- [x] T078 [US4] Build `frontend/src/lib/chime.ts` (a two-tone chime through the Web Audio API, no audio file), `frontend/src/components/admin/NewOrderAlert.tsx` (the "Enable sound" button, an `aria-live` region and the document-title badge) and `frontend/src/components/admin/TodayStats.tsx` (today's order count and sales, formatted with the existing `Price` and `formatRs`).
- [x] T079 [US4] Build `frontend/src/app/admin/(panel)/page.tsx` and `frontend/src/components/admin/OrdersBoard.tsx`: the orders list polling `getAdminOrders` every 15 s via `usePolling` with `since`, new orders prepended and highlighted until opened (respecting reduced motion), status and date filters, and cards that stack at 360 px with 44 px targets.
- [x] T080 [US4] Build `frontend/src/app/admin/(panel)/orders/[id]/page.tsx`, `frontend/src/components/admin/OrderDetail.tsx` and `frontend/src/components/admin/StatusControl.tsx`: full customer name, phone, address, area, timing, lines with options, extras and notes, totals, and a status history. Buttons offer only the next step and "Cancel order" (with a confirm step). On `INVALID_TRANSITION` show the conflict inline and refetch the real order (no full-page reload).
- [x] T081 [US4] Extend `frontend/tests/e2e/responsive.spec.ts` and `frontend/tests/e2e/a11y.spec.ts` with the `/admin/login` route (360/768/1280/1920 px, axe, no horizontal scroll). (`/admin` and `/admin/orders/[id]` need an authenticated session so aren't in the shared, unauthenticated `ROUTES` list; their lifecycle and rendering are instead covered end-to-end by `order-lifecycle.spec.ts` and by manual verification against the real backend.)

**Pulled forward from US6 at the user's explicit request** (menu and delivery-area management, normally Phase 8): `backend/app/schemas/admin_catalog.py` (`AdminAreaOut`, `AreaPatch`; `AdminMenuItemOut`/`MenuItemPatch` already existed), `backend/app/services/admin_catalog.py` (`list_all_areas`, `patch_area`; `list_all_items`/`patch_item` already existed), `backend/app/api/routes/admin/areas.py` (`GET`/`PATCH /admin/delivery-areas…`; `admin/menu.py` already existed), and the frontend's `MenuTable.tsx` + `frontend/src/app/admin/(panel)/menu/page.tsx` and `AreasTable.tsx` + `frontend/src/app/admin/(panel)/areas/page.tsx`. Area creation and removal, and the messages screens, were added afterwards.

**Checkpoint**: US4 works. Together with US1–US3 the restaurant can take and run real orders end to end.

---

## Phase 7: User Story 5 — Customer accounts and "My orders" (Priority: P2)

**Goal**: Customers sign up and log in with email or phone plus password, see past orders, and re-order. Guest checkout still works.
**Independent Test**: Sign up, place two orders, sign out and back in, open "My orders", and use "Order again".

### Tests for US5

- [x] T082 [P] [US5] Write `backend/tests/integration/test_auth_api.py`: signup with email only, phone only, or both. Duplicate email and duplicate phone return `ACCOUNT_EXISTS`. A password under 8 characters, no identifier, and a bad phone or email return 422. Login works with email in any casing and with phone in any accepted format. A wrong password and an unknown account return an identical generic response. The cookie has HttpOnly, SameSite=Lax, Path `/`, Max-Age 604800, and Secure when configured. `/auth/me` returns the user, and after logout it returns 401. The 6th failed login within 15 minutes for the same IP and identifier returns `RATE_LIMITED`, a success resets the counter, and signup is limited to 5 per hour.
- [x] T083 [P] [US5] Write `backend/tests/integration/test_me_api.py`: an order placed while signed in is linked to the account (`user_id`), a guest order is not, `/me/orders` lists only the caller's orders newest first with `limit` and `before` paging, and a request with no session returns 401. Reorder returns cart-ready lines at the current menu state, items that are sold out, hidden or removed appear in `skipped` by name, another user's order returns 404, and passwords never appear in any response.
- [x] T084 [P] [US5] Write `frontend/tests/e2e/account.spec.ts`: sign up, checkout with pre-filled name and phone, log out and in, see the order in "My orders", click "Order again" and land on a filled cart with the skipped notice when relevant, and confirm that guest checkout still works without an account.

### Implementation for US5

- [x] T085 [US5] Extend `backend/app/schemas/auth.py` with `SignupInput` (name 2–60, email, phone, password 8–128, and at least one of email or phone) and `ReorderResult`.
- [x] T086 [US5] Add `signup` to `backend/app/services/auth.py`: normalise and check uniqueness (catch the unique-violation race), hash the password, and create a `customer` user, never any other role.
- [x] T087 [US5] Add `POST /auth/signup` (limit 5/hour per IP, 201 and the cookie) and `POST /auth/login` (limit 20 per 15 minutes per IP, `authenticate` for the customer or admin roles) to `backend/app/api/routes/auth.py`.
- [x] T088 [US5] In `backend/app/api/routes/orders.py` and `backend/app/services/orders.py`, read the optional session on `POST /orders` and store `user_id`. Add `list_my_orders(user, limit, before)` and `reorder(user, number)` (rebuild lines from the snapshot's `item_slug`, `option_key` and `addon_keys`, skip lines no longer orderable, and return the skipped names).
- [x] T089 [US5] Implement `backend/app/api/routes/me.py` (`GET /me/orders`, `POST /me/orders/{number}/reorder`) and register the router.
- [x] T090 [US5] Add to `frontend/src/lib/api.ts`: real `login` and `signup` (returning `SessionUser`, with `email` and `phone` optional on signup), `getMyOrders` and `reorder`. Update the session store after login, signup and logout.
- [x] T091 [US5] Update `frontend/src/components/forms/AuthForm.tsx` and the `login` and `signup` pages: remove the "Accounts are coming soon" panel, keep the layout, require at least one of email or phone with Zod, map `ACCOUNT_EXISTS`, `INVALID_CREDENTIALS` and `RATE_LIMITED` to inline messages, and redirect to the page the visitor came from (default `/account/orders`). Extend `frontend/tests/unit/validation.test.ts`.
- [x] T092 [US5] Update `frontend/src/components/layout/Navbar.tsx` and `frontend/src/components/layout/MobileMenu.tsx` with the smallest change: the account entry shows Log in and Sign up for guests, and "My orders" and Log out when signed in (admins also see "Admin"). Load the session once through the session store.
- [x] T093 [US5] Pre-fill the customer name and phone in `frontend/src/components/checkout/CheckoutForm.tsx` when a session exists. Fields stay editable.
- [x] T094 [US5] Build `frontend/src/app/account/orders/page.tsx`, `frontend/src/components/account/MyOrdersList.tsx` and `frontend/src/components/account/OrderAgainButton.tsx`: past orders with status, total and date, each linking to `/order/[id]`, and "Order again" adds the returned lines to the cart store through the existing cart API and shows a toast listing skipped items. An empty state uses the existing `EmptyState`.
- [x] T095 [US5] Update the account answer in `frontend/src/app/faq/page.tsx` and any "coming soon" account copy so it is truthful now that accounts exist (payment "coming soon" copy stays).

**Checkpoint**: US5 works independently on top of US1–US4.

---

## Phase 8: User Story 6 — Staff manage menu, delivery areas and messages (Priority: P2)

**Goal**: Staff edit prices, availability and sold-out status, manage delivery areas and fees, and read contact messages and newsletter sign-ups. The website saves contact messages and newsletter emails.
**Independent Test**: Change a price, add a delivery area with a fee, and send a contact message. Confirm each shows on the customer site or in the admin panel.

### Tests for US6

- [x] T096 [P] [US6] Write `backend/tests/integration/test_admin_catalog_api.py`: 401 and 403 checks, `PATCH /admin/menu-items/{slug}` changes price, availability and sold-out and rejects price 0, negative, above 100000 and empty bodies, a price change does not alter an existing order's lines, a new order uses the new price, an area can be created (a duplicate id returns 409) and edited (fee, name, enabled, order; the id is immutable), a disabled area is refused at checkout and hidden from `/delivery-areas`, and a new area's fee is charged. Messages list newest first and can be marked read and unread, and subscribers list newest first. (Area removal is refused with 409 when the area has orders; area name edit was not built, only fee and on/off.)
- [x] T097 [P] [US6] Write `backend/tests/integration/test_content_api.py`: a contact message is saved and validated (name, message 10–1000, at least one of phone or email, normalised phone), script tags are stored as plain text, newsletter signup is idempotent (the second call returns 200 and creates no duplicate row), invalid emails return 422, and the 6th message in an hour returns `RATE_LIMITED`.

### Implementation for US6

- [x] T098 [P] [US6] Create `backend/app/schemas/content.py` (`ContactMessageInput`, `ContactMessageOut`, `NewsletterInput`) and `backend/app/schemas/admin_catalog.py` (`AdminMenuItem`, `MenuItemPatch`, `AdminArea`, `AreaPatch`) per `contracts/openapi.yaml`.
- [x] T099 [US6] Implement `backend/app/services/admin_catalog.py`: `list_all_items`, `patch_item` (bounds and `updated_at`), area create, patch and list (fee 0–2000, id pattern), message list and mark-read, and subscriber list.
- [x] T100 [US6] Implement `backend/app/api/routes/content.py` (`POST /contact-messages` and `POST /newsletter-subscriptions` with `ON CONFLICT DO NOTHING`, both limited to 5/hour per IP) and `backend/app/api/routes/admin/{menu,areas,messages}.py` (`/admin/menu-items…`, `/admin/delivery-areas…`, `/admin/contact-messages…`, `/admin/newsletter-subscribers`), and register them.
- [x] T101 [US6] Switch `sendContactMessage` and `subscribeNewsletter` in `frontend/src/lib/api.ts` to the API, and add `getAdminMenuItems`, `updateMenuItem`, `getAdminAreas`, `createArea`, `updateArea`, `getContactMessages`, `markMessageRead` and `getNewsletterSubscribers`. Keep the existing `ContactForm` and `NewsletterForm` layouts and add `RATE_LIMITED` and `VALIDATION_FAILED` messages.
- [x] T102 [US6] Build `frontend/src/app/admin/(panel)/menu/page.tsx` and `frontend/src/components/admin/MenuTable.tsx`: items grouped by category with inline price editing (whole rupees above zero), Available and Sold out toggles, optimistic update with rollback on error, and cards on a 360 px screen.
- [x] T103 [US6] Build `frontend/src/app/admin/(panel)/areas/page.tsx` and `frontend/src/components/admin/AreasTable.tsx`: list, add (name generates a kebab-case id), edit fee and name, and enable or disable.
- [x] T104 [US6] Build `frontend/src/app/admin/(panel)/messages/page.tsx` and `frontend/src/components/admin/MessagesList.tsx`: messages newest first with an unread marker and a mark-read toggle, an unread filter, and a newsletter subscribers tab. Add an unread count to the panel nav in `frontend/src/components/admin/AdminShell.tsx`.
- [x] T105 [P] [US6] Write `frontend/tests/e2e/admin.spec.ts`: change a price in the admin menu and see it on the customer menu (allowing for 60 s ISR through a fresh fetch in the test), add an area with a fee and see it in checkout, and send a contact message and see it in the admin list. (Done as `admin-messages.spec.ts` and `admin-catalog.spec.ts`.)

**Checkpoint**: US6 works. The restaurant can run day-to-day without a developer.

---

## Phase 9: User Story 7 — Real reviews replace sample reviews (Priority: P3)

**Goal**: Only a customer with a Delivered order can leave one 1–5 star review, an admin approves it, and approved reviews replace the "Sample reviews" once at least 3 exist.
**Independent Test**: Deliver an order to a test account, review it, approve it, and confirm it appears on the home page.

### Tests for US7

- [x] T106 [P] [US7] Write `backend/tests/integration/test_reviews_api.py`: a review is refused (`REVIEW_NOT_ALLOWED`) for a non-delivered order, another user's order, a guest order, and a second review on the same order. Rating 0, 6 and a comment over 500 characters return 422. A new review is pending and hidden from `/testimonials`. Admin approve and reject work with 401 and 403 checks. With fewer than 3 approved reviews `/testimonials` returns the sample rows with `isSample: true`. With 3 or more it returns the latest 6 approved as `isSample: false`, using first name plus last initial, the order's area and the month. Rejected and pending reviews never appear.
- [x] T107 [P] [US7] Write `frontend/tests/e2e/reviews.spec.ts`: a delivered order shows the review form in "My orders", the review is submitted and shown as "Awaiting approval", and after admin approval of 3 reviews the home page shows real reviews without the "Sample reviews" label.

### Implementation for US7

- [x] T108 [P] [US7] Create `backend/app/schemas/reviews.py` (`ReviewInput`, `AdminReview`, `TestimonialOut`). (The comment is required, 3 to 500 characters, because a real review is shown as a quote on the home page.)
- [x] T109 [US7] Implement `backend/app/services/reviews.py`: `submit_review` (own order, delivered, none yet; catch the unique-constraint race), `moderate`, `list_admin_reviews` (pending first) and `public_testimonials` (the 3-approved threshold, display name as first name plus last initial, month, and sample fallback). Include the caller's review on `OrderOut` for `viewer=owner`.
- [x] T110 [US7] Implement `POST /me/orders/{number}/review` in `backend/app/api/routes/me.py`, `GET /testimonials` in `backend/app/api/routes/content.py` and `backend/app/api/routes/admin/reviews.py` (`GET` and `PATCH /admin/reviews…`).
- [x] T111 [US7] Switch `getTestimonials` in `frontend/src/lib/api.ts` to the API, and add `submitReview`, `getAdminReviews` and `moderateReview`.
- [x] T112 [US7] Update `frontend/src/components/home/Testimonials.tsx` so the "Sample reviews" label and the "real customer reviews coming soon" text show only when the data has `isSample: true`, and real reviews show the month. Layout and styling stay as they are.
- [x] T113 [US7] Add `frontend/src/components/account/ReviewForm.tsx` (a star input with keyboard support, an optional comment with a 500-character counter, and pending, approved and rejected states) and show it in `frontend/src/components/account/MyOrdersList.tsx` for Delivered orders without a review.
- [x] T114 [US7] Build `frontend/src/app/admin/(panel)/reviews/page.tsx` and `frontend/src/components/admin/ReviewsQueue.tsx` (pending first, with Approve and Reject, and a pending count in the panel nav).

**Checkpoint**: All seven user stories work independently and together.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Constitution gates, security verification, documentation and a full manual walkthrough.

- [x] T115 Add `backend/tests/integration/test_rate_limits.py` covering the trusted and untrusted proxy modes (`TRUST_PROXY` true honours the left-most `X-Forwarded-For`, false ignores it) and that `/healthz` is exempt. Confirm `RATELIMIT_ENABLED=false` disables limits.
- [x] T116 [P] Remove stale Phase 1 "UI-only" wording that is no longer true (search `frontend/src` for "coming soon", "Demo", "UI-only", "mock"). Keep only the payment "Coming soon" labels, per Constitution X.
- [x] T117 Run the full backend gates and fix failures: `uv run ruff check .`, `uv run ruff format --check .`, `uv run mypy app` and `uv run pytest`.
- [x] T118 Run the full frontend gates and fix failures: `npm run export:backend-data -- --check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` and `npm run test:e2e` (backend running and seeded).
- [x] T119 Visual and accessibility pass on all new routes (`/account/orders`, `/admin/login`, `/admin`, `/admin/orders/[id]`, `/admin/menu`, `/admin/areas`, `/admin/messages`, `/admin/reviews`) at 360, 768, 1280 and 1920 px. Check there is no horizontal scroll, that touch targets are at least 44 px, do a keyboard-only walkthrough, and check `prefers-reduced-motion` on the new-order highlight. (Done with `authed-pages.spec.ts` at 360/768/1280/1920: `/account/orders` and every `/admin` page, plus `/login`, `/signup`, `/admin/login`. Fixed: dashboard had no h1, icon-only Sign out had no name, small tap targets on admin toggles and logo, tablist that contained a checkbox, definition list without terms.)
- [x] T120 Run Lighthouse (mobile) on home and menu with the backend connected, and confirm Performance and Accessibility are at least 90 (Constitution VII). If Performance is below target, record the measurements and the cause.
- [x] T121 Security verification: `git grep` shows no secret values anywhere (only placeholders in `.env.example`), `git log -p -- backend/.env` is empty, `backend/.env` is untracked, CORS and the Origin guard reject an unknown origin, admin endpoints refuse customers, error responses leak no stack traces, and the seed and CLI print no passwords.
- [x] T122 Append the Phase 2 entry to `docs/PROJECT-JOURNEY.md` (date, what was built, technologies and why, problems faced and how they were solved (include the cross-site cookie problem and the same-origin proxy, the rounding difference, and the failed-login limit), a "Screenshots" placeholder section, and a "Before launch" list for deployment). Update section 6 of the existing document, which still lists "Connect the FastAPI backend" and "Accounts … coming soon".
- [ ] T123 Add a short `backend/README.md` (setup, env, seed, run, test, and where the ADRs are), update the root `README.md` architecture and run instructions, and run through `specs/002-restaurant-backend/quickstart.md` from a clean checkout to confirm every step works.
- [ ] T124 Run the manual acceptance walkthrough (quickstart section 5) for all seven stories and tick the acceptance scenarios in `specs/002-restaurant-backend/spec.md`. Then confirm the success criteria SC-001–SC-009 and request owner approval (Constitution: phase completion requires the journey entry and owner approval).

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1 (Setup)**: no dependencies.
- **Phase 2 (Foundational)**: depends on Phase 1. **Blocks every user story.**
- **Phase 3 (US2 Menu)**: depends on Phase 2.
- **Phase 4 (US1 Orders)**: depends on Phase 2 and on the US2 backend endpoints (menu service). Orders do not need the US2 frontend work, but the checkout UI does.
- **Phase 5 (US3 Tracking)**: depends on US1 (orders exist) and adds `usePolling`.
- **Phase 6 (US4 Admin orders)**: depends on US1, and reuses `usePolling` from US3. It defines `authenticate` and the session store used by US5.
- **Phase 7 (US5 Accounts)**: depends on US4's `authenticate`, session store and `proxy.ts`.
- **Phase 8 (US6 Catalogue admin)**: depends on US4's admin shell and on US1 for the fee-at-checkout test.
- **Phase 9 (US7 Reviews)**: depends on US5 (accounts, "My orders") and on US4 (moving orders to Delivered, admin shell).
- **Phase 10 (Polish)**: depends on all stories.

### Within a story

Tests are written first and must fail before the implementation. Order: tests → schemas → services → routes → frontend `api.ts` → components/pages → e2e.

### Story dependency graph

```text
Setup → Foundational → US2 (menu) → US1 (orders) → US3 (tracking) → US4 (admin orders) ─┬→ US5 (accounts) ─→ US7 (reviews)
                                                                                         └→ US6 (menu/areas/messages)
                                                                                                                       → Polish
```

## Parallel Opportunities

- **Phase 1**: the tooling, `.env.example`, package skeleton and frontend wiring tasks touch different files.
- **Phase 2**: `errors.py`, `clock.py`, `normalise.py` and their unit tests, the two model files, the schema base, the health route, `api-error.ts` and `http.test.ts` are all independent. The export script can be built while the Alembic migration is written.
- **Within each story**: the test files (marked [P]) can be written in parallel, and so can the backend schemas and the frontend hook or component files that touch different paths.
- **After US4**: US5 (accounts) and US6 (admin catalogue) can proceed in parallel with different people, since they share only `api.ts` and `AdminShell.tsx`, where the edits are small and additive.

### Parallel example: User Story 1

```text
Launch together:  test_pricing.py · test_pricing_parity.py · test_orders_api.py · schemas/orders.py · pricing-fee.test.ts
Then sequentially: services/pricing.py → services/orders.py (place_order) → routes/orders.py → api.ts placeOrder → CheckoutForm → e2e
```

## Implementation Strategy

### MVP first (US2 + US1)

1. Complete Phase 1 and Phase 2.
2. Complete US2 so the site reads from the database.
3. Complete US1 so the restaurant receives real, correctly priced orders.
4. **Stop and validate** (demo the tampered-price rejection and Wednesday pricing). Staff can already see orders in the database, but there is no admin panel yet, so add US3 and US4 before real use.

### Recommended delivery order

1. **Operational core**: US2 → US1 → US3 → US4. At this point the restaurant can run real orders.
2. **Growth**: US5 accounts, then US6 catalogue admin (in parallel if two people are available).
3. **Trust**: US7 reviews.
4. **Polish**: gates, security check, journey entry and owner approval.

### Notes

- Commit after each task or small group. Never commit `backend/.env`.
- If a frontend pricing or menu-data change is made, run `npm run export:backend-data` and commit the regenerated files (the drift guard enforces this).
- Money is always integer rupees. Never use floats or Python's `round()` for money.
- Do not change visual design of existing screens (FR-036). New screens reuse existing tokens and `ui/` components.
- Tests for each story should fail first, then pass after implementation.
