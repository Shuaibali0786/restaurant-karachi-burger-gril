---
id: 020
title: Implement setup and foundational phases
stage: green
date: 2026-09-27
surface: agent
model: claude-sonnet-5
feature: 002-restaurant-backend
branch: 002-restaurant-backend
user: Shuaibali0786
command: /sp.implement
labels: ["backend", "fastapi", "sqlmodel", "alembic", "seed", "foundational"]
links:
  spec: specs/002-restaurant-backend/spec.md
  ticket: null
  adr: history/adr/0001-backend-stack-and-data-access.md, history/adr/0002-auth-session-and-same-origin-proxy.md, history/adr/0003-server-authoritative-pricing-and-parity.md
  pr: null
files:
 - backend/pyproject.toml
 - backend/uv.lock
 - backend/.python-version
 - backend/.env.example
 - backend/app/core/config.py
 - backend/app/core/db.py
 - backend/app/core/errors.py
 - backend/app/core/security.py
 - backend/app/core/rate_limit.py
 - backend/app/core/clock.py
 - backend/app/core/normalise.py
 - backend/app/models/*.py
 - backend/app/schemas/base.py
 - backend/app/api/deps.py
 - backend/app/api/routes/health.py
 - backend/app/main.py
 - backend/app/services/seed.py
 - backend/app/cli.py
 - backend/alembic.ini
 - backend/alembic/env.py
 - backend/alembic/versions/0001_initial_schema.py
 - backend/tests/conftest.py
 - backend/tests/unit/test_clock.py
 - backend/tests/unit/test_normalise.py
 - backend/tests/unit/test_security.py
 - backend/tests/integration/test_app_shell.py
 - backend/tests/integration/test_seed.py
 - frontend/.env.example
 - frontend/next.config.ts
 - frontend/eslint.config.mjs (unchanged; already scoped correctly)
 - frontend/package.json
 - frontend/scripts/export-backend-data.ts
 - frontend/src/lib/api-error.ts
 - frontend/src/lib/http.ts
 - frontend/src/lib/menu-view.ts
 - frontend/src/lib/api.ts
 - frontend/src/lib/types.ts
 - frontend/src/lib/data/areas.ts
 - frontend/tests/unit/http.test.ts
 - backend/app/seed/data/{menu,promos,areas,sample_testimonials}.json
 - backend/tests/fixtures/pricing_golden.json
 - .gitignore
 - CLAUDE.md
 - specs/002-restaurant-backend/tasks.md
tests:
 - backend: uv run pytest -q -> 56 passed, 5 skipped (require TEST_DATABASE_URL)
 - backend: uv run ruff check . -> all checks passed
 - backend: uv run ruff format --check . -> 39 files formatted
 - backend: uv run mypy app -> no issues in 28 source files
 - frontend: npm run lint -> 0 errors, 0 warnings
 - frontend: npm run typecheck -> passes
 - frontend: npm test -> 75 passed (9 files)
 - frontend: npm run build -> succeeds, 33 item pages statically generated
 - frontend: npm run export:backend-data -- --check -> up to date
---

## Prompt

Only the Setup and Foundational phases (backend folder with uv, settings, .env.example, Neon database connection, Alembic, models and migrations, seed script, /health and /docs). Do not start any user story yet.
When you reach the point where the database is needed, STOP and tell me in simple steps exactly where to paste my Neon connection string (backend/.env) and which command to run to check the connection. Do not ask me to paste the secret into the chat.

## Response snapshot

Implemented tasks T001-T033 (all of Phase 1 Setup and Phase 2 Foundational) plus T034 (a seed integration test, written to validate the seed pipeline before stopping). Built the uv-managed FastAPI backend in `backend/`: settings, a Neon-friendly sync SQLModel engine, the shared error envelope, PKT clock rules matching the frontend, phone/email normalisation, Argon2 password hashing, JWT + cookie helpers, slowapi rate limiting with a custom failed-login lockout, the full 14-table schema as SQLModel models, a hand-written Alembic migration (verified to render valid SQL offline), the app shell with CORS/Origin/JSON guards and request logging, /healthz and /docs, and a seed service + CLI that upserts by natural key without overwriting staff edits. On the frontend: extended error codes, the same-origin http.ts transport, all type changes from data-model.md, the /api rewrite, and the export-backend-data.ts script that produced the real seed JSON and a 319-case + 20-cart pricing golden fixture from the actual frontend pricing code. All gates pass without a database (56 backend tests, 75 frontend tests, lint, typecheck, build). Stopped exactly at the point requiring a real Neon connection, per the user's explicit instruction, and gave setup steps without asking for the secret in chat.

## Outcome

- ✅ Impact: Setup + Foundational phases complete and verified; ready for `uv run alembic upgrade head` once Neon credentials are in backend/.env
- 🧪 Tests: 56 backend + 75 frontend passing; 5 backend tests skipped pending TEST_DATABASE_URL
- 📁 Files: ~40 new/changed files across backend/ (new) and frontend/ (wiring only)
- 🔁 Next prompts: paste the Neon connection strings into backend/.env, run `uv run python -m app.cli check-db`, then continue with US2 (menu)
- 🧠 Reflection: writing the migration by hand and verifying it with `alembic upgrade head --sql` caught schema mistakes without needing a live database

## Evaluation notes (flywheel)

- Failure modes observed: one large heredoc batch silently failed mid-script (bash `EOF` quoting collision) and had to be redone with the Write tool; a Vitest mock reused one Response object across two fetches, which fails because bodies can only be read once
- Graders run and results (PASS/FAIL): ruff, mypy, pytest, eslint, tsc, vitest, next build — all PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): prefer the Write tool over multi-file bash heredocs for anything beyond one file
