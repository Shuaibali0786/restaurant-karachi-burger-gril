---
id: 017
title: Specify restaurant backend phase 2
stage: spec
date: 2026-09-27
surface: agent
model: claude-opus-5-5
feature: 002-restaurant-backend
branch: 002-restaurant-backend
user: Shuaibali0786
command: /sp.specify
labels: ["backend", "orders", "admin", "accounts", "reviews", "security"]
links:
  spec: specs/002-restaurant-backend/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/002-restaurant-backend/spec.md
 - specs/002-restaurant-backend/checklists/requirements.md
 - history/prompts/002-restaurant-backend/017-specify-restaurant-backend-phase-2.spec.prompt.md
tests:
 - none (specification stage)
---

## Prompt

/sp.specify
Phase 2: BACKEND for Karachi Burger & Grill, connected to the existing frontend (keep all frontend UI and design as is).
Stack: Python FastAPI + SQLModel + Neon Postgres (region Singapore), managed with uv, in a /backend folder. The frontend's lib/api.ts switches from mock data to this API.

Features:
1. Menu from the database: categories, 33 items, options, extras, tags, images — seeded from the current frontend data. Admin can mark an item "sold out".
2. Real orders: checkout sends the order to the API; the server recalculates all prices (never trusts the browser), applies Wings Wednesday (Pakistan time), delivery fee rules, opening hours and delivery areas; saves the order with a number like KBG-10234 and status.
3. Order tracking: /order/[id] shows the real status from the database (Confirmed → Preparing → On the way → Delivered, plus Cancelled), refreshing automatically.
4. Customer accounts: signup/login with email or phone + password (hashed), JWT; "My orders" page with past orders and re-order. Guest checkout still allowed.
5. Admin panel at /admin (login as admin): live orders list with new-order alert, change status, view customer details; manage menu (price, availability, sold out); manage delivery areas and fees; view contact messages; see today's sales total and order count.
6. Contact form messages and newsletter signups are saved to the database.
7. Real reviews: only customers with a delivered order can leave a 1–5 star review; admin approves; approved reviews replace the "Sample reviews" on the home page.
Security: secrets only in backend/.env (never committed), .env.example with placeholders, CORS limited to the frontend URL, input validation, rate limiting on login and order endpoints.
Keep updating docs/PROJECT-JOURNEY.md.

## Response snapshot

Created branch `002-restaurant-backend` and wrote spec.md with 7 prioritized user stories: real orders (P1), menu from central records (P1), live tracking (P1), admin order operations (P1), accounts and My orders (P2), admin menu/areas/messages (P2), real reviews (P3). It has 37 functional requirements, 11 key entities, 9 measurable success criteria, edge cases, assumptions, out-of-scope items and dependencies. Grounded in Phase 1 rules found in frontend/src/lib (pricing.ts: Rs 150 fee, free at Rs 1,500, 20% Wings Wednesday rounded per unit; time.ts: 12 noon – 3 AM PKT, 45-min schedule lead). No clarification markers; defaults are recorded in Assumptions. The quality checklist passes on iteration 1.

## Outcome

- ✅ Impact: Phase 2 spec ready for /sp.clarify or /sp.plan
- 🧪 Tests: none (spec stage); acceptance scenarios defined per story
- 📁 Files: spec.md, checklists/requirements.md, this PHR
- 🔁 Next prompts: /sp.clarify (optional, to review defaults) then /sp.plan
- 🧠 Reflection: Public tracking with guessable sequential numbers led to a privacy requirement (FR-013)

## Evaluation notes (flywheel)

- Failure modes observed: create-new-feature.ps1 created the branch and spec, but the PowerShell wrapper then reported a positional-parameter error; the script was not re-run
- Graders run and results (PASS/FAIL): spec quality checklist PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
