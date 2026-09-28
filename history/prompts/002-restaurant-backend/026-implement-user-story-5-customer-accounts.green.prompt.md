---
id: 026
title: Implement user story 5 customer accounts
stage: green
date: 2026-09-28
surface: agent
model: claude-sonnet-5
feature: 002-restaurant-backend
branch: 002-restaurant-backend
user: Shuaibali0786
command: /sp.implement
labels: ["backend", "frontend", "accounts", "auth", "reorder", "prefill"]
links:
  spec: specs/002-restaurant-backend/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - backend/app/schemas/auth.py
 - backend/app/services/auth.py
 - backend/app/services/orders.py
 - backend/app/api/routes/auth.py
 - backend/app/api/routes/me.py
 - backend/app/main.py
 - backend/tests/integration/test_auth_api.py
 - backend/tests/integration/test_me_api.py
 - frontend/src/lib/api.ts
 - frontend/src/lib/validation.ts
 - frontend/src/proxy.ts
 - frontend/src/components/forms/AuthForm.tsx
 - frontend/src/components/layout/Navbar.tsx
 - frontend/src/components/layout/MobileMenu.tsx
 - frontend/src/components/checkout/CheckoutForm.tsx
 - frontend/src/components/account/MyOrdersList.tsx
 - frontend/src/components/account/OrderAgainButton.tsx
 - frontend/src/app/account/orders/page.tsx
 - frontend/src/app/login/page.tsx
 - frontend/src/app/signup/page.tsx
 - frontend/src/app/faq/page.tsx
 - frontend/tests/unit/validation.test.ts
 - frontend/tests/e2e/account.spec.ts
 - specs/002-restaurant-backend/tasks.md
tests:
 - backend: ruff, mypy clean; pytest 71 passed, 84 skipped (integration tests need TEST_DATABASE_URL)
 - frontend: tsc, eslint clean; vitest 86 passed; next build ok
 - e2e (real backend, Neon dev): account.spec.ts 3 passed (signup, pre-filled checkout, log out/in, My orders, Order again, guest checkout, /account redirect); a11y, responsive, order-flow re-run clean
 - manual curl on real dev DB: signup 201, duplicate 409 ACCOUNT_EXISTS, no-contact 422, login by phone, signed-in order linked, /me/orders, reorder, other user's reorder 404, no session 401
---

## Prompt

/sp.implement User Story 5 and User Story 6 (in that order, commit after each):
US5 — customer accounts: real signup and login (email or phone + password), logout, "My orders" page with past orders and a Re-order button, checkout pre-fills saved name/phone/address when logged in, guest checkout still works.
US6 — contact form messages and newsletter signups saved to the database, shown in the admin panel (/admin/messages) with mark-as-read.
Stop after both and tell me in simple steps how to test: create an account, place an order while logged in, see it in My orders, and send a contact message and see it in the admin panel.

## Response snapshot

US5: added signup (customer role only, unique email/phone, generic-safe errors), customer login on the shared authenticate(), /me/orders (newest first, paged) and /me/orders/{n}/reorder (skips sold-out/hidden/removed items and reports names; another user's order is 404). Frontend: real login/signup in AuthForm (redirect to a safe `from`, default /account/orders), Navbar/MobileMenu account states with Log out and Admin for admins, checkout prefill (name/phone from the account, address/area from the last order, never overwriting typed values), My orders page with Order again, proxy redirect for /account, truthful FAQ.

## Outcome

- Impact: customers can sign up, log in, see and repeat past orders; guests are unaffected
- Next: US6 (contact messages, newsletter, /admin/messages)
