---
id: 005
title: Plan restaurant frontend architecture
stage: plan
date: 2026-09-26
surface: agent
model: claude-opus-5-5
feature: 001-restaurant-frontend
branch: 001-restaurant-frontend
user: Shuaibali0786
command: /sp.plan
labels: ["plan", "nextjs", "tailwind", "zustand", "architecture"]
links:
  spec: specs/001-restaurant-frontend/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/001-restaurant-frontend/plan.md
 - specs/001-restaurant-frontend/research.md
 - specs/001-restaurant-frontend/data-model.md
 - specs/001-restaurant-frontend/quickstart.md
 - specs/001-restaurant-frontend/contracts/frontend-api.md
 - specs/001-restaurant-frontend/contracts/openapi.yaml
 - CLAUDE.md
tests:
 - none
---

## Prompt

/sp.plan
Tech stack (frontend phase only):
- Latest stable Next.js with App Router + TypeScript (strict mode)
- Tailwind CSS v4 with our design tokens (charcoal #0D0A08 / #16110E, ember #FF5A1F, flame gold #FFB020, cream #FBF5EC)
- Framer Motion for animations (page reveals, hover lift, fly-to-cart, floating badges, ember particles)
- Zustand with localStorage persist for cart and favourites
- React Hook Form + Zod for checkout, contact, login and signup forms (Pakistani phone validation)
- lucide-react for icons
- next/font for Big Shoulders Display, Manrope and Caveat Brush
- next/image for every photo

Project structure:
- Create the Next.js app inside a /frontend folder at the project root.
- Copy all photos from assets/images into frontend/public/images (keep the same file names).
- frontend/src/app → routes (home, menu, menu/[slug], cart, checkout, order/[id], favourites, login, signup, about, contact, not-found)
- frontend/src/components → layout (Navbar, Footer, AnnouncementBar), home (Hero, Features, Categories, MostLoved, PromoBanners, ChefSpecials, AboutTeaser, Testimonials, FinalCta), menu (ProductCard, ItemModal, Filters), cart (CartDrawer, CartLine), ui (Button, Badge, QuantityStepper, SectionHeading, Countdown)
- frontend/src/lib/data → menu items, categories, options, extras, promos (typed)
- frontend/src/lib/api.ts → async functions

## Response snapshot

Ran setup-plan; verified versions via npm view (Next 16.3.6, React 19.3, Tailwind 4.3.3, motion/framer-motion 13.4.4, Zustand 5.0.15, RHF 7.89, Zod 4.6.5, lucide-react 1.48, Vitest 5, Playwright 1.63) and docs via Context7 (Next 16 async params, ESLint CLI replaces next lint; lucide v1 removed brand icons). Wrote research.md (R1–R13: incl. AA contrast finding — ember on cream fails, add ember-700 #C2410C for text and charcoal text on ember buttons; hydration-safe Zustand; PKT time helpers; native <dialog> ItemModal + SSG /menu/[slug]), data-model.md, contracts (lib/api.ts signatures + draft OpenAPI for Phase 2), quickstart.md, plan.md with Constitution Check (all 11 PASS) and Complexity Tracking (social icons, contact placeholders). Agent script only added a BOM to CLAUDE.md (no markers) — reverted and appended Active Technologies manually.

## Outcome

- ✅ Impact: Implementation plan and Phase 1 design artifacts ready for /sp.tasks.
- 🧪 Tests: none (testing strategy defined: Vitest + Playwright + Lighthouse)
- 📁 Files: plan.md, research.md, data-model.md, quickstart.md, contracts/*, CLAUDE.md
- 🔁 Next prompts: /sp.adr item-detail-modal-strategy (optional), /sp.tasks
- 🧠 Reflection: Verifying contrast numerically caught an AA failure baked into the brand palette.

## Evaluation notes (flywheel)

- Failure modes observed: update-agent-context.ps1 added only a BOM to CLAUDE.md
- Graders run and results (PASS/FAIL): Constitution Check 11/11 PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
