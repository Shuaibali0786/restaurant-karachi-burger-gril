---
id: 021
title: Migrate seed and create admin on Neon
stage: green
date: 2026-09-27
surface: agent
model: claude-sonnet-5
feature: 002-restaurant-backend
branch: 002-restaurant-backend
user: Shuaibali0786
command: /sp.implement
labels: ["backend", "alembic", "neon", "seed", "admin"]
links:
  spec: specs/002-restaurant-backend/spec.md
  ticket: null
  adr: history/adr/0001-backend-stack-and-data-access.md
  pr: null
files:
 - backend/app/cli.py
 - specs/002-restaurant-backend/tasks.md
tests:
 - uv run alembic check -> "No new upgrade operations detected." (models match the migration)
 - uv run ruff check app/cli.py -> all checks passed
 - uv run mypy app/cli.py -> no issues found
 - manual: GET /health, /healthz, /docs, /openapi.json all 200 against the running dev server
---

## Prompt

check-db passed: "OK: connected" to Neon (pooler host). My .env is filled (DATABASE_URL, DATABASE_URL_DIRECT, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD). I skipped TEST_DATABASE_URL for now.
Continue /sp.implement for the Setup and Foundational phases only:
1. Run the migrations (alembic upgrade head) using the direct URL.
2. Seed the menu, categories, options, extras and the 6 delivery areas.
3. Create the first admin from .env (do not print the password).
4. Start the backend and confirm /health and /docs work.
Then STOP and tell me: the exact commands to run the backend myself, what I should see at http://localhost:8000/docs, and how many tables and menu items are now in the database. Do not start any user story yet.

## Response snapshot

Ran `alembic upgrade head` against the real Neon dev database (15 tables including alembic_version, confirmed by `alembic check` reporting no drift from the models). Ran `python -m app.cli seed`: 8 categories, 33 items, 20 options, 14 add-ons, 6 areas, 2 promos, 6 sample testimonials inserted. Added the `create-admin` CLI command (task T069, originally scheduled under US4, implemented now at the user's explicit request) and ran it: one admin account created from ADMIN_EMAIL/ADMIN_PASSWORD, no password printed anywhere. Started the backend with `uv run fastapi run app/main.py --port 8000` and confirmed /health, /healthz, /docs and /openapi.json all return 200 with request-id logging. Stopped the server afterward and reported the exact commands, expected /docs behaviour, and row counts back to the user, without starting any user-story work.

## Outcome

- ✅ Impact: the real Neon dev database now has the full schema, the seeded menu/areas, and one working admin account
- 🧪 Tests: alembic check clean; ruff/mypy clean on the new CLI code; manual health/docs checks all 200
- 📁 Files: backend/app/cli.py (create-admin command), tasks.md (T069 marked done with a note on why it ran early)
- 🔁 Next prompts: user runs the backend themselves to see /docs; next implementation step is US2 (menu) per tasks.md
- 🧠 Reflection: the very first curl to /health raced the server's startup and returned a connection error; a short retry confirmed it was just a timing issue, not a real failure

## Evaluation notes (flywheel)

- Failure modes observed: none in the implementation; one transient curl race against server startup
- Graders run and results (PASS/FAIL): alembic check PASS, ruff PASS, mypy PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
