# Research: Restaurant Backend (Phase 2)

**Feature**: `002-restaurant-backend` | **Date**: 2026-09-27 | **Plan**: [plan.md](./plan.md)

The owner fixed the stack in the `/sp.plan` input. This document records **how** each choice is
applied, the problems found while checking it against the existing frontend and current library
docs (Context7: slowapi, pwdlib, Next.js 16), and how each problem is resolved. Every entry uses the
format: Decision, Rationale, Alternatives considered.

---

## R1. Browser ↔ API topology: same-origin proxy via Next.js rewrites

**Problem found**: The owner chose a `SameSite=Lax` httpOnly cookie, with the frontend on Vercel
(`*.vercel.app`) and the backend on Render/Railway (`*.onrender.com` / `*.up.railway.app`). These
are **different sites**. Browsers do not send `SameSite=Lax` cookies on cross-site `fetch`, and
Safari and Chrome increasingly block third-party cookies whatever the SameSite value. Login would
succeed, but the next request would arrive signed out.

**Decision**: The browser never calls the backend's origin directly. `next.config.ts` adds one
rewrite, `/api/:path*` → `${NEXT_PUBLIC_API_URL}/api/:path*`. Browser code in `lib/api.ts` calls the
relative path `/api/v1/...`, so the cookie is **first-party on the frontend's domain**. Server
Components (menu pages, ISR) call `${NEXT_PUBLIC_API_URL}/api/v1/...` directly, because they need
no cookie.

**Rationale**:
- Keeps the owner's cookie design (httpOnly + Secure + Lax) working in every browser, with no
  custom domain needed.
- `proxy.ts` can see the session cookie, so it can redirect signed-out visitors away from
  `/admin` and `/account` before rendering. The API still enforces authorization.
- CORS becomes a defence-in-depth layer rather than the main path. It stays restricted to
  `FRONTEND_URL` as specified (FR-032).
- Local development mirrors production: `localhost:3000` rewrites to `localhost:8000`.

**Consequences**: One extra hop (Vercel → backend) on browser calls. Both run in or near
Singapore, so the cost is small. Rate limiting must read the real client IP from
`X-Forwarded-For` (see R8).

**Alternatives considered**:
- *Cross-site cookie `SameSite=None; Secure`*: blocked by third-party-cookie protections
  (Safari ITP, Chrome tracking protection). Rejected.
- *Bearer token in `localStorage`*: readable by any injected script (XSS token theft), and
  contradicts the owner's httpOnly choice. Rejected.
- *Custom domains `www.` + `api.` on one registrable domain (same-site)*: works, but needs a
  purchased domain before launch. It remains a later option: the rewrite can be replaced by a
  direct call without changing the cookie design.

---

## R2. Data access: SQLModel (sync) + psycopg 3 + Neon pooled/direct URLs

**Decision**:
- SQLModel with **synchronous** sessions and `def` route handlers (FastAPI runs them in its
  thread pool).
- Engine URL `postgresql+psycopg://…?sslmode=require` using Neon's **pooled** host (`-pooler`)
  from `DATABASE_URL`. Engine settings: `pool_pre_ping=True`, `pool_recycle=300`, `pool_size=5`,
  `max_overflow=5`, and `connect_args={"prepare_threshold": None}` so psycopg never creates
  server-side prepared statements behind PgBouncer's transaction pooling.
