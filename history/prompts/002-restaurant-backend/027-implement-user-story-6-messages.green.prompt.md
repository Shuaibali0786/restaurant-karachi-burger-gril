---
id: 027
title: Implement user story 6 messages
stage: green
date: 2026-09-28
surface: agent
model: claude-sonnet-5
feature: 002-restaurant-backend
branch: 002-restaurant-backend
user: Shuaibali0786
command: /sp.implement
labels: ["backend", "frontend", "contact", "newsletter", "admin"]
links:
  spec: specs/002-restaurant-backend/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - backend/app/schemas/content.py
 - backend/app/services/content.py
 - backend/app/api/routes/content.py
 - backend/app/api/routes/admin/messages.py
 - backend/app/main.py
 - backend/tests/integration/test_content_api.py
 - frontend/src/lib/api.ts
 - frontend/src/lib/types.ts
 - frontend/src/components/forms/ContactForm.tsx
 - frontend/src/components/forms/NewsletterForm.tsx
 - frontend/src/components/admin/AdminShell.tsx
 - frontend/src/components/admin/MessagesList.tsx
 - frontend/src/app/admin/(panel)/messages/page.tsx
 - frontend/tests/e2e/admin-messages.spec.ts
 - specs/002-restaurant-backend/tasks.md
tests:
 - backend: ruff, mypy clean; pytest 71 passed, 91 skipped (integration needs TEST_DATABASE_URL)
 - frontend: tsc, eslint clean; vitest 86 passed; next build ok
 - e2e (real backend): admin-messages.spec.ts passed (contact + newsletter -> admin list, mark read/unread, sign-ups tab); a11y, responsive, order-flow, order-lifecycle re-run clean
 - manual curl on real dev DB: contact 201, bad contact 422, newsletter twice = one row, admin list, mark read, unread filter, subscriber list
---

## Prompt

(same message as PHR 026: US5 then US6, commit after each; US6 = contact messages and newsletter signups saved to the database, shown in /admin/messages with mark-as-read)

## Response snapshot

Backend: POST /contact-messages and /newsletter-subscriptions (5/hour/IP each; phone/email normalised; newsletter insert is ON CONFLICT DO NOTHING so repeats are a success with one row), admin GET/PATCH /admin/contact-messages (newest first, unread filter, read/unread) and GET /admin/newsletter-subscribers. Frontend: forms now really send and show errors; /admin/messages with tabs, New marker, mark read/unread, unread-only filter, and an unread count badge on the nav tab. Pulled-forward menu/area screens (T102/T103) marked done; area creation, admin menu/area tests and the price/new-area e2e remain open in tasks.md.

## Outcome

- Impact: contact messages and newsletter emails are stored and readable by staff
- Reflection: bash heredocs with apostrophes and a /tmp write refusal cost two retries; use the scratchpad dir for helper scripts
