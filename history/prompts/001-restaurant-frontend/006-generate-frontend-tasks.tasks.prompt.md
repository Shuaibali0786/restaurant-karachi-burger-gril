---
id: 006
title: Generate phased frontend tasks
stage: tasks
date: 2026-09-26
surface: agent
model: claude-opus-5-5
feature: 001-restaurant-frontend
branch: 001-restaurant-frontend
user: Shuaibali0786
command: /sp.tasks
labels: ["tasks", "frontend", "phases", "checkpoints"]
links:
  spec: specs/001-restaurant-frontend/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/001-restaurant-frontend/tasks.md
tests:
 - none
---

## Prompt

/sp.tasks
Break the frontend work into small phases that I can test in the browser after each one:
Phase 1: Next.js setup in /frontend, copy images to public/images, design tokens, fonts, logo, AnnouncementBar, Navbar (desktop + mobile menu), Footer.
Phase 2: Home page — Hero (with ember particles and floating badges), Features strip, Categories, Most Loved Items with product cards.
Phase 3: Home page — Promo banners with countdown, Chef's specials, About teaser, Sample testimonials, Final CTA.
Phase 4: Menu page (filter, search, sort) + Item detail modal + /menu/[slug] page.
Phase 5: Cart drawer + /cart page + pricing rules (options, extras, Wings Wednesday, delivery fee).
Phase 6: Checkout + order confirmation + mock order tracker.
Phase 7: Favourites, Login, Signup, About, Contact, 404 pages.
Phase 8: Animation, responsive (360/768/1280/1920) and accessibility polish, SEO, then npm run build and npm run lint with zero errors, and update docs/PROJECT-JOURNEY.md.
Each phase must end with the exact command to run and what I should see at http://localhost:3000.

## Response snapshot

Generated tasks.md with 102 tasks in the owner's 8 phases, each task tagged with its spec user story (US1 9, US2 20, US3 27, US4 4, US5 1, US6 5, US7 2; Phase 1 24 and Phase 8 10 unlabelled), 50 parallelisable. Every phase ends with exact PowerShell commands and a concrete description of what appears at http://localhost:3000. Adjustments to fit dependencies: data layer at the start of Phase 2 (cards need it); cart store add() in Phase 4 so the item modal can add; unitPrice in Phase 4, full cart pricing in Phase 5; time.ts in Phase 3 for the countdown. Unit tests (Vitest) for time, pricing, format, cart store, validation; Playwright + Lighthouse in Phase 8.

## Outcome

- ✅ Impact: Executable, browser-checkpointed task list ready for /sp.implement.
- 🧪 Tests: planned — Vitest unit tests (T044, T063, T064, T075), Playwright E2E (T098)
- 📁 Files: specs/001-restaurant-frontend/tasks.md
- 🔁 Next prompts: /sp.analyze (optional), /sp.implement phase 1
- 🧠 Reflection: Owner's page-oriented phases differ from story order; labels keep story traceability.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): task format check 102/102 PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
