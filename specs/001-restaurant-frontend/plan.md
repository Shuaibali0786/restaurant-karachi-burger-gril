# Implementation Plan: Karachi Burger & Grill — Customer Website (Frontend Phase)

**Branch**: `001-restaurant-frontend` | **Date**: 2026-09-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-restaurant-frontend/spec.md`

## Summary

Build the complete customer-facing website — 13 routes, 33-item menu, customise-to-cart item
modal, persistent cart, Cash-on-Delivery checkout with a simulated tracker — as a statically
generated Next.js 16 app in `/frontend`. Visuals follow `assets/design-reference.png` re-skinned
in the "fire" theme; all data flows through a typed `lib/api.ts` backed by mock data so Phase 2
(FastAPI) can swap in without touching components. Key technical decisions: Tailwind v4 CSS
tokens (with AA-safe ember shade for text), Zustand persisted stores with guarded hydration,
integer-rupee pricing engine with PKT-aware Wings Wednesday, one `ItemDetail` component shared by
a native-`<dialog>` modal and SSG `/menu/[slug]` pages. See [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript (version pinned by create-next-app; `strict` +
`noUncheckedIndexedAccess`), Node.js ≥ 20.9 (dev machine v24.13.0)
**Primary Dependencies**: Next.js 16.3 (App Router, Turbopack), React 19.3, Tailwind CSS 4.3,
motion 13 (Framer Motion, `motion/react`), Zustand 5, React Hook Form 7 + Zod 4 +
@hookform/resolvers 5, lucide-react 1.x, next/font, next/image
**Storage**: Browser localStorage via Zustand `persist` (cart, favourites, orders); no server
storage this phase
**Testing**: Vitest 5 (unit: pricing, promos, time, validation, stores), Playwright 1.63 (E2E +
viewport screenshots), Lighthouse (mobile) for home and menu
**Target Platform**: Modern evergreen browsers (last 2 versions Chrome, Safari iOS, Firefox,
Edge); deploy target Vercel (Phase 3)
**Project Type**: Web application — frontend only now; `backend/` added in Phase 2
**Performance Goals**: Lighthouse ≥ 90 Performance & Accessibility (mobile); LCP ≤ 2.5 s;
CLS < 0.1; animations transform/opacity only at 60 fps
**Constraints**: 360–1920 px responsive; WCAG 2.1 AA; `prefers-reduced-motion`; no content gated
by scroll animation; photos only from `assets/images`; no secrets
**Scale/Scope**: 13 routes, 33 menu items, 8 categories, ~40 components, 38 images

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | How this plan complies | Pre | Post |
|---|-----------|------------------------|-----|------|
| I | Real-Brand Quality | Full catalogue + copy in `lib/data`; `formatRs` single formatter; photos only from `public/images` (copied from `assets/images`); no third-party brand names in data/copy. Footer phone/email placeholders are owner-requested — see Complexity Tracking | ✅ | ✅ |
| II | Visual Identity | `@theme` tokens in `globals.css`; ESLint/grep check for raw hex in components; three fonts via `next/font`; `Logo` component (SVG flame + wordmark); glow/lift card styles as shared classes | ✅ | ✅ |
| III | Ordering UX | Every card/"Add +" → `ItemModal`; no `add()` call outside `ItemDetail`; required option blocks button; 500-char note; stepper 1–20 with trash at 1; `Rs X \| Add to cart →`; native `<dialog>` focus containment, Esc, focus restore | ✅ | ✅ |
| IV | Motion With Purpose | motion + `MotionConfig reducedMotion="user"`; mount-based reveals only; CSS-keyframe embers removed under reduced motion; fly-to-cart & badge bounce guarded | ✅ | ✅ |
| V | Mobile-First | Tailwind mobile-first; bottom-sheet modal; Playwright screenshots at 360/768/1280/1920; 44 px targets in `Button`/icon buttons | ✅ | ✅ |
| VI | Accessibility | Landmarks per layout; alt text stored with data; skip link; `focus-visible` ring token; AA contrast fixed via `ember-700` text shade and charcoal-on-ember buttons (research R2); form errors via `aria-describedby` | ✅ | ✅ |
| VII | Performance | `next/image` everywhere with `sizes`; hero-only `priority`; SSG for all pages; client islands kept small; particles in CSS | ✅ | ✅ |
| VIII | Code Quality | strict TS; component folders per user structure; shared `ui/` primitives; `lint`, `typecheck`, `build` scripts as gates | ✅ | ✅ |
| IX | Backend-Ready | Components import only `@/lib/api` (ESLint `no-restricted-imports` on `@/lib/data/*`); OpenAPI draft in `contracts/`; auth/payment UI-only | ✅ | ✅ |
| X | Honesty | `Testimonial.isSample` drives visible "Sample reviews" label; demo tracker labelled "Live tracking coming soon"; hero figures owner-confirmed (spec Clarifications) | ✅ | ✅ |
| XI | Journey Log | Final task creates `docs/PROJECT-JOURNEY.md` Phase 1 entry | ✅ | ✅ |

**Gate result**: PASS (two owner-sanctioned interpretations recorded in Complexity Tracking).

## Project Structure

### Documentation (this feature)

```text
specs/001-restaurant-frontend/
├── plan.md              # This file
├── research.md          # Phase 0 — decisions R1–R13
├── data-model.md        # Phase 1 — entities, state machines, form schemas
├── quickstart.md        # Phase 1 — run, gates, manual walkthrough
├── contracts/
│   ├── frontend-api.md  # lib/api.ts signatures + errors
│   └── openapi.yaml     # Phase 2 backend target (draft)
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/sp.tasks — not created here)
```

### Source Code (repository root)

Owner-specified structure, extended with the files needed to satisfy the spec (additions marked
`+`).

```text
assets/                          # source photos + design reference (unchanged)
docs/
└── PROJECT-JOURNEY.md           # + Principle XI log
frontend/
├── public/images/               # 38 photos copied from assets/images (same names)
├── src/
│   ├── app/
│   │   ├── layout.tsx           # fonts, AnnouncementBar, Navbar, Footer, CartDrawer, ItemModal, providers
│   │   ├── globals.css          # Tailwind v4 @theme tokens
│   │   ├── page.tsx             # Home
│   │   ├── menu/page.tsx
│   │   ├── menu/[slug]/page.tsx # SSG, dynamicParams=false
│   │   ├── cart/page.tsx
│   │   ├── checkout/page.tsx
│   │   ├── order/[id]/page.tsx  # client, reads orders store
│   │   ├── favourites/page.tsx
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── about/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── coming-soon/page.tsx # + target for FAQ/Track Order/Privacy/Terms (spec FR-004)
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── layout/   AnnouncementBar, Navbar, Footer, + Logo, + MobileMenu, + SearchDialog, + SocialIcons, + SkipLink
│   │   ├── home/     Hero, + EmberParticles, Features, Categories, MostLoved, PromoBanners, ChefSpecials, AboutTeaser, Testimonials, FinalCta
│   │   ├── menu/     ProductCard, ItemModal, + ItemDetail, Filters, + MenuGrid, + FavouriteButton
│   │   ├── cart/     CartDrawer, CartLine, + CartSummary, + FlyToCart, + CartButton
│   │   ├── checkout/ + CheckoutForm, + OrderSummary, + OrderTracker
│   │   ├── forms/    + Field, + ContactForm, + AuthForm, + NewsletterForm
│   │   └── ui/       Button, Badge, QuantityStepper, SectionHeading, Countdown, + Rating, + Price, + EmptyState, + Reveal
│   ├── lib/
│   │   ├── data/     categories.ts, menu-items.ts, options.ts, extras.ts, promos.ts, + testimonials.ts, + areas.ts, + site.ts (contact, hours, socials)
│   │   ├── api.ts    # the only data entry point for components
│   │   ├── types.ts  # +
│   │   ├── pricing.ts# + unit/line/cart totals, promos
│   │   ├── time.ts   # + PKT helpers, opening hours, countdown targets
│   │   ├── format.ts # + formatRs, formatPhone
│   │   └── validation.ts # + Zod schemas
│   ├── stores/       # + cart.ts, favourites.ts, orders.ts, ui.ts, storage.ts (safe localStorage)
│   └── hooks/        # + useHydrated, useCountdown, useScrolled
├── tests/
│   ├── unit/         # vitest: pricing, time, validation, cart store, format
│   └── e2e/          # playwright: order flow, menu filters, a11y/keyboard, viewports
├── eslint.config.mjs
├── next.config.ts
├── playwright.config.ts
├── vitest.config.ts
└── package.json
```

**Structure Decision**: Web-application layout with only `frontend/` in this phase (owner
instruction); `backend/` will be added beside it in Phase 2. Route groups are not needed — every
page shares one layout.

## Implementation Approach (build order)

1. **Scaffold & foundations** — create-next-app in `/frontend`, copy photos, tokens, fonts,
   ESLint import restriction, scripts (`lint`, `typecheck`, `test`, `test:e2e`).
2. **Data layer** — `types.ts`, all `lib/data/*` (33 items, 8 categories, overrides, add-ons,
   promos, sample testimonials, areas), `api.ts`, `pricing.ts`, `time.ts`, `format.ts` + unit
   tests (money and time-zone logic tested first).
3. **Shell** — layout, AnnouncementBar, Navbar (scroll state, mobile menu, search, cart button),
   Footer, SkipLink, 404, coming-soon.
4. **P1: customise → cart** — stores + hydration, ProductCard, ItemDetail, ItemModal,
   `/menu/[slug]`, FlyToCart, CartDrawer, `/cart`.
5. **P1: checkout → confirmation** — CheckoutForm (RHF + Zod), OrderSummary, `placeOrder`,
   `/order/[id]`, OrderTracker.
6. **P2: Home page** — Hero (embers, badges, stats), Features, Categories, MostLoved,
   PromoBanners + Countdown, ChefSpecials, AboutTeaser, Testimonials, FinalCta.
7. **P2: Menu page** — Filters, search, sort, URL sync, empty state.
8. **P3** — Favourites, About, Contact, Login, Signup.
9. **Polish & verification** — reduced-motion audit, keyboard walkthrough, 4-viewport
   screenshots, Lighthouse, brand/placeholder scan, `docs/PROJECT-JOURNEY.md`.

## Key Risks

- **Hydration mismatch** from persisted stores and time-dependent promos → `skipHydration`,
  `useHydrated` gate, client-only countdown (research R5, R8).
- **Lighthouse performance** with animation-heavy hero → CSS embers, hero-only priority image,
  small client islands; measure early in step 6.
- **Font name drift** (Big Shoulders family) → verify at scaffold (research R3).

## Complexity Tracking

> Recorded interpretations of the constitution (not violations requiring new complexity).

| Item | Why Needed | Resolution |
|------|------------|------------|
| Footer social icons (Instagram, Facebook, TikTok, WhatsApp) vs Principle I "no other brands' logos" | Owner requested social icons in spec; they link to our own accounts, not endorse other brands | Treated as permitted navigation glyphs; suggest constitution PATCH 1.0.1 clarifying "competitor/sponsor branding" |
| Footer/contact phone and email "placeholders" vs Principle I "no placeholders" | Owner has not supplied real contact details yet (spec Assumptions) | Formatted values kept in one data file (`lib/data/site.ts`) and listed as a launch blocker in PROJECT-JOURNEY |
