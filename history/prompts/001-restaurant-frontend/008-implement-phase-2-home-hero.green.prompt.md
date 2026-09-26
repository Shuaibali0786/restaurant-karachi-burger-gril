---
id: 008
title: Implement phase 2 home hero
stage: green
date: 2026-09-26
surface: agent
model: claude-opus-5-5
feature: 001-restaurant-frontend
branch: 001-restaurant-frontend
user: Shuaibali0786
command: /sp.implement
labels: ["implement", "phase-2", "hero", "data-layer", "product-card", "favourites"]
links:
  spec: specs/001-restaurant-frontend/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - frontend/src/lib/data/options.ts
 - frontend/src/lib/data/extras.ts
 - frontend/src/lib/data/categories.ts
 - frontend/src/lib/data/menu-items.ts
 - frontend/src/lib/data/promos.ts
 - frontend/src/lib/data/testimonials.ts
 - frontend/src/lib/data/areas.ts
 - frontend/src/lib/menu.ts
 - frontend/src/lib/api.ts
 - frontend/src/stores/storage.ts
 - frontend/src/stores/hydration.ts
 - frontend/src/stores/favourites.ts
 - frontend/src/stores/ui.ts
 - frontend/src/app/providers.tsx
 - frontend/src/app/page.tsx
 - frontend/src/components/ui/Rating.tsx
 - frontend/src/components/ui/Price.tsx
 - frontend/src/components/ui/SectionHeading.tsx
 - frontend/src/components/menu/FavouriteButton.tsx
 - frontend/src/components/menu/ProductCard.tsx
 - frontend/src/components/home/EmberParticles.tsx
 - frontend/src/components/home/Hero.tsx
 - frontend/src/components/home/Features.tsx
 - frontend/src/components/home/Categories.tsx
 - frontend/src/components/home/MostLoved.tsx
 - frontend/vitest.config.mts
 - frontend/tests/unit/catalogue.test.ts
 - specs/001-restaurant-frontend/tasks.md
tests:
 - tests/unit/catalogue.test.ts (7 passed)
 - npm run lint / typecheck / build (0 errors, 0 warnings)
 - Playwright MCP visual review at 1280px and 360px; tab arrow keys, favourites persistence, Add does not touch cart
---

## Prompt

Phase 2 only. Stop after Phase 2 is complete. Make the hero look premium and real like assets/design-reference.png. Then tell me what I should see at http://localhost:3000.

## Response snapshot

Completed T025–T042. Built typed data layer (33 items verbatim from spec, 8 categories, per-item size overrides, add-ons, promos, 6 sample testimonials, areas), shared filterMenu, full catalogue API, hydration-safe favourites store with safe localStorage, UI store. Components: Rating, Price, FavouriteButton, ProductCard (stretched-button card that opens item via UI store, never adds to cart), CSS ember particles, premium Hero (Grand Combo melted into fire glow via radial mask, faint fire-bg flame bed, script "fire!" headline, floating delivery/rating badges, "Freshly made" doodle, 50K+ card, trust row), Features overlap strip, Categories round chips, Most Loved tabs (WAI-ARIA tabs with arrow keys). Visual iterations fixed: photo rectangle edge, lighten blend hiding drink, 50K card colour clash, price wrap, centred heading alignment, mobile badge overlap, LCP warning (fire-bg preload).

## Outcome

- ✅ Impact: Home page top half complete and on-brand; data layer ready for all later phases.
- 🧪 Tests: 7 catalogue integrity tests pass; all quality gates green.
- 📁 Files: see list above
- 🔁 Next prompts: /sp.implement Phase 3
- 🧠 Reflection: Checking a contact sheet of all photos up front guided crops and confirmed no third-party logos.

## Evaluation notes (flywheel)

- Failure modes observed: hung shell command (stray `cat >`), port 3000 already held by the owner's dev server, CSS class-order conflicts
- Graders run and results (PASS/FAIL): lint PASS, typecheck PASS, vitest PASS, build PASS, brand scan PASS, raw-hex scan PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
