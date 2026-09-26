<!--
SYNC IMPACT REPORT
==================
Version change: (unversioned template) → 1.0.0
Bump rationale: MAJOR — first ratified constitution; all placeholder tokens replaced with
concrete, project-specific governance.

Principles defined (template slot → new title):
  - [PRINCIPLE_1_NAME] → I. Real-Brand Quality (NON-NEGOTIABLE)
  - [PRINCIPLE_2_NAME] → II. Visual Identity: The "Fire" Theme
  - [PRINCIPLE_3_NAME] → III. Ordering UX Like Real Food Apps
  - [PRINCIPLE_4_NAME] → IV. Motion With Purpose
  - [PRINCIPLE_5_NAME] → V. Mobile-First & Responsive
  - [PRINCIPLE_6_NAME] → VI. Accessibility
  Added beyond template's six slots (user specified eleven):
  - VII. Performance
  - VIII. Code Quality
  - IX. Backend-Ready Frontend
  - X. Honesty
  - XI. Project Journey Log

Added sections:
  - Technology Stack & Phased Build Order (was [SECTION_2_NAME])
  - Development Workflow & Quality Gates (was [SECTION_3_NAME])
  - Governance (filled)

Removed sections: none

Templates reviewed:
  ✅ .specify/templates/plan-template.md — "Constitution Check" gates are derived from this
     file at plan time; no edit required.
  ✅ .specify/templates/spec-template.md — generic; no mandatory-section conflict.
  ✅ .specify/templates/tasks-template.md — generic; principle-driven task types
     (a11y, responsive, performance, journey log) are added per-feature at /sp.tasks time.
  ✅ .specify/templates/phr-template.prompt.md — no principle references.
  ⚠ .specify/templates/commands/ — directory not present; nothing to verify.
  ⚠ README.md / docs/ — not present yet; docs/PROJECT-JOURNEY.md is created at end of the
     frontend phase per Principle XI.

Follow-up TODOs:
  - ✅ Resolved 2026-09-26: design reference renamed from `assets/design-reference.png.png`
    to `assets/design-reference.png`, matching Principle I.
-->

# Karachi Burger & Grill Constitution

Premium burger, grill and fried-chicken restaurant website from Burns Road, Karachi,
Pakistan. Tagline: **"Karachi ka asli zaiqa."** The site MUST look and feel like a real,
high-end, production restaurant brand that customers trust and order from — never a
template or a demo.

## Core Principles

### I. Real-Brand Quality (NON-NEGOTIABLE)

- Every page MUST feel finished and believable: real menu, real copy, real prices.
- Prices MUST be in PKR using the format `Rs 1,190` (prefix `Rs`, a space, thousands
  separator, no decimals).
- Lorem ipsum, "TBD" text, grey placeholder boxes and stock "image coming soon" tiles are
  forbidden.
- Imagery MUST come only from our own photos in `assets/images/` (38 `.jpg` files).
- Layout, warmth and energy MUST follow the design reference `assets/design-reference.png`,
  but with our own brand name, logo and photos.
- Other brands' names or logos (e.g. Coca-Cola, BurgerByte, KFC) MUST NEVER appear in copy,
  imagery, alt text or code-visible strings.

**Rationale**: Trust drives orders; a single placeholder or foreign logo breaks the illusion
of a real brand.

### II. Visual Identity: The "Fire" Theme

- Hero and key bands MUST use dark charcoal (`#0D0A08`, `#16110E`) with ember orange
  (`#FF5A1F`) and flame gold (`#FFB020`) accents.
- Content sections alternate with warm cream (`#FBF5EC`).
- Colors MUST be defined once as design tokens and referenced everywhere; no ad-hoc hex
  values in components.
- Typography: "Big Shoulders Display" for bold uppercase headings; "Manrope" for body;
  "Caveat Brush" as a handwritten accent used sparingly (at most one accent per section,
  e.g. "Pure Happiness!").
- Logo: a glowing flame/coal mark with "KARACHI" large and "BURGER & GRILL" below.
- Components use rounded cards, soft shadows, and an orange glow on hover.

**Rationale**: A consistent, token-driven identity is what separates a brand from a theme.

### III. Ordering UX Like Real Food Apps

- Clicking a menu item MUST NEVER add it directly to the cart.
- It MUST open an item detail modal (a bottom sheet on mobile) containing:
  - required option groups (e.g. Single / Double / Meal) that block "Add" until chosen;
  - optional add-ons with their price deltas;
  - special instructions (max 500 characters, with a live counter);
  - a quantity stepper (minimum 1);
  - a primary button labelled `Rs X | Add to cart →`, where X is the live total
    (base + selected options + add-ons) × quantity.
- The modal MUST trap focus, close on `Esc`, and restore focus to the triggering item.

**Rationale**: Customers expect the Foodpanda-style flow; skipping customisation produces
wrong orders.

### IV. Motion With Purpose

- Framer Motion powers: page-load reveals, card hover lift with image zoom, fly-to-cart
  animation, cart badge bounce, floating hero badges, and ember particles in the hero.
- All motion MUST respect `prefers-reduced-motion` (reduce to opacity-only or none).
- Content MUST NEVER be hidden behind scroll-triggered animations: every element is visible
  and readable without scrolling-in, JavaScript timing, or animation completion.

