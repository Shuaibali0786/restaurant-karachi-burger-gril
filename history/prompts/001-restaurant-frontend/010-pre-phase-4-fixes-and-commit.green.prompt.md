---
id: 010
title: Pre phase 4 fixes and commit
stage: green
date: 2026-09-26
surface: agent
model: claude-opus-5-5
feature: 001-restaurant-frontend
branch: 001-restaurant-frontend
user: Shuaibali0786
command: /sp.implement
labels: ["fix", "honesty", "ratings", "chef-specials", "hero"]
links:
  spec: specs/001-restaurant-frontend/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - frontend/src/components/menu/ProductCard.tsx
 - frontend/src/components/home/Hero.tsx
 - frontend/src/components/home/ChefSpecials.tsx
 - specs/001-restaurant-frontend/spec.md
 - specs/001-restaurant-frontend/data-model.md
tests:
 - lint / typecheck / build clean; 13 unit tests pass
 - Visual check of Chef's specials at 1280px and 360px (production build)
---

## Prompt

Fixes before Phase 4:
1. Hide the star ratings on all food cards and chef's special tiles until real ratings come from the backend (keep them only on the sample reviews).
2. Change the hero doodle "Freshly made" to "Hot off the grill!".
3. Chef's specials: the Grill Mix Platter photo is too dark and mostly smoke — reposition it (object-position bottom/center) and lighten the overlay so the food is clearly visible. In the Grand Combo tile the burger is hidden behind the text — position the image so the burger and fries show on the right side and the text stays on the left.
Then commit Phase 3.
Then /sp.implement Phase 4 only (Menu page with filter, search and sort + Item detail modal + /menu/[slug] page). The item modal must feel like a real food-ordering app. Stop after Phase 4 and tell me what I should see.

## Response snapshot

Removed Rating from ProductCard (chef tiles never showed one; Rating stays for sample reviews). Doodle now "Hot off the grill!". Chef's specials: platter framed at object-position center 62% (food band sits 47–67% down the photo, so pure bottom would crop it) with a lighter overlay limited to the text area; small tiles now place the photo in the right 72% with a soft left fade and copy on the left (Grand Combo at 18% 60% so burger and fries show). Spec/data-model updated (ratings hidden until backend). Committed Phase 3 + fixes; Phase 4 follows in PHR 011.

## Outcome

- ✅ Impact: No invented ratings on the site; chef's specials show the food clearly.
- 🧪 Tests: 13 unit tests pass; gates green.
- 📁 Files: see list above
- 🔁 Next prompts: Phase 4
- 🧠 Reflection: Measuring where the food sits in the photo beat a generic "object-bottom".

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): lint PASS, typecheck PASS, vitest PASS, build PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