- Alembic uses `DATABASE_URL_DIRECT` (Neon's unpooled host) when set. Migrations need
  session-level features such as advisory locks, DDL transactions and `SET` statements that
  PgBouncer transaction mode does not guarantee. It falls back to `DATABASE_URL`.
- Tables are defined once as SQLModel `table=True` classes. Request and response schemas are
  separate Pydantic/SQLModel classes (no table models leak into the API).

**Rationale**: Traffic is small (one restaurant). Sync code is simpler to write, test and debug,
and SQLModel's docs and examples are sync-first. `pool_pre_ping` and `pool_recycle` handle Neon
closing idle connections when it scales to zero.

**Alternatives considered**: *Async SQLAlchemy + asyncpg or psycopg async*: more complex testing
and session handling, with no throughput need at this scale. Rejected. *Plain SQLAlchemy Core*:
the owner chose SQLModel.

---

## R3. Pakistan time: `zoneinfo("Asia/Karachi")` + `tzdata`

**Decision**: `app/core/clock.py` holds `PKT = ZoneInfo("Asia/Karachi")`, an injectable
`now()` (overridable in tests), and helpers mirroring `frontend/src/lib/time.ts`: `pkt_parts`,
`is_open(now)` (hours ≥ 12 or < 3), `schedule_slots(now)` (30-minute slots, 45-minute lead,
last slot 2:30 AM) and `business_date(now)`. **`tzdata` is a runtime dependency**, because
Windows (the dev machine) has no system IANA database and `ZoneInfo` would raise there.

**Business day** (for "today's sales", FR-024): the service day runs 12 noon – 3 AM and crosses
midnight, so `business_date = (placed_at in PKT − 6 h).date()`. A 1 AM order counts toward the
previous evening's sales, matching how staff think of "tonight". Stored on each order and indexed.

**Scheduled-slot validation** (edge case): a scheduled order is accepted when its slot is in
`schedule_slots(now)` **or** was valid within the last 5 minutes (grace for a slot picked on a page
opened a few minutes earlier). A scheduled order placed while closed is accepted if the slot is
inside the upcoming service window, exactly as the frontend offers it.

**Alternatives considered**: *Fixed `UTC+5` arithmetic* (as the frontend does): correct today,
because PKT has no DST, but `zoneinfo` states the intent and is the owner's wording. The parity
tests (R5) prove both agree.

---

## R4. Order numbers and idempotency

**Decision**:
- Postgres sequence `order_number_seq START 10001`. The column `orders.number` is a
  `BIGINT UNIQUE` default `nextval(...)`, displayed as `KBG-{number}` (FR-009). Numbers are never
  reused, even when a transaction rolls back and leaves a gap, which is acceptable.
- `orders.id` is an internal UUID and is never exposed. The public identifier is the `KBG-`
  number, and the frontend's `Order.id` keeps meaning `"KBG-10234"`, so components do not change.
- **Idempotency** (FR-010): `POST /orders` requires an `Idempotency-Key` header (UUID v4, created
  once per checkout attempt in the browser and reused on retry), stored in a
  `orders.idempotency_key UNIQUE` column along with a SHA-256 of the canonical request body.
  - Same key + same body → returns the original order (`200`, not a duplicate).
  - Same key + different body → `409 IDEMPOTENCY_CONFLICT`.
  - An insert race on the unique key is caught, and the existing order is returned.

**Alternatives considered**: *Random 5-digit numbers* (the Phase 1 mock): collisions and retry
loops. Rejected. *Deduplicate by phone + cart within N seconds*: heuristic, and would wrongly block
genuine repeat orders. Rejected.

---

## R5. Pricing: one server module, proven equal to the frontend

**Decision**: `app/services/pricing.py` is the only place prices are computed on the server. It
mirrors `frontend/src/lib/pricing.ts` function by function: `unit_price`, `active_promo_for`,
`promo_discount_per_unit`, `resolve_cart`, `cart_totals`. It works on integer rupees only
(`int`, never `float`/`Decimal`).

**Problem found (rounding)**: JavaScript `Math.round` rounds halves **up**, but Python `round()`
rounds halves **to even** (`round(2.5) == 2`). Discounts are therefore computed in integers as
`(unit * percent + 50) // 100`, which equals `Math.round(unit * percent / 100)` for non-negative
values. Wings Wednesday (20%) cannot produce a half with integer prices, but the rule must stay
correct if staff change the percentage later.

**Parity proof** (owner requirement: "matches the frontend's pricing for every menu item"):
1. `frontend/scripts/export-backend-data.ts` (run with `tsx`, which resolves the `@/` path
   aliases) imports the real frontend modules and writes a golden file,
   `backend/tests/fixtures/pricing_golden.json`. For **every item × every option × {no extras,
   each single extra, all extras} × {Wednesday, Thursday}** it records `unitPrice` and
   `discountPerUnit`. It also records about 20 cart scenarios for `cartTotals`: below, at and
   above Rs 1,500; empty cart; mixed promo and non-promo lines.
2. `backend/tests/unit/test_pricing_parity.py` loads the golden file plus the seeded menu JSON and
   asserts equality for every case.
3. A drift guard (`npm run export:backend-data -- --check`) regenerates in memory and fails if the
   committed JSON differs. It runs in the test task list, so a frontend pricing change that is not
   mirrored in the backend breaks the build.

**Delivery fee**: the frontend has a flat Rs 150. The backend uses the chosen area's fee (seeded at
150 for all six areas), so the golden scenarios pass `fee=150`. The frontend's `cartTotals` gains an
optional `deliveryFee` argument (default 150), and checkout passes the selected area's fee. At
launch every figure is identical.

