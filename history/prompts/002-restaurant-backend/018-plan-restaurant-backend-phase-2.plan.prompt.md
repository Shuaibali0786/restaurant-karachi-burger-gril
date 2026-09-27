---
id: 018
title: Plan restaurant backend phase 2
stage: plan
date: 2026-09-27
surface: agent
model: claude-opus-5-5
feature: 002-restaurant-backend
branch: 002-restaurant-backend
user: Shuaibali0786
command: /sp.plan
labels: ["backend", "fastapi", "auth", "pricing", "adr", "architecture"]
links:
  spec: specs/002-restaurant-backend/spec.md
  ticket: null
  adr: history/adr/0001-backend-stack-and-data-access.md, history/adr/0002-auth-session-and-same-origin-proxy.md, history/adr/0003-server-authoritative-pricing-and-parity.md, history/adr/0004-freshness-polling-and-isr.md
  pr: null
files:
 - specs/002-restaurant-backend/plan.md
 - specs/002-restaurant-backend/research.md
 - specs/002-restaurant-backend/data-model.md
 - specs/002-restaurant-backend/quickstart.md
 - specs/002-restaurant-backend/contracts/openapi.yaml
 - specs/002-restaurant-backend/contracts/frontend-api.md
 - history/adr/0001-backend-stack-and-data-access.md
 - history/adr/0002-auth-session-and-same-origin-proxy.md
 - history/adr/0003-server-authoritative-pricing-and-parity.md
 - history/adr/0004-freshness-polling-and-isr.md
 - CLAUDE.md
tests:
 - none (planning stage); test strategy defined in research R13
---

## Prompt

/sp.plan/sp.plan
Backend in /backend, managed with uv (Python 3.12+):
- FastAPI + SQLModel + Alembic migrations, psycopg (v3) driver, Neon Postgres via DATABASE_URL (pooled connection, sslmode=require).
- Auth: passwords hashed with argon2 (pwdlib); JWT access token (7 days) stored in an httpOnly, Secure, SameSite=Lax cookie; separate "customer" and "admin" roles; first admin created from ADMIN_EMAIL / ADMIN_PASSWORD in backend/.env by a seed command.
- Pricing: a single pricing module that is the source of truth (options, extras, Wings Wednesday in Asia/Karachi time, area delivery fees, free delivery over Rs 1,500, opening hours 12 noon–3 AM); unit tests that check it matches the frontend's pricing for every menu item.
- Rate limiting with slowapi; CORS limited to FRONTEND_URL; pydantic validation on every request; consistent JSON error format.
- Seed script that loads the 33 menu items, categories, options, extras and 6 delivery areas from the current frontend data.
- Tests with pytest + httpx against a separate test database/branch.
- API docs at /docs.
Frontend changes (in /frontend):
- lib/api.ts calls the backend using NEXT_PUBLIC_API_URL, keeping the same function names so components don't change much.
- Real login/signup, "My orders" page, review form on delivered orders, and the /admin panel (orders, menu, areas, messages, reviews, today's sales) in the same fire theme.
- Tracker and admin lists poll every 15 seconds.
Local run: backend with "uv run fastapi dev" on port 8000, frontend on port 3000.
Deployment target for later: frontend on Vercel, backend on Render or Railway (Singapore region if available).
Record the important choices as ADRs.

## Response snapshot

Wrote plan.md (technical context, Constitution Check I–XI PASS pre and post design, backend and frontend structure, key flows, error paths, NFR budgets, top 3 risks, complexity tracking), research.md (R1–R14), data-model.md (tables, status state machine, frontend type changes), contracts/openapi.yaml (about 30 endpoints, error envelope), contracts/frontend-api.md, and quickstart.md. Four ADRs were created on the owner's explicit request. Three issues were found and resolved:
1. The SameSite=Lax cookie is not sent cross-site between Vercel and Render/Railway, so browser calls go same-origin through a Next.js /api rewrite.
2. Python round() is half-to-even while JavaScript Math.round is half-up, so integer half-up discount math is used.
3. slowapi has no count-only-failures option, so the failed-login lockout uses the limits library.

Also: tzdata is needed on Windows, the SSG menu gets 60 s ISR, and the parity proof uses golden fixtures exported from the real frontend modules. Library APIs were verified with Context7 (slowapi, pwdlib, Next.js 16 rewrites and proxy.ts).

## Outcome

- ✅ Impact: Phase 2 design complete and ready for /sp.tasks
- 🧪 Tests: none run; strategy covers unit, parity, integration (Neon test branch) and E2E
- 📁 Files: 6 spec artifacts, 4 ADRs, CLAUDE.md context update
- 🔁 Next prompts: /sp.tasks
- 🧠 Reflection: the owner's cookie design plus separate hosts would have broken login in production; caught at plan time

## Evaluation notes (flywheel)

- Failure modes observed: update-agent-context.ps1 did not parse the multi-line Language field; CLAUDE.md was completed by hand
- Graders run and results (PASS/FAIL): Constitution Check PASS (pre and post design)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): keep Technical Context "Language/Version" on one line so the context script parses it
