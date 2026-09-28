---
id: 030
title: Implement user story 7 reviews
stage: green
date: 2026-09-28
surface: agent
model: claude-sonnet-5
feature: 002-restaurant-backend
branch: 002-restaurant-backend
user: Shuaibali0786
command: /sp.implement
labels: ["backend", "frontend", "reviews", "moderation", "testimonials"]
links: {spec: specs/002-restaurant-backend/spec.md, ticket: null, adr: null, pr: null}
files:
 - backend/app/schemas/reviews.py
 - backend/app/services/reviews.py
 - backend/app/services/orders.py
 - backend/app/api/routes/me.py
 - backend/app/api/routes/content.py
 - backend/app/api/routes/admin/reviews.py
 - backend/app/main.py
 - backend/tests/integration/test_reviews_api.py
 - frontend/src/lib/api.ts
 - frontend/src/lib/types.ts
 - frontend/src/components/account/ReviewForm.tsx
 - frontend/src/components/account/MyOrdersList.tsx
 - frontend/src/components/admin/ReviewsQueue.tsx
 - frontend/src/components/admin/AdminShell.tsx
 - frontend/src/components/home/Testimonials.tsx
 - frontend/src/app/admin/(panel)/reviews/page.tsx
 - frontend/tests/e2e/reviews.spec.ts
tests:
 - backend ruff/mypy clean; pytest 71 passed, 108 skipped (integration needs TEST_DATABASE_URL)
 - e2e reviews.spec.ts passed (3 customers sign up and order, admin delivers, each reviews, admin approves, API and home page switch from samples to real reviews, then the run rejects its own reviews to restore samples)
---

## Prompt

2. /sp.implement User Story 7 (real reviews): only customers with a delivered order can leave a 1-5 star review with a short comment from My orders; admin approves or rejects in /admin (Reviews tab); approved reviews appear on the home page, and sample reviews disappear once at least 3 real ones are approved.

## Response snapshot

POST /me/orders/{n}/review (own Delivered order, once, comment required 3-500 chars, starts pending), GET /testimonials (samples until 3 approved, then latest 6 as first name + last initial, area, month), admin GET/PATCH /admin/reviews (pending first). Owner's OrderOut now carries their review state. UI: star form with keyboard support in My orders, Reviews tab with pending count, home Testimonials shows month and drops the sample label only for real reviews. Home page is cached up to a minute, so a new approval can take that long to appear there.
