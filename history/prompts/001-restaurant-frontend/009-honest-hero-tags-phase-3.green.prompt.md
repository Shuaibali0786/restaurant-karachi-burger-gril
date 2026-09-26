---
id: 009
title: Honest hero, varied tags, phase 3
stage: green
date: 2026-09-26
surface: agent
model: claude-opus-5-5
feature: 001-restaurant-frontend
branch: 001-restaurant-frontend
user: Shuaibali0786
command: /sp.implement
labels: ["implement", "phase-3", "honesty", "tags", "promos", "countdown", "testimonials"]
links:
  spec: specs/001-restaurant-frontend/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - frontend/src/components/home/Hero.tsx
 - frontend/src/components/ui/Badge.tsx
 - frontend/src/lib/types.ts
 - frontend/src/lib/data/menu-items.ts
 - frontend/src/lib/time.ts
 - frontend/src/hooks/useNow.ts
 - frontend/src/components/ui/Countdown.tsx
 - frontend/src/components/menu/OpenItemButton.tsx
 - frontend/src/components/home/PromoBanners.tsx
 - frontend/src/components/home/ChefSpecials.tsx
 - frontend/src/components/home/AboutTeaser.tsx
 - frontend/src/components/home/Testimonials.tsx
 - frontend/src/components/home/FinalCta.tsx
 - frontend/src/app/page.tsx
 - frontend/tests/unit/time.test.ts
 - frontend/tests/unit/catalogue.test.ts
 - specs/001-restaurant-frontend/spec.md
 - specs/001-restaurant-frontend/data-model.md
 - specs/001-restaurant-frontend/contracts/openapi.yaml
 - specs/001-restaurant-frontend/quickstart.md
 - specs/001-restaurant-frontend/tasks.md
tests:
 - tests/unit/time.test.ts (5 new) + catalogue.test.ts (1 new) — 13 passed
 - lint / typecheck / build — 0 errors, 0 warnings
 - Playwright MCP review at 1280px and 360px on a production build (port 3001)
---

## Prompt

Before Phase 3, fix two things: (1) In the hero, replace "50K+ Happy customers" and the "4.9 rating" badge with honest wording, e.g. a card "Loved across Karachi" and a badge "Made fresh, every order" — no fake numbers. (2) In Most Loved Items, vary the tags so not every card says Bestseller: use at most 3 Bestseller, and mix Hot, New, Chef's Pick, Veg across the rest.
Then /sp.implement Phase 3 only (promo banners with countdown, Chef's specials, About teaser, Sample testimonials, Final CTA). Stop after Phase 3 and tell me what I should see at http://localhost:3000.

## Response snapshot

Fix 1: hero badge → "Made fresh, every order" (chef hat), stats card → "Loved across Karachi / Delivering from Saddar to DHA" (no numbers, no avatars). Fix 2: new `chef-pick` tag; Bestseller limited to 3 menu-wide (Zinger, Shawarma, Crispy Bucket); Double Trouble → Hot; Grill Mix Platter, Tikka Rice Bowl, Grand Combo → Chef's Pick; Mint Margarita → Veg; Most Loved curated to 10 items incl. New items; test enforces ≤3 Bestseller and ≥4 tag kinds. Spec/data-model/OpenAPI/quickstart/tasks updated. Phase 3 (T043–T051): PKT time helpers with tests, hydration-safe useNow clock, Wings Wednesday countdown (Ends in / Starts in, days when needed), promo banners (gold combo with round plate medallion; dark wings banner with readable gradient), Chef's specials bento, About teaser collage, testimonials with visible "Sample reviews" label, Taste the fire CTA. Found stale Tailwind CSS in the long-running dev server; verified on a production build instead.

## Outcome

- ✅ Impact: Home page complete; hero contains no invented figures; tag variety enforced by test.
- 🧪 Tests: 13 unit tests pass; all quality gates green.
- 📁 Files: see list above
- 🔁 Next prompts: commit; /sp.implement Phase 4
- 🧠 Reflection: Card star ratings are still illustrative values — flagged to owner as a remaining honesty question.

## Evaluation notes (flywheel)

- Failure modes observed: react-hooks/purity lint on Date.now in render; backtick escaping in shell edits; dev server served stale CSS; orphaned `next start` child process held port 3001
- Graders run and results (PASS/FAIL): lint PASS, typecheck PASS, vitest PASS, build PASS, honesty/brand scan PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
