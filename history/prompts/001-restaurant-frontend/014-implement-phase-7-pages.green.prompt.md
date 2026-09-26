---
id: 014
title: Implement phase 7 remaining pages
stage: green
date: 2026-09-26
surface: agent
model: claude-opus-5-5
feature: 001-restaurant-frontend
branch: 001-restaurant-frontend
user: Shuaibali0786
command: /sp.implement
labels: ["implement", "phase-7", "favourites", "auth-ui", "about", "contact", "404", "faq", "combos"]
links:
  spec: specs/001-restaurant-frontend/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - frontend/src/components/ui/PageHero.tsx
 - frontend/src/components/menu/FavouritesView.tsx
 - frontend/src/components/forms/AuthForm.tsx
 - frontend/src/components/forms/AuthLayout.tsx
 - frontend/src/components/forms/PasswordInput.tsx
 - frontend/src/components/forms/ContactForm.tsx
 - frontend/src/components/forms/NewsletterForm.tsx
 - frontend/src/components/content/OpeningHours.tsx
 - frontend/src/components/content/LocationCard.tsx
 - frontend/src/components/content/LegalPage.tsx
 - frontend/src/components/checkout/TrackOrder.tsx
 - frontend/src/components/layout/Navbar.tsx
 - frontend/src/components/layout/MobileMenu.tsx
 - frontend/src/components/layout/Footer.tsx
 - frontend/src/app/favourites/page.tsx
 - frontend/src/app/login/page.tsx
 - frontend/src/app/signup/page.tsx
 - frontend/src/app/about/page.tsx
 - frontend/src/app/contact/page.tsx
 - frontend/src/app/combos/page.tsx
 - frontend/src/app/faq/page.tsx
 - frontend/src/app/privacy/page.tsx
 - frontend/src/app/terms/page.tsx
 - frontend/src/app/track/page.tsx
 - frontend/src/app/not-found.tsx
 - frontend/src/app/menu/page.tsx
 - frontend/src/lib/api.ts
 - frontend/src/lib/validation.ts
 - frontend/src/lib/data/site.ts
 - frontend/eslint.config.mjs
 - frontend/tests/unit/validation.test.ts
 - specs/001-restaurant-frontend/spec.md
 - specs/001-restaurant-frontend/tasks.md
tests:
 - 66 unit tests pass (login identifier test added)
 - lint / typecheck / build (50 pages) — 0 errors, 0 warnings
 - Playwright on production build: 15 routes × 360/1280 — no overflow, one h1, no JS errors; 404 status for unknown URLs; login/contact/newsletter validation + success states; favourites add/remove; track unknown id + recent list; Combos nav active
---

## Prompt

Phase 6 looks great. Commit Phase 6.
Then /sp.implement Phase 7 only: Favourites (/favourites, with empty state), Login (/login) and Signup (/signup) as polished UI only (email/phone + password, show/hide password, validation, "Continue with Google" shown as coming soon, note that accounts go live with the backend), About (/about — our Burns Road story, values, kitchen photos, opening hours), Contact (/contact — form with validation, address, phone, email, hours, and a styled "Find us on Burns Road" location card; no embedded Google map), a branded 404 page in our fire theme with a "Back to menu" button, plus FAQ, Privacy and Terms pages linked from the footer (short, realistic text). Also make the navbar Combos link go to a combos section or page. Stop after Phase 7 and tell me what I should see.

## Response snapshot

Committed Phase 6 (f7760ab). Phase 7 (T084–T092): shared PageHero (menu refactored onto it); Favourites page (saved order, unknown slugs ignored, empty state) + heart links in navbar/mobile menu; Login/Signup UI-only via one AuthForm (login by email or PK mobile, show/hide password, "Continue with Google" text-only coming soon, accounts-coming-soon result, nothing stored) in a split layout; About (origins, kitchen photos, values, hours); Contact (channels, validated form requiring phone or email, Find us on Burns Road card with directions link, live opening hours); branded 404 with embers and Back to menu; FAQ (native details accordion), Privacy and Terms (honest about device storage, no invented tax/allergen claims); Track Order page (by number or recent device orders); /combos page (Grand Combo, deals, meal upgrades from menu data); NewsletterForm in footer; footer links to real pages; ESLint allows _-prefixed unused args.

## Outcome

- ✅ Impact: Every route in the site map is finished; no dead links remain.
- 🧪 Tests: 66 unit tests pass; gates green.
- 📁 Files: see list above
- 🔁 Next prompts: commit Phase 7; /sp.implement Phase 8 (polish, responsive/a11y audit, SEO, E2E, Lighthouse, journey log)
- 🧠 Reflection: A shared PageHero kept seven new pages consistent with no duplicated header markup.

## Evaluation notes (flywheel)

- Failure modes observed: over-generic AuthForm types (simplified); test selectors ambiguous with footer newsletter field
- Graders run and results (PASS/FAIL): lint PASS, typecheck PASS, vitest PASS, build PASS, scans PASS, route sweep PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
