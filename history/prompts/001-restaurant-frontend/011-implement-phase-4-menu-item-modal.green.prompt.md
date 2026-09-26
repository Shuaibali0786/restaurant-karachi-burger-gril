---
id: 011
title: Implement phase 4 menu and item modal
stage: green
date: 2026-09-26
surface: agent
model: claude-opus-5-5
feature: 001-restaurant-frontend
branch: 001-restaurant-frontend
user: Shuaibali0786
command: /sp.implement
labels: ["implement", "phase-4", "menu", "item-modal", "cart", "url-state"]
links:
  spec: specs/001-restaurant-frontend/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - frontend/src/lib/pricing.ts
 - frontend/src/lib/cart.ts
 - frontend/src/stores/cart.ts
 - frontend/src/stores/ui.ts
 - frontend/src/app/providers.tsx
 - frontend/src/app/layout.tsx
 - frontend/src/app/menu/page.tsx
 - frontend/src/app/menu/[slug]/page.tsx
 - frontend/src/hooks/useMenuQuery.ts
 - frontend/src/components/menu/Filters.tsx
 - frontend/src/components/menu/MenuGrid.tsx
 - frontend/src/components/menu/MenuBrowser.tsx
 - frontend/src/components/menu/ItemDetail.tsx
 - frontend/src/components/menu/ItemModal.tsx
 - frontend/src/components/menu/OpenItemButton.tsx
 - frontend/src/components/menu/ProductCard.tsx
 - frontend/src/components/layout/Navbar.tsx
 - frontend/src/components/ui/QuantityStepper.tsx
 - frontend/src/components/ui/EmptyState.tsx
 - frontend/src/components/ui/Toaster.tsx
 - frontend/src/app/globals.css
 - frontend/.env.example
 - frontend/.gitignore
 - frontend/tests/unit/pricing.test.ts
 - specs/001-restaurant-frontend/tasks.md
tests:
 - tests/unit/pricing.test.ts (6 new) — 19 passed total
 - lint / typecheck / build (38 static pages) — 0 errors, 0 warnings
 - Playwright MCP on production build: search/filter/sort + URL, modal gating, Rs 2,180 total, add → toast + count, Back closes modal, Esc, shared ?item= link, 360px bottom sheet, /menu/[slug], /menu/nope 404
---

## Prompt

(Same message as PHR 010) … Then /sp.implement Phase 4 only (Menu page with filter, search and sort + Item detail modal + /menu/[slug] page). The item modal must feel like a real food-ordering app. Stop after Phase 4 and tell me what I should see.

## Response snapshot

Completed T052–T061. Pure pricing (unitPrice/lineTotal) and cart-line merging (lineKey, cap 20) with tests; persisted cart store (add + count; corrupted lines dropped) hydrated with favourites; navbar shows live count. Item modal state lives in the URL (?item=, pushState so Back closes it; shareable), native <dialog> with desktop two-column layout and phone bottom sheet (drag handle, slide-up, sticky order bar), required option with "Required → Selected" pill, blocked add that scrolls to and highlights the missing option, add-ons, 500-char note with counter, stepper with trash at 1, "Rs X | Add to cart →", toast on add, focus restored to opener. Menu page: dark header, sticky filter bar (debounced search, category chips with live counts, sort), grouped-by-category view when unfiltered, flat results with summary and Clear filters otherwise; state in URL via replaceState. /menu/[slug]: SSG for 33 items, dynamicParams=false (404 otherwise), breadcrumbs, OG metadata, "You may also like". Fixes during verification: metadataBase via NEXT_PUBLIC_SITE_URL (.env.example, un-ignored), mobile add-button wrapping, dialog overflow-clip so focusing an option never scrolls the sheet.

## Outcome

- ✅ Impact: Customers can browse, search, filter, sort, customise and add to cart (US1 + US4).
- 🧪 Tests: 19 unit tests pass; all quality gates green.
- 📁 Files: see list above
- 🔁 Next prompts: commit Phase 4; /sp.implement Phase 5 (cart drawer, /cart, totals, Wings Wednesday, fly-to-cart)
- 🧠 Reflection: URL-as-state for the modal gave back-button closing and shareable links for free.

## Evaluation notes (flywheel)

- Failure modes observed: overflow-hidden dialog scrolled by focus; metadataBase warning; scaffold .gitignore hid .env.example
- Graders run and results (PASS/FAIL): lint PASS, typecheck PASS, vitest PASS, build PASS, brand/honesty scan PASS, cart-add-only-in-ItemDetail PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