**Alternatives considered**: *Frontend asks the backend for a quote on every cart change*: adds
network latency to a UI that is currently instant, and changes component behaviour. Rejected for
display, though the server still re-prices at order time. *Shared WASM/JS pricing run inside
Python*: heavy and unusual. Rejected.

---

## R6. Seed data: exported once from the frontend, then the database owns it

**Decision**: The same `export-backend-data.ts` script writes `backend/app/seed/data/menu.json`
(categories with option groups and extras, 33 items including option overrides, tags, featured
placements, ratings and popularity), `promos.json`, `areas.json` (6 areas, fee 150) and
`sample_testimonials.json`. Python never parses TypeScript.

`uv run python -m app.cli seed` loads them as an **upsert by natural key** (slug/id):
- Missing rows are inserted.
- Existing rows are left untouched, so staff price, availability and sold-out edits survive
  re-runs (FR-002, repeatable).
- `--reset-menu` overwrites descriptive fields from the JSON, for development only.

`uv run python -m app.cli create-admin` creates the admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` if
no user with that email exists. It never prints the password, and refuses passwords shorter than
12 characters.

After the switch, `frontend/src/lib/data/*` stays in the repo **only** as the export source and
test fixture. Runtime components read through `lib/api.ts` → backend (Constitution IX). The one
exception is `site.ts` (address, hours text, nav, socials), which is not part of this spec and
stays static.

**Alternatives considered**: *Hand-written Python seed*: duplicates 33 items by hand, and drift is
likely. Rejected. *Seed through an Alembic data migration*: mixes schema and content, and cannot
be re-run safely. Rejected.

---

## R7. Authentication and session

**Decision**:
- **Hashing**: `pwdlib` `PasswordHash.recommended()` (Argon2id). On login, use
  `verify_and_update` and store an upgraded hash if returned. For unknown accounts, still run one
  dummy verify so response time does not reveal whether an account exists.
- **Token**: PyJWT, HS256, secret `JWT_SECRET` (at least 32 random bytes, from `.env`). Claims:
  `sub` (user UUID), `role` (`customer` or `admin`), `iat`, `exp` (7 days). Each request re-loads
  the user, so a disabled account or changed role takes effect at once.
- **Cookie**: `kbg_session`, `HttpOnly`, `Secure` (config `COOKIE_SECURE`, default `true`;
  browsers treat `http://localhost` as a secure context), `SameSite=Lax`, `Path=/`,
  `Max-Age=604800`, no `Domain` (host-only on the frontend origin through R1).
- **Logout** clears the cookie (FR-016: ends the session on that device). There is no server-side
  denylist at this scale; this is noted as a risk.
- **Roles**: one `users` table with a `role` column. `/api/v1/auth/login` is the customer login.
  `/api/v1/admin/auth/login` accepts only `role=admin` and answers any other account with the same
  generic `INVALID_CREDENTIALS`. Admin routes depend on `require_admin`, and customer routes on
  `require_customer_or_admin`. The admin panel at `/admin/login` uses the admin endpoint. The admin
  is created only by the CLI (FR-035).
- **CSRF**: `SameSite=Lax` already withholds the cookie from cross-site POST/PATCH. In addition,
  every state-changing endpoint requires `Content-Type: application/json` (an HTML form cannot send
  it without a CORS preflight), and a middleware rejects requests whose `Origin` header is present
  and is not `FRONTEND_URL`.
- **Identifier normalisation**: email is trimmed, lowercased and unique. Phone is normalised to
  `+923XXXXXXXXX` with the same rules as `frontend/src/lib/phone.ts`, and unique. Login accepts
  either form; anything containing `@` is treated as an email.

**Alternatives considered**: *Server-side session table*: supports revocation, but adds a database
read per request plus cleanup. The owner chose JWT. *Separate admin users table*: duplicate auth
code for one admin. A role column is enough.

---

## R8. Rate limiting and client IP

**Problem found**: slowapi's `limit()` counts **every** request. It has no option to count only
failed responses; its documented parameters are `limit_value`, `key_func`, `per_method`,
`methods`, `error_message`, `exempt_when`, `cost` and `override_defaults`. The spec needs
"5 **failed** logins per 15 minutes".

**Decision**:
- slowapi `Limiter` (memory storage, moving window), mounted with its middleware and a handler that
  returns the standard error body (`RATE_LIMITED`, `Retry-After` header). Per-IP limits:

  | Endpoint | Limit |
  |---|---|
  | `POST /auth/login`, `/admin/auth/login` | 20 / 15 minutes (all attempts) |
  | `POST /auth/signup` | 5 / hour |
  | `POST /orders` | 10 / hour |
  | `POST /contact-messages`, `/newsletter-subscriptions` | 5 / hour |

- **Failed-login lockout**: `app/services/login_guard.py` uses the `limits` library that slowapi
  already depends on. It uses the same memory storage and a `MovingWindowRateLimiter("5/15 minutes")`
  keyed by `ip + normalised identifier`. It calls `hit()` only after a failed verify, and `test()`
  before verifying. On the 6th attempt it returns `429 RATE_LIMITED` (SC-007).
- **Client IP**: behind the rewrite (R1), requests come from Vercel, with the client in
  `X-Forwarded-For`. The key function uses the **left-most** `X-Forwarded-For` address only when
  `TRUST_PROXY=true`, and `request.client.host` otherwise (local development). Uvicorn runs with
  `--proxy-headers` in production.
- **Storage** is in-memory, which is correct for a **single backend instance**. Scaling out needs
  `RATELIMIT_STORAGE_URI=redis://…`, a one-line change that is recorded as a risk.

**Alternatives considered**: *Failed-attempt counter in Postgres*: survives restarts, but adds
writes on every failure. Unnecessary for one instance. *A different limiter library*: the owner
chose slowapi.

---

## R9. Validation and the error envelope

**Decision**: Every request body is a Pydantic model with explicit `min_length`, `max_length`,
`pattern`, `ge` and `le` values taken from the spec: name 2–60, address 10–200, notes and landmark
≤ 200, line note ≤ 500, quantity 1–20, lines 1–50, review comment ≤ 500, contact message 10–1000,
password 8–128. `extra="forbid"` rejects unknown fields, including browser-sent prices.

JSON is **camelCase** on the wire (`alias_generator=to_camel`, `populate_by_name=True`), so
responses match `frontend/src/lib/types.ts` with no mapping.

A single error envelope comes from exception handlers for `AppError`, `RequestValidationError`,
`HTTPException`, `RateLimitExceeded` and unhandled `Exception` (which is logged with its traceback,
while the client receives only `INTERNAL`):

```json
{ "error": { "code": "VALIDATION_FAILED", "message": "Please check your delivery details.",
             "fields": { "customer.phone": "Enter a valid Pakistani mobile number." } } }
```

Codes (HTTP status): `VALIDATION_FAILED` 422 · `EMPTY_CART` 422 · `UNKNOWN_ITEM` 422 ·
`INVALID_OPTION` 422 · `ITEM_SOLD_OUT` 409 · `AREA_UNAVAILABLE` 422 · `RESTAURANT_CLOSED` 409 ·
`INVALID_SLOT` 422 · `IDEMPOTENCY_CONFLICT` 409 · `UNAUTHENTICATED` 401 · `INVALID_CREDENTIALS` 401 ·
`FORBIDDEN` 403 · `ACCOUNT_EXISTS` 409 · `NOT_FOUND` 404 · `INVALID_TRANSITION` 409 ·
`REVIEW_NOT_ALLOWED` 409 · `RATE_LIMITED` 429 · `INTERNAL` 500.

The frontend `ApiErrorCode` union is extended to match, and `ApiError` gains an optional `fields`
map for field-level messages.

Stored text is displayed with React's default escaping; the backend never returns HTML.

---

## R10. Menu freshness on a statically generated site

**Problem found**: Phase 1 pages are statically generated. Once the menu comes from the database,
a sold-out flag or price change would not appear until the next build.

**Decision**:
- Menu data fetched by Server Components uses
  `fetch(url, { next: { revalidate: 60, tags: ["menu"] } })`: incremental static regeneration with
  60-second freshness. The site keeps static-page performance (Constitution VII).
- Checkout always re-validates on the server (FR-005/008), so a stale page can never sell a
  sold-out item.
- `generateStaticParams` for `/menu/[slug]` catches fetch failures and returns `[]`, with
  `dynamicParams = true`, so a build without a reachable API still succeeds and pages render on
  first request.
- Browser-side data (cart and item dialogs) uses the same `getMenuItems()`, which goes through the
  proxy.
- A sold-out item shows a "Sold out" pill in place of "Add +", and the item dialog's add button is
  disabled with the text "Sold out today". The existing components gain one `soldOut` branch; there
  is no layout change.

**Alternatives considered**: *Fully dynamic rendering*: slower pages and a Lighthouse regression.
Rejected. *On-demand `revalidateTag` from the backend through a signed webhook*: more moving parts.
It is a follow-up if 60 seconds proves too slow.

---

## R11. Live updates: 15-second polling

**Decision**: `frontend/src/hooks/usePolling.ts` runs a fetch every 15 seconds. It pauses while
`document.hidden`, refetches on focus, backs off to 60 seconds after 3 consecutive errors, and stops
when a `done(result)` predicate returns true.
- **Tracker**: polls `GET /orders/{number}` and stops at `delivered` or `cancelled` (FR-012).
- **Admin orders**: polls `GET /admin/orders?since=<last seen ISO>`.
  - New orders are prepended and highlighted.
  - A short two-tone chime plays through the Web Audio API (no audio file, no third-party asset).
    It needs one "Enable sound" click, because of browser autoplay rules.
  - `document.title` shows `(n) New orders`.

**Alternatives considered**: *WebSockets or SSE*: instant, but needs sticky long-lived
connections through the Vercel rewrite (which does not suit streaming proxies), plus reconnection
logic. The spec only requires 15 seconds (see ADR-0004). Rejected for this phase.

---

## R12. Public tracking privacy

**Decision**: `GET /orders/{number}` returns the order with `customer.phone` masked
(`+92 3•• ••• ••67`) and `delivery.address` and `landmark` omitted. The exceptions are a caller who
is the order's owner (the session user matches `orders.user_id`) and an admin, who get full details
(FR-013). Response field `viewer: "public" | "owner" | "admin"` lets the UI hide empty sections.

Order numbers are sequential and guessable; this masking is the mitigation. Enumeration is also
slowed by a 60-per-minute per-IP limit on this endpoint.

---

## R13. Testing strategy

**Decision**:
- **Backend unit tests** (no database): pricing and parity, clock and slots, status transitions,
  phone and email normalisation, idempotency hashing, error envelope.
- **Backend integration tests**: `httpx` via FastAPI `TestClient` against `TEST_DATABASE_URL` (a
  dedicated **Neon branch `test`**, never the main branch).
  - A session fixture runs `alembic upgrade head` and seeds.
  - Each test runs inside a connection-level transaction with a nested SAVEPOINT that is rolled
    back.
  - `clock.now` is overridden to fix Wednesday or Thursday and open or closed times.
  - The rate limiter is reset between tests.
  - A guard aborts the test run if `TEST_DATABASE_URL` equals `DATABASE_URL`.
- **Frontend**: Vitest for `lib/http.ts` error mapping, `usePolling`, and `cartTotals` with an area
  fee. Existing Playwright E2E runs against a local seeded backend, plus one new E2E flow: guest
  checkout → admin moves the order to Preparing → the tracker shows Preparing.
- Tooling: `uv run pytest`, `uv run ruff check`, `uv run ruff format --check`, and `uv run mypy app`
  (strict), mirroring the frontend's strict gates (Constitution VIII).

**Alternatives considered**: *SQLite for tests*: differs from Postgres in sequences, `JSONB`,
`citext` and unique-constraint races. Rejected. *Local Docker Postgres*: fine, and allowed through
the same `TEST_DATABASE_URL`, but the default is a Neon branch because the owner already uses Neon.

---

## R14. Hosting target (later phase, recorded now)

**Decision**: frontend on **Vercel**; backend on **Railway or Render in Singapore**, as one
instance (required by R8's memory rate limits), with the start command
`uv run fastapi run app/main.py --port $PORT --proxy-headers`. Neon project in **Singapore**
(`aws-ap-southeast-1`) to keep database round-trips in the same region.

**Risks noted**:
- Render's free tier sleeps after inactivity, causing a cold start of about 50 seconds. A
  restaurant needs an always-on instance (Render Starter, or Railway).
- Neon's free tier scales to zero, causing a first-query delay of about 0.5–1 second, which
  `pool_pre_ping` absorbs.

Final host choice is made in the deployment phase.
