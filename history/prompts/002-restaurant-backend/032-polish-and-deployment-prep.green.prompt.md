---
id: 032
title: Polish and deployment prep
stage: green
date: 2026-09-28
surface: agent
model: claude-sonnet-5
feature: 002-restaurant-backend
branch: 002-restaurant-backend
user: Shuaibali0786
command: /sp.implement
labels: ["polish", "security", "lighthouse", "docs", "deployment", "render", "vercel"]
links:
  spec: specs/002-restaurant-backend/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - backend/app/core/rate_limit.py
 - backend/app/core/security.py
 - backend/tests/integration/test_rate_limits.py
 - backend/README.md
 - frontend/src/stores/session.ts
 - frontend/src/app/globals.css
 - frontend/package.json
 - render.yaml
 - docs/DEPLOYMENT.md
 - docs/PROJECT-JOURNEY.md
 - README.md
 - specs/002-restaurant-backend/spec.md
 - specs/002-restaurant-backend/tasks.md
tests:
 - backend: ruff, ruff format --check, mypy strict clean; 187 tests pass against a scratch Neon database (77 without any database)
 - frontend: eslint, tsc, 86 unit tests, next build clean; export:backend-data --check up to date
 - e2e: full suite on 4 viewports, 216 passed at first, the one failure (contrast during the old opacity pulse) fixed and re-verified
 - Lighthouse mobile (5 runs): home 74, menu 72 performance (target 90 not met, same cause as Phase 1); accessibility 100, best practices 100, SEO 100, CLS 0
 - security: no secret value in tracked files or history, .env untracked, unknown origin 403, admin routes 401/403
---

## Prompt

Finish all remaining polish tasks (T115–T118, T120–T124): rate-limit tests, full backend + frontend test run, build and lint with zero errors, Lighthouse, security check, backend README, and update docs/PROJECT-JOURNEY.md and the main README.md (backend is now complete: real orders, tracking, accounts, admin panel, messages, reviews).
Then prepare for deployment (do NOT deploy yet):
- Backend: make it ready for Render (Python with uv, start command, health check path, Singapore region), list every environment variable it needs for production (names only), with COOKIE_SECURE=true and FRONTEND_URL set to the future Vercel URL.
- Frontend: make it ready for Vercel with root directory "frontend", list its environment variables (names only).
Commit everything and push to GitHub: merge the backend branch into main so main has the full project, without force-pushing.
Finally give me a short summary and the exact step-by-step deployment guide I should follow on Render and Vercel.

## Response snapshot

Rate-limit tests found a real bug: RATELIMIT_ENABLED=false did not switch limits off (slowapi kept the text "false", which counts as on); fixed. Ran the 108 integration tests for the first time against a temporary scratch database on the same Neon server (created, used and dropped): three failures, all mistakes in the tests. Lighthouse showed best practices 96 because every guest page logged a 401 from the session check; fixed with a readable kbg_auth hint cookie (back to 100). The e2e sweep caught the new-order highlight dimming text; it now animates only a glow. Wrote backend README, root README, journey section 8, acceptance status in the spec (owner approval and two unmeasured criteria left honestly open), render.yaml, docs/DEPLOYMENT.md, and a Node engines field for Vercel.

## Outcome

- Impact: Phase 2 is complete and deployment is prepared but not performed
- Open: owner approval (T124), mobile performance below 90, SC-003/SC-005 not timed
