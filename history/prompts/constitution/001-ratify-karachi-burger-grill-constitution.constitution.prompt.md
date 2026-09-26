---
id: 001
title: Ratify Karachi Burger Grill constitution
stage: constitution
date: 2026-09-26
surface: agent
model: claude-opus-5-5
feature: none
branch: master
user: Shuaibali0786
command: /sp.constitution
labels: ["constitution", "governance", "frontend", "brand", "principles"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - .specify/memory/constitution.md
 - history/prompts/constitution/001-ratify-karachi-burger-grill-constitution.constitution.prompt.md
tests:
 - none
---

## Prompt

/sp.constitution
Project: "Karachi Burger & Grill" — a premium burger, grill and fried-chicken restaurant website from Burns Road, Karachi, Pakistan. Tagline: "Karachi ka asli zaiqa." It must look and feel like a real, high-end, production restaurant brand that customers trust and order from — not a template or demo.

Build order: FRONTEND first (this phase), then BACKEND (FastAPI + SQLModel + Neon Postgres), then DEPLOYMENT (Vercel + backend host). Do not start backend work until the frontend is approved.

Principles:
1. Real-brand quality: every page must feel finished and believable — real menu, real prices in PKR (format "Rs 1,190"), real copy, no lorem ipsum, no placeholder boxes. Use only our own photos from assets/images (38 jpg files). Design reference: assets/design-reference.png — follow its layout, warmth and energy, but with our own brand name, logo and photos. Never show other brands' names or logos (Coca-Cola, BurgerByte, KFC, etc.).
2. Visual identity: warm dark "fire" theme. Hero and key bands in dark charcoal (#0D0A08, #16110E) with ember orange (#FF5A1F) and flame gold (#FFB020); content sections alternate with warm cream (#FBF5EC). Fonts: "Big Shoulders Display" for bold uppercase headings, "Manrope" for body, "Caveat Brush" handwritten accent used sparingly (like "Pure Happiness!" in the reference). Logo: a glowing flame/coal mark with "KARACHI" large and "BURGER & GRILL" below. Rounded cards, soft shadows, orange glow on hover.
3. Ordering UX like real food apps: clicking an item never adds it straight to the cart. It opens an item detail modal (bottom sheet on mobile) with required options (Single/Double/Meal etc.), optional add-ons, special instructions (500 chars), quantity stepper, and a "Rs X | Add to cart →" button.
4. Motion with purpose: Framer Motion page-load reveals, card hover lift and image zoom, fly-to-cart animation, cart badge bounce, floating hero badges, ember particles in the hero. Respect prefers-reduced-motion. Never hide content behind scroll-triggered animations.
5. Mobile-first and responsive: flawless at 360px, 768px, 1280px and 1920px.
6. Accessibility: semantic HTML, alt text on every image, full keyboard navigation, visible focus states, WCAG AA contrast.
7. Performance: next/image for every image, lazy loading, Lighthouse 90+ for performance and accessibility.
8. Code quality: TypeScript strict, small reusable components, no duplicated code, clear folder structure, ESLint and build pass with zero errors.
9. Backend-ready frontend: all data comes from a typed data layer (lib/data + lib/api.ts) with mock data, written so it can later be swapped to the FastAPI backend without changing components. Login, signup and payments are UI-only in this phase.
10. Honesty: no fake reviews presented as real. Testimonials are clearly labelled "Sample reviews" until real ones come from the backend.
11. Project journey log: maintain docs/PROJECT-JOURNEY.md. After every phase, append: date, what was built, technologies used and why, problems faced and how they were solved, and a "Screenshots" placeholder. This will be used later for the GitHub README, portfolio and LinkedIn post.

## Response snapshot

Filled `.specify/memory/constitution.md` (v1.0.0, ratified 2026-09-26) with 11 principles (I Real-Brand Quality … XI Project Journey Log), a Technology Stack & Phased Build Order section, a Development Workflow & Quality Gates section with a done-checklist, and Governance with semver amendment rules. Prepended a Sync Impact Report. Reviewed plan/spec/tasks/PHR templates — no edits needed (Constitution Check is derived at plan time). Flagged that the design reference file on disk is `assets/design-reference.png.png`.

## Outcome

- ✅ Impact: Project constitution ratified at v1.0.0; governs all frontend/backend/deploy phases.
- 🧪 Tests: none (governance document)
- 📁 Files: .specify/memory/constitution.md
- 🔁 Next prompts: /sp.specify for the frontend phase (home, menu, item modal, cart, checkout UI, auth UI)
- 🧠 Reflection: Made vague items testable (price format, 44px targets, modal focus trap, components-only-call-lib/api.ts).

## Evaluation notes (flywheel)

- Failure modes observed: design-reference filename has double extension
- Graders run and results (PASS/FAIL): placeholder scan PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
