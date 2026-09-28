# Karachi Burger & Grill — Backend

FastAPI + SQLModel + Neon Postgres. It serves the menu, real Cash-on-Delivery orders with
server-side pricing, live order tracking, customer accounts, the admin panel's data, contact
messages, the newsletter and reviews.

The browser never calls this server directly. The Next.js site forwards `/api/*` to it, so the
login cookie stays first-party (see [ADR-0002](../history/adr/0002-auth-session-and-same-origin-proxy.md)).

## Set up

You need Python 3.12+ and [uv](https://docs.astral.sh/uv/), plus a [Neon](https://neon.tech)
Postgres project in **Singapore**.

```bash
cd backend
uv sync                      # installs everything from uv.lock
cp .env.example .env         # then fill in real values. .env is never committed
```

Every setting is explained in `.env.example`. The important ones: `DATABASE_URL` (pooled Neon
string), `DATABASE_URL_DIRECT` (direct string, used by migrations), `JWT_SECRET` (32+ random
characters), `ADMIN_EMAIL` / `ADMIN_PASSWORD` (12+ characters) and `FRONTEND_URL`.

## Create the tables, load the menu, create the admin

```bash
uv run alembic upgrade head               # tables and the order-number sequence
uv run python -m app.cli seed             # menu, promos, delivery areas, sample reviews (safe to re-run)
uv run python -m app.cli create-admin     # from ADMIN_EMAIL / ADMIN_PASSWORD (safe to re-run)
uv run python -m app.cli check-db         # confirms the database connection
```

The commands never print the password.

## Run it

```bash
uv run fastapi dev app/main.py --port 8000
```

- Interactive API docs: <http://localhost:8000/docs>
- Health check: <http://localhost:8000/healthz> (also `/api/v1/healthz`)

Then start the website from `../frontend` (`npm run dev`) and open <http://localhost:3000>.

## Test

```bash
uv run ruff check . && uv run ruff format --check .
uv run mypy app
uv run pytest
```

Unit tests always run (77). The other 110 integration tests need `TEST_DATABASE_URL`: a **separate** Neon
branch or database (all 187 pass). The run aborts if it points at the same database as `DATABASE_URL`.
Without it those tests are skipped, not failed.

## Move an order along without the admin panel

```bash
uv run python -m app.cli set-order-status 10001 preparing     # KBG-10001
```

## Where things are

| Path | What |
|---|---|
| `app/api/routes/` | HTTP routes (`admin/` holds the staff-only ones) |
| `app/services/` | The rules. Prices are calculated only in `services/pricing.py` |
| `app/models/`, `alembic/` | Tables and migrations |
| `app/core/` | Settings, errors, clock (Pakistan time), rate limits, security |
| `tests/` | Unit, pricing-parity and integration tests |

## Decisions (ADRs)

All in [`../history/adr/`](../history/adr/):

1. [Backend stack and data access](../history/adr/0001-backend-stack-and-data-access.md)
2. [Auth, session cookie and same-origin proxy](../history/adr/0002-auth-session-and-same-origin-proxy.md)
3. [Server-authoritative pricing](../history/adr/0003-server-authoritative-pricing-and-parity.md)
4. [Freshness: polling and caching](../history/adr/0004-freshness-polling-and-isr.md)
5. [Customer and admin sessions](../history/adr/0005-customer-and-admin-sessions.md)

## Deploying

See [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md) for the Render + Vercel steps and the full list
of production environment variables.
