# ADR-0001: Backend Stack & Data Access

- **Status:** Accepted
- **Date:** 2026-09-27
- **Feature:** 002-restaurant-backend
- **Context:** Phase 2 needs a service that owns menu, orders, accounts, reviews and messages for a single restaurant (tens to hundreds of orders per day). The constitution fixes FastAPI + SQLModel + Neon Postgres. The owner specified uv, Python 3.12+, Alembic, psycopg 3, Neon in Singapore via a pooled `DATABASE_URL` with `sslmode=require`, and later hosting on Render or Railway. How these pieces are wired has long-term effects on testing, migrations and hosting.

## Decision

- **Runtime & tooling**: Python 3.12+ managed with **uv** (`pyproject.toml` + `uv.lock`) in `/backend`. Local run: `uv run fastapi dev app/main.py --port 8000`. Gates: ruff, mypy (strict) and pytest.
- **Framework**: **FastAPI**, with generated OpenAPI docs at `/docs`. The API is versioned under `/api/v1`. JSON is camelCase to match the frontend types.
- **ORM & sessions**: **SQLModel with synchronous sessions** and `def` handlers in FastAPI's thread pool. Table models are kept separate from request and response schemas. The layers are routes → services → models.
- **Driver & connections**: **psycopg 3** (`postgresql+psycopg://`). The app uses Neon's **pooled** host with `pool_pre_ping`, `pool_recycle=300` and `prepare_threshold=None`, which is safe behind PgBouncer transaction mode.
- **Migrations**: **Alembic**, using `DATABASE_URL_DIRECT` (the unpooled host). Schema changes happen only through migrations. Enums are `TEXT` + `CHECK` for cheap evolution.
- **Time**: `zoneinfo("Asia/Karachi")`, with `tzdata` as a dependency (Windows has no system tz database).
- **Test database**: a dedicated Neon branch `test`, with transaction rollback per test and a guard that refuses to run if it equals `DATABASE_URL`.
- **Hosting target (later phase)**: Vercel for the frontend. A single always-on backend instance on Railway or Render in Singapore. Neon in `aws-ap-southeast-1`.

## Consequences

### Positive

- Simple, debuggable sync code. SQLModel examples and FastAPI dependencies apply directly.
- Real-Postgres tests (sequences, JSONB, unique races) catch what SQLite would hide.
- Singapore co-location keeps database round-trips short. The pooled URL tolerates Neon scale-to-zero.
- `/docs` doubles as a manual test console.

### Negative

- Sync handlers cap concurrency at the thread-pool size. This is fine at this scale, but would need revisiting for very high traffic.
- Two database URLs (pooled and direct) must both be configured.
- Integration tests need network access to Neon (or a local Postgres through the same variable).
- A single instance is required while rate limits use memory (see ADR-0002).

## Alternatives Considered

- **Async SQLAlchemy + asyncpg**: higher concurrency ceiling, but more complex sessions and tests, and no need at this scale.
- **Django + DRF**: batteries included (admin), but conflicts with the constitution's FastAPI + SQLModel stack.
- **SQLite for tests**: faster, but differs from Postgres in sequences, JSONB, CHECK constraints and concurrency.
- **Migrations through `SQLModel.metadata.create_all`**: no history and no safe evolution. Rejected in favour of Alembic.

## References

- Feature Spec: [specs/002-restaurant-backend/spec.md](../../specs/002-restaurant-backend/spec.md)
- Implementation Plan: [specs/002-restaurant-backend/plan.md](../../specs/002-restaurant-backend/plan.md)
- Research: R2, R3, R13, R14 in [research.md](../../specs/002-restaurant-backend/research.md)
- Related ADRs: ADR-0002, ADR-0003
- Evaluator Evidence: history/prompts/002-restaurant-backend/018-plan-restaurant-backend-phase-2.plan.prompt.md
