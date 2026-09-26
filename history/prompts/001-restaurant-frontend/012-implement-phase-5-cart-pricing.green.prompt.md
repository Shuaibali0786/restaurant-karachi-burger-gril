---
id: 012
title: Implement phase 5 cart and pricing
stage: green
date: 2026-09-26
surface: agent
model: claude-opus-5-5
feature: 001-restaurant-frontend
branch: 001-restaurant-frontend
user: Shuaibali0786
command: /sp.implement
labels: ["implement", "phase-5", "cart", "pricing", "wings-wednesday", "fly-to-cart"]
links:
  spec: specs/001-restaurant-frontend/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - frontend/src/lib/pricing.ts
 - frontend/src/stores/cart.ts
 - frontend/src/stores/ui.ts
 - frontend/src/stores/promos.tsx
 - frontend/src/hooks/useCartView.ts
 - frontend/src/hooks/useModalDialog.ts
 - frontend/src/app/providers.tsx
 - frontend/src/app/layout.tsx
 - frontend/src/app/globals.css
 - frontend/src/app/cart/page.tsx
 - frontend/src/components/cart/CartLine.tsx
 - frontend/src/components/cart/CartSummary.tsx
 - frontend/src/components/cart/CartDrawer.tsx
 - frontend/src/components/cart/CartButton.tsx
 - frontend/src/components/cart/CartEmpty.tsx
 - frontend/src/components/cart/CartView.tsx
 - frontend/src/components/cart/FlyToCart.tsx
 - frontend/src/components/layout/Navbar.tsx
 - frontend/src/components/layout/MobileMenu.tsx
 - frontend/src/components/layout/SearchDialog.tsx
 - frontend/src/components/menu/ItemDetail.tsx
 - frontend/src/components/menu/ItemModal.tsx
 - frontend/src/components/menu/ProductCard.tsx
 - frontend/tests/unit/cart-totals.test.ts
 - frontend/tests/unit/cart-store.test.ts
 - frontend/tests/unit/format.test.ts
 - specs/001-restaurant-frontend/tasks.md
tests:
 - cart-totals (8), cart-store (3), format (6) new — 36 unit tests pass
 - lint / typecheck / build (39 static pages) — 0 errors, 0 warnings
 - Playwright MCP on production build: empty drawer, add → fly + bounce, Rs 1,190 → Rs 1,340 with Rs 310 nudge, qty 2 → free delivery, View full cart → /cart at top, Wings Wednesday via fake clock (Rs 1,690 − Rs 338 + Rs 150 = Rs 1,502), deal-ended notice after midnight, 360px drawer, remove → empty state
---

## Prompt

Phase 4 looks great. Commit Phase 4.
Then /sp.implement Phase 5 only (cart drawer + /cart page + pricing rules: options, extras, Wings Wednesday discount, delivery Rs 150 free over Rs 1,500). The cart must feel like a real food-delivery app: item photo, chosen option, extras and note on each line, quantity stepper, remove, subtotal, delivery, discount line and total, a "Add Rs X more for free delivery" progress bar, a friendly empty-cart state with a "Browse menu" button, and a "Checkout" button. Clicking the navbar cart icon opens the drawer; the drawer has a "View full cart" link to /cart. Stop after Phase 5 and tell me what I should see.

## Response snapshot

Committed Phase 4 (2ee1cc4). Phase 5 (T062–T073): resolveCart joins saved lines with the live menu and promo data (weekday-percent promos in PKT; discount per unit rounded), flags stale lines and ended deals; cartTotals (delivery Rs 150, free when amount after discount ≥ Rs 1,500). Cart store gains setQuantity/remove/removeMany/clear. Promos shared via context from the root layout. useCartView (30 s clock, auto-prunes invalid lines). UI: CartLine (photo, option, add-ons, note, unit price with struck original, deal chip, stepper with trash, Remove, line total), CartSummary (free-delivery progress bar, notices for ended deal/closed hours, breakdown with discount line, Checkout with total), right-side CartDrawer (full width on phones) with View full cart, /cart page with sticky summary, CartButton (opens drawer, bounces on landing), FlyToCart (arc animation; skipped for reduced motion), Wings Wednesday prices on cards and in the item view. Fixes: dialog close() releases scroll lock synchronously; page roots get scroll-margin so route changes land at the top.

## Outcome

- ✅ Impact: Full cart experience with correct totals and live deals (US2 cart part, US1 feedback).
- 🧪 Tests: 36 unit tests pass; gates green.
- 📁 Files: see list above
- 🔁 Next prompts: commit Phase 5; /sp.implement Phase 6 (checkout, confirmation, tracker)
- 🧠 Reflection: Faking the clock in Playwright let Wings Wednesday be verified end-to-end on a Saturday.

## Evaluation notes (flywheel)

- Failure modes observed: impure store update in render (redesigned FlyToCart), async dialog close left scroll lock during navigation, Next segment scroll hid heading under sticky navbar
- Graders run and results (PASS/FAIL): lint PASS, typecheck PASS, vitest PASS, build PASS, scans PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
