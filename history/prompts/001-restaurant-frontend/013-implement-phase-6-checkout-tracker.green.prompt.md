---
id: 013
title: Implement phase 6 checkout and tracker
stage: green
date: 2026-09-26
surface: agent
model: claude-opus-5-5
feature: 001-restaurant-frontend
branch: 001-restaurant-frontend
user: Shuaibali0786
command: /sp.implement
labels: ["implement", "phase-6", "checkout", "validation", "orders", "tracker"]
links:
  spec: specs/001-restaurant-frontend/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - frontend/src/lib/time.ts
 - frontend/src/lib/validation.ts
 - frontend/src/lib/types.ts
 - frontend/src/lib/orders.ts
 - frontend/src/lib/local-orders.ts
 - frontend/src/lib/api-error.ts
 - frontend/src/lib/api.ts
 - frontend/src/components/forms/Field.tsx
 - frontend/src/components/forms/ChoiceCard.tsx
 - frontend/src/components/checkout/CheckoutForm.tsx
 - frontend/src/components/checkout/CheckoutView.tsx
 - frontend/src/components/checkout/OrderSummary.tsx
 - frontend/src/components/checkout/OrderTracker.tsx
 - frontend/src/components/checkout/OrderConfirmation.tsx
 - frontend/src/app/checkout/page.tsx
 - frontend/src/app/order/[id]/page.tsx
 - frontend/tests/unit/time.test.ts
 - frontend/tests/unit/validation.test.ts
 - frontend/tests/unit/orders.test.ts
 - specs/001-restaurant-frontend/spec.md
 - specs/001-restaurant-frontend/plan.md
 - specs/001-restaurant-frontend/contracts/openapi.yaml
 - specs/001-restaurant-frontend/tasks.md
tests:
 - time (+4), validation (19), orders (6) — 65 unit tests pass
 - lint / typecheck / build (40 pages) — 0 errors, 0 warnings
 - Playwright on production build with fake clock: empty submit (4 inline errors, banner, focus on name), phone tidy, scheduled slot 10:30 PM, loading state, KBG-xxxxx confirmation, tracker advancing to Delivered, cart emptied, refresh keeps order, ASAP ETA "by 8:42 PM", 360px no overflow, vertical tracker
---

## Prompt

Phase 5 looks great. Commit Phase 5.
Then /sp.implement Phase 6 only (checkout + order confirmation + mock order tracker). Checkout must feel like a real Pakistani food-delivery app: contact details (name, phone 03XX-XXXXXXX), delivery area dropdown (Saddar, Clifton, DHA, PECHS, Gulshan, North Nazimabad), full address, nearest landmark, delivery notes, delivery time (ASAP or schedule later today), payment (Cash on Delivery; Card and JazzCash/Easypaisa shown as "coming soon"), sticky order summary, clear inline validation errors, and a "Place order · Rs X" button. After placing: a confirmation page with order number (e.g. KBG-10234), estimated delivery time, items summary, and a live-looking tracker (Confirmed → Preparing → On the way → Delivered) that advances every few seconds in this demo. The cart empties after the order. Stop after Phase 6 and tell me what I should see.

## Response snapshot

Committed Phase 5 (9f132ba). Phase 6 (T074–T083): PKT schedule slots (30-min, ≥45 min ahead, until 2:30 AM) and 12-hour formatting; Zod 4 schemas (PK mobile normalised to +92, checkout with landmark/notes/ASAP-or-slot/COD, contact, login, signup, newsletter); order model with KBG-5-digit ids, 6 s demo stages, ETA; device-local order storage with in-memory fallback; placeOrder re-prices from the menu (ApiError codes) with a short loading pause; getOrder. UI: numbered checkout sections with inline errors and summary banner, phone auto-tidy, delivery-time choice cards with slot picker (ASAP disabled when closed), COD plus Card/JazzCash/Easypaisa "Coming soon" (names only), sticky summary with "Place order · Rs X" and loading state; confirmation with order number + copy, ETA or scheduled time, demo tracker (horizontal/vertical, live region), delivery details, items and totals, Order again. Fixed RHF focus order. Spec/plan/OpenAPI updated for landmark, timing, 5-digit ids, payment names.

## Outcome

- ✅ Impact: Customers can complete a Cash on Delivery order end to end (US2 complete).
- 🧪 Tests: 65 unit tests pass; gates green.
- 📁 Files: see list above
- 🔁 Next prompts: commit Phase 6; /sp.implement Phase 7 (favourites, login, signup, about, contact, 404)
- 🧠 Reflection: Deriving the tracker from placedAt keeps it consistent across refreshes without timers state.

## Evaluation notes (flywheel)

- Failure modes observed: RHF focused phone before name (registration order); shell escaping of regex in YAML edit
- Graders run and results (PASS/FAIL): lint PASS, typecheck PASS, vitest PASS, build PASS, scans PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
