# Implementation Plan: Karachi Burger & Grill — Restaurant Backend (Phase 2)

**Branch**: `002-restaurant-backend` | **Date**: 2026-09-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-restaurant-backend/spec.md`

## Summary

Add a FastAPI + SQLModel service in `/backend` (uv, Python 3.12+, Neon Postgres in Singapore) that
owns the menu, orders, accounts, reviews and messages. Then point the existing Next.js frontend's
`lib/api.ts` at it, with no visual changes to existing screens. New screens follow the fire theme:
the `/admin` panel, "My orders", and the review form.

**Key technical decisions** (see [research.md](./research.md)):
- **Same-origin proxy**: the browser calls the API through a Next.js `/api/*` rewrite, so the
  owner's httpOnly `SameSite=Lax` JWT cookie works despite the separate Vercel and
  Render/Railway hosts (R1).
- **Server-authoritative pricing**: one Python pricing module, proven identical to
  `frontend/src/lib/pricing.ts` for every item/option/extra combination through golden fixtures
  exported from the frontend. It uses integer half-up rounding to match JavaScript's
  `Math.round` (R5).
- **Seed data**: exported from the existing TypeScript data, never retyped (R6).
- **Order numbers**: a Postgres sequence for `KBG-#####`, plus `Idempotency-Key` protection
  against double orders (R4).
- **Menu freshness**: ISR with 60-second revalidation keeps static-page performance while
  reflecting sold-out and price changes (R10).
- **Live updates**: 15-second polling for the tracker and the admin new-order alert (R11).
- **Rate limits**: slowapi per-IP limits, plus a failed-login lockout on the `limits` library
  (R8).

## Technical Context

**Language/Version**:
- Backend: Python 3.12+ (uv-managed, `.python-version` = 3.12).
- Frontend: TypeScript strict (unchanged).

**Primary Dependencies**:
- Backend runtime:
  - `fastapi[standard]` (includes the `fastapi` CLI and uvicorn), `sqlmodel`, `alembic`,
    `psycopg[binary]` (v3).
  - `pydantic-settings`, `pwdlib[argon2]`, `pyjwt`, `slowapi` (with `limits`), `tzdata`.
- Backend dev: `pytest`, `httpx`, `ruff`, `mypy`.
- Frontend adds only `tsx` (dev, for the export script). No new runtime dependencies.

**Storage**: Neon Postgres (Singapore).
- Pooled `DATABASE_URL` for the app, and `DATABASE_URL_DIRECT` for Alembic.
- Separate Neon branch `test` for pytest.
- The browser keeps only the cart, favourites and the list of device order numbers
  (localStorage, as in Phase 1).

**Testing**:
- Backend: pytest unit tests (pricing, parity, clock, transitions, normalisation) and integration
  tests (httpx `TestClient` against the Neon `test` branch, rolled back per test).
- Frontend: Vitest (http mapping, polling, fee-aware totals), and Playwright E2E against a local
  seeded backend.

**Target Platform**:
- Linux container on Railway or Render, Singapore region, single instance, chosen at deployment.
- Frontend on Vercel.
- Local development on Windows 11: backend with `uv run fastapi dev` on :8000, frontend on :3000.

**Project Type**: Web application (`backend/` + `frontend/`).

**Performance Goals**:
- 95% of order submissions answered in under 2 s (SC-003).
- Menu pages served from ISR cache.
- Tracker and admin see changes within 15 s (SC-004).

**Constraints**:
- No price trust from the client (FR-005).
- PKT business rules (FR-006/008).
- Secrets only in `backend/.env` (FR-031).
- CORS and Origin limited to `FRONTEND_URL` (FR-032).
- Rate limits (FR-034).
- Existing UI visually unchanged (FR-036, SC-001).

**Scale/Scope**:
- One restaurant: tens to low hundreds of orders per day, one or two concurrent admins.
- 33 items, 8 categories, 6 areas at launch.
- About 30 endpoints.
- Around 8 new frontend routes: `/account/orders`, `/admin/login`, `/admin`,
  `/admin/orders/[id]`, `/admin/menu`, `/admin/areas`, `/admin/messages`, `/admin/reviews`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | How this plan complies | Pre | Post |
|---|-----------|------------------------|-----|------|
| I | Real-Brand Quality | Menu content is exported verbatim from Phase 1 data (R6), so no retyping errors. Prices stay integer PKR, formatted by the existing `formatRs`. Admin screens use real copy with no placeholders. The admin chime is synthesized (no third-party asset) | ✅ | ✅ |
| II | Visual Identity | Admin and account screens reuse the existing `@theme` tokens and `ui/` primitives (Button, Field, Card, Badge), with a charcoal admin shell and ember accents. No new hex values | ✅ | ✅ |
| III | Ordering UX | Item dialog and cart flows are unchanged. Sold out disables "Add" with a clear label. Server refusals (sold out, closed, area) map to inline, specific messages, and the cart is preserved | ✅ | ✅ |
| IV | Motion With Purpose | New-order highlight and status step changes reuse existing motion presets under `MotionConfig reducedMotion="user"`. No new decorative motion | ✅ | ✅ |
| V | Mobile-First | Admin is mobile-first: order cards stack at 360 px and status buttons are 44 px targets, because staff often use a phone. Screenshot checks at 360, 768, 1280 and 1920 px added for the new routes | ✅ | ✅ |
| VI | Accessibility | New-order alert has an `aria-live="polite"` region as well as sound. Status controls are real buttons with labels. Form errors use `aria-describedby`, as in Phase 1. axe checks extend to the new routes | ✅ | ✅ |
| VII | Performance | Public pages stay statically generated with ISR (R10), so Lighthouse targets are unaffected. Polling runs only on the tracker and admin pages and pauses in hidden tabs | ✅ | ✅ |
| VIII | Code Quality | TS strict unchanged. Backend: ruff + mypy strict + pytest as gates. Pricing exists once per runtime and is proven equal by golden tests. The layers are routes → services → models, with no SQL in routes | ✅ | ✅ |
| IX | Backend-Ready → Backend-Connected | Components still import only `@/lib/api`. The ESLint `no-restricted-imports` rule on `@/lib/data/*` is kept (the export script is exempt). The Phase 1 "UI-only auth" clause was scoped to Phase 1; real auth is this phase's purpose | ✅ | ✅ |
| X | Honesty | "Sample reviews" label shows until ≥ 3 approved real reviews exist, and only reviews from delivered orders are allowed (FR-029/030). The "Demo tracker · live tracking coming soon" and "Accounts are coming soon" labels are removed because the features become real. The payment "Coming soon" labels stay | ✅ | ✅ |
| XI | Journey Log | The final task appends the Phase 2 entry to `docs/PROJECT-JOURNEY.md` (FR-037). Stack/secrets rule: `backend/.env` is ignored by the existing root `.env*` rule, and `backend/.env.example` is committed | ✅ | ✅ |

**Stack rule**: FastAPI + SQLModel + Neon, as the constitution's phase 2 requires. Phase order is
satisfied: the owner approved the frontend by requesting this phase.

**Gate result**: PASS. The one owner-sanctioned interpretation is recorded in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/002-restaurant-backend/
├── plan.md              # This file
├── research.md          # Phase 0: decisions R1–R14
├── data-model.md        # Phase 1: tables, state machine, frontend type changes
├── quickstart.md        # Phase 1: local setup, env, gates, walkthrough
├── contracts/
│   ├── openapi.yaml     # Phase 1: REST contract (/api/v1)
│   └── frontend-api.md  # Phase 1: lib/api.ts ↔ endpoint mapping
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/sp.tasks, not created here)

history/adr/             # ADR-0001 … ADR-0004 (see below)
```

### Source Code (repository root)

```text
backend/
├── pyproject.toml            # uv project; ruff, mypy, pytest config
├── uv.lock
├── .python-version           # 3.12
├── .env.example              # placeholders only (committed); .env is git-ignored
├── alembic.ini
├── alembic/
│   ├── env.py                # uses DATABASE_URL_DIRECT, SQLModel.metadata
│   └── versions/             # 0001_initial_schema.py, …
├── app/
│   ├── main.py               # create_app(): CORS, Origin guard, slowapi, error handlers, routers, /docs
│   ├── cli.py                # `python -m app.cli seed | create-admin`
│   ├── core/
│   │   ├── config.py         # Settings (pydantic-settings, reads .env)
│   │   ├── db.py             # engine (pooled, pre-ping, prepare_threshold=None), get_session
│   │   ├── clock.py          # PKT zoneinfo, now(), is_open, schedule_slots, business_date
│   │   ├── security.py       # pwdlib hasher, JWT encode/decode, cookie set/clear
│   │   ├── errors.py         # AppError + codes, envelope handlers
│   │   └── rate_limit.py     # Limiter, client-IP key func (TRUST_PROXY), login guard
│   ├── models/               # SQLModel tables: menu.py, delivery.py, users.py, orders.py, content.py
│   ├── schemas/              # Request/response models (camelCase aliases, extra="forbid")
│   ├── services/
│   │   ├── pricing.py        # the single pricing source of truth
│   │   ├── menu.py           # views with overrides, filtering/sorting, availability
│   │   ├── orders.py         # place (validate → price → idempotent insert), get with masking, transitions, reorder
│   │   ├── auth.py           # signup, login, normalisation (phone/email)
│   │   ├── reviews.py        # eligibility, moderation, testimonial projection
│   │   ├── admin.py          # today summary, lists
│   │   └── seed.py           # JSON → upsert
│   ├── api/
│   │   ├── deps.py           # SessionDep, CurrentUser, require_admin, optional_user
│   │   └── routes/           # menu.py, orders.py, auth.py, me.py, content.py, health.py, admin/{auth,orders,menu,areas,messages,reviews,summary}.py
│   └── seed/data/            # menu.json, promos.json, areas.json, sample_testimonials.json (generated)
└── tests/
    ├── conftest.py           # test DB guard, migrate+seed once, SAVEPOINT per test, clock + limiter fixtures
    ├── fixtures/pricing_golden.json   # generated from the frontend
    ├── unit/                 # test_pricing.py, test_pricing_parity.py, test_clock.py, test_transitions.py, test_normalise.py
    └── integration/          # test_menu_api.py, test_orders_api.py, test_tracking_api.py, test_auth_api.py,
                              # test_admin_api.py, test_content_api.py, test_reviews_api.py, test_rate_limits.py

frontend/                     # existing app; changes only
├── next.config.ts            # + rewrites: /api/:path* → ${NEXT_PUBLIC_API_URL}/api/:path*
├── .env.example              # + NEXT_PUBLIC_API_URL=http://localhost:8000
├── scripts/export-backend-data.ts   # new: seed JSON + pricing golden fixtures (tsx)
├── src/
│   ├── proxy.ts              # new: redirect /admin/* (not /admin/login) and /account/* without kbg_session
│   ├── lib/
│   │   ├── http.ts           # new: fetch wrapper, envelope → ApiError
│   │   ├── api.ts            # bodies switch to HTTP; new account/admin functions
│   │   ├── api-error.ts      # + codes, fields, details
│   │   ├── types.ts          # type changes per data-model.md
│   │   ├── pricing.ts        # cartTotals(lines, deliveryFee = 150)
│   │   └── local-orders.ts   # stores device order numbers (keeps reading Phase 1 local orders)
│   ├── hooks/usePolling.ts   # new: 15 s, visibility-aware, backoff, stop predicate
│   ├── stores/session.ts     # new: Zustand (not persisted) session from /auth/me
│   ├── components/
│   │   ├── checkout/OrderTracker.tsx      # real status + Cancelled state via usePolling
│   │   ├── forms/AuthForm.tsx             # real login/signup (same layout)
│   │   ├── home/Testimonials.tsx          # label only when isSample
│   │   ├── menu/…                         # soldOut branch on card + item dialog
│   │   ├── account/                       # MyOrdersList, OrderAgainButton, ReviewForm
│   │   └── admin/                         # AdminShell, OrdersBoard, NewOrderAlert, OrderDetail, StatusControl,
│   │                                      # TodayStats, MenuTable, AreasTable, MessagesList, ReviewsQueue
│   └── app/
│       ├── account/orders/page.tsx        # "My orders"
│       └── admin/
│           ├── login/page.tsx
│           └── (panel)/layout.tsx, page.tsx, orders/[id]/page.tsx, menu/, areas/, messages/, reviews/
└── tests/
    ├── unit/                 # + http.test.ts, usePolling.test.ts, pricing-fee.test.ts
    └── e2e/                  # + order-lifecycle.spec.ts, admin.spec.ts, account.spec.ts
```

**Structure Decision**: Web application layout, with the new `backend/` beside the existing
`frontend/`. The backend follows the routes → services → models layering, so business rules
(pricing, transitions, eligibility) are testable without HTTP. The frontend keeps its Phase 1
folder conventions and gains `components/admin` and `components/account`.

## Key Flows

**Place order** (`POST /orders`):
1. Check the `Idempotency-Key`: an existing key returns the original order, or `409` if the body
   differs.
2. Validate the schema.
3. Normalise the phone number.
4. Load enabled areas and orderable menu views.
5. Resolve lines. Refuse with `UNKNOWN_ITEM`, `INVALID_OPTION` or `ITEM_SOLD_OUT` (listing the
   slugs).
6. Check timing with `clock`: `RESTAURANT_CLOSED` or `INVALID_SLOT`.
7. `pricing.cart_totals(lines, area.fee)`.
8. Insert the order, its lines and the initial status event in **one transaction**.
9. Return `201 Order`.

**Change status** (`PATCH /admin/orders/{n}/status`):
1. Check the transition table.
2. `UPDATE … WHERE status = expected`. Zero rows → `409 INVALID_TRANSITION` with the current
   status.
3. Insert a status event.
4. Return the order.

**Session**: login verifies with Argon2 → issues a JWT (7 days) → sets `kbg_session` (httpOnly,
Secure, Lax, host-only) through the same-origin rewrite. `CurrentUser` decodes the token and
re-loads the user on each request.

## Error Paths (summary)

| Situation | Response | Frontend behaviour |
|---|---|---|
| Sold-out, hidden or unknown item in cart | 409 `ITEM_SOLD_OUT` / 422 `UNKNOWN_ITEM` + `details.items` | Checkout banner names the items; the cart keeps them marked for removal |
| Closed (ASAP) | 409 `RESTAURANT_CLOSED` + `opensAt` | "We open at 12 noon", with the schedule option highlighted |
| Stale slot | 422 `INVALID_SLOT` | Re-pick the slot (list refreshed) |
| Disabled area | 422 `AREA_UNAVAILABLE` | Area field error; list refreshed |
| Double submit | 200 replay | Same confirmation |
| Rate limited | 429 `RATE_LIMITED` + `Retry-After` | "Please wait a few minutes and try again" |
| API unreachable | client `NETWORK` / 5xx `INTERNAL` | Friendly retry; cart kept; menu shows a retry state |
| Status race | 409 `INVALID_TRANSITION` + `currentStatus` | Toast and board refresh |
| Not admin | 401 / 403 | Redirect to `/admin/login` |

## Non-Functional Budgets

| Area | Budget / Rule |
|---|---|
| Latency | Order POST p95 < 2 s end-to-end from Karachi (Singapore hosting, about 70–90 ms RTT); menu from ISR cache |
| Reliability | `/healthz` pings the database. Neon cold start is absorbed by `pool_pre_ping`. If the API is down, public pages still serve cached ISR HTML |
| Security | Argon2id, 7-day JWT in an httpOnly cookie, CORS + Origin guard, JSON-only mutations, `extra="forbid"`, rate limits, masked public tracking, secrets only in `.env`, `/docs` served (owner requirement; exposes only the contract, no data) |
| Observability | Structured JSON logs (method, path, status, duration, request id) through middleware; unhandled exceptions logged with traceback; no passwords, tokens or full phone numbers in logs |
| Cost | Neon free/launch tier plus one small always-on instance; polling at 15 s has negligible load at this scale |

## Risks (top 3) and Mitigations

1. **Pricing drift between frontend and backend**: customers see one total and are charged
   another. *Mitigation*: golden parity fixtures plus the `--check` drift guard in the gates. The
   confirmation page always shows server totals. *Blast radius*: one order's total; the server
   value wins.
2. **Client IP behind two proxies (Vercel → host)**: if it is wrong, rate limits either block
   everyone or no one. *Mitigation*: `TRUST_PROXY` flag, left-most `X-Forwarded-For` only when
   trusted, and integration tests for both modes. Verify on the first deployment. *Kill switch*:
   `RATELIMIT_ENABLED=false`.
3. **In-memory rate limits and single instance**: limits reset on restart and cannot scale out.
   *Mitigation*: documented single-instance constraint; `RATELIMIT_STORAGE_URI` swaps to Redis
   with one line.

## Architectural Decisions (ADRs)

The owner asked for the important choices to be recorded as ADRs:

- [ADR-0001](../../history/adr/0001-backend-stack-and-data-access.md): Backend stack & data access (FastAPI + sync SQLModel + Alembic + psycopg 3 + Neon pooled/direct, uv, hosting target)
- [ADR-0002](../../history/adr/0002-auth-session-and-same-origin-proxy.md): Authentication, session cookie & same-origin API proxy
- [ADR-0003](../../history/adr/0003-server-authoritative-pricing-and-parity.md): Server-authoritative pricing, parity fixtures & seed export
- [ADR-0004](../../history/adr/0004-freshness-polling-and-isr.md): Data freshness: 15 s polling + 60 s ISR (no WebSockets)

## Complexity Tracking

| Deviation / interpretation | Why needed | Simpler alternative rejected because |
|---|---|---|
| Browser calls use relative `/api/v1` through a Next.js rewrite. `NEXT_PUBLIC_API_URL` is used by the rewrite and by server-side fetches, not called directly from the browser | The owner's `SameSite=Lax` httpOnly cookie would not be sent cross-site between Vercel and Render/Railway | Direct browser calls to `NEXT_PUBLIC_API_URL` break login in production; `SameSite=None` is blocked by third-party-cookie protections |
| `frontend/src/lib/data/*` kept after the switch | Single source for the seed export and pricing golden fixtures | Deleting it forces hand-maintained Python copies and loses the parity proof |