**Rationale**: Motion should add appetite and feedback, never gate content or harm users
sensitive to motion.

### V. Mobile-First & Responsive

- Styles are authored mobile-first.
- Every page MUST render flawlessly — no horizontal scroll, clipped text, or overlapping
  elements — at 360px, 768px, 1280px and 1920px widths.
- Touch targets MUST be at least 44×44px.

**Rationale**: Most Karachi food orders are placed on phones.

### VI. Accessibility

- Semantic HTML landmarks and heading order on every page.
- Every image MUST have meaningful alt text (empty `alt=""` only for purely decorative
  images such as ember particles or background textures).
- Full keyboard navigation for all interactive elements, including modals, cart and menus.
- Visible focus states on every focusable element.
- Text and UI contrast MUST meet WCAG 2.1 AA.

**Rationale**: An accessible site serves every customer and is a quality signal in itself.

### VII. Performance

- Every image MUST use `next/image`; below-the-fold images lazy-load, and only the hero LCP
  image may be marked priority.
- Lighthouse scores MUST be 90+ for Performance and Accessibility on the home and menu pages
  (mobile profile).

**Rationale**: Slow food sites lose hungry customers.

### VIII. Code Quality

- TypeScript `strict` mode is mandatory; `any` is forbidden without a justified comment.
- Small, reusable components; no duplicated logic or markup (extract shared pieces).
- Clear folder structure (e.g. `app/`, `components/`, `lib/data/`, `lib/api.ts`, `hooks/`,
  `styles/`).
- `eslint` and `next build` MUST pass with zero errors before any phase is marked done.

**Rationale**: The codebase is itself a portfolio artifact and must survive the backend
phase.

### IX. Backend-Ready Frontend

- All data (menu, categories, options, add-ons, deals, testimonials, locations) MUST flow
  through a typed data layer: mock data in `lib/data/` exposed via async functions in
  `lib/api.ts`.
- Components MUST NEVER import mock data files directly; they call `lib/api.ts` only.
- Types MUST be shaped so `lib/api.ts` can later call the FastAPI backend without changing
  any component.
- Login, signup and payments are UI-only in this phase: no real auth, no real payment
  processing, no secrets.

**Rationale**: A clean seam now makes the backend phase a swap, not a rewrite.

### X. Honesty

- No fabricated reviews may be presented as real.
- Testimonials MUST be visibly labelled "Sample reviews" until real reviews come from the
  backend.
- No invented awards, press mentions, ratings counts or certifications.

**Rationale**: Credibility is the brand; fake social proof destroys it.

### XI. Project Journey Log

- `docs/PROJECT-JOURNEY.md` MUST be maintained.
- After every phase, append an entry with: date (YYYY-MM-DD), what was built, technologies
  used and why, problems faced and how they were solved, and a "Screenshots" placeholder
  section.
- A phase is not complete until its journey entry is written.

**Rationale**: The log feeds the GitHub README, portfolio and LinkedIn post.

## Technology Stack & Phased Build Order

Phases MUST be executed in order; a phase starts only after the previous one is approved by
the project owner.

1. **Frontend (current phase)**: Next.js (App Router) + TypeScript (strict) + Tailwind CSS +
   Framer Motion, `next/font` for the three brand fonts, `next/image` for all imagery.
   Mock data via `lib/data/` + `lib/api.ts`.
2. **Backend**: FastAPI + SQLModel + Neon Postgres. MUST NOT begin until the frontend is
   explicitly approved.
3. **Deployment**: Vercel (frontend) + a backend host chosen during the backend phase.

Secrets and tokens MUST live in `.env` files (never committed) and be documented in
`.env.example`.

## Development Workflow & Quality Gates

- Work follows Spec-Driven Development: `/sp.specify` → `/sp.plan` → `/sp.tasks` →
  `/sp.implement`, with a Prompt History Record for every prompt.
- Every plan MUST include a Constitution Check against Principles I–XI.
- A feature is "done" only when all of these pass:
  - [ ] `eslint` and `next build` pass with zero errors (VIII)
  - [ ] Visual check at 360 / 768 / 1280 / 1920px (V)
  - [ ] Keyboard-only walkthrough including item modal and cart (III, VI)
  - [ ] `prefers-reduced-motion` check (IV)
  - [ ] Lighthouse ≥ 90 Performance and Accessibility (VII)
  - [ ] No placeholder text, foreign brand names, or unlabelled reviews (I, X)
  - [ ] Components read data only via `lib/api.ts` (IX)
- Phase completion additionally requires the `docs/PROJECT-JOURNEY.md` entry (XI) and
  owner approval.

## Governance

- This constitution supersedes all other practices and templates in this repository.
- Amendments require: a written proposal, owner approval, an updated Sync Impact Report,
  and propagation to dependent templates.
- Versioning follows semantic versioning:
  - MAJOR — a principle removed or redefined in a backward-incompatible way;
  - MINOR — a principle or section added or materially expanded;
  - PATCH — clarifications, wording or typo fixes.
- Every spec, plan, task list and review MUST verify compliance; any deviation MUST be
  recorded in the plan's Complexity Tracking table with justification.
- Runtime agent guidance lives in `CLAUDE.md`.

**Version**: 1.0.0 | **Ratified**: 2026-09-26 | **Last Amended**: 2026-09-26
