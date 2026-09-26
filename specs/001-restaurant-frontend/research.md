# Phase 0 Research: Karachi Burger & Grill — Frontend

**Date**: 2026-09-26 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

Versions verified with `npm view` on 2026-09-26 (Node v24.13.0, npm 11.6.2); framework behaviour
verified against current docs (Context7: vercel/next.js, lucide.dev).

| Package | Latest stable |
|---------|---------------|
| next / eslint-config-next | 16.3.6 |
| react / react-dom | 19.3.0 |
| tailwindcss / @tailwindcss/postcss | 4.3.3 |
| motion (successor name of framer-motion; both 13.4.4) | 13.4.4 |
| zustand | 5.0.15 |
| react-hook-form | 7.89.0 |
| zod | 4.6.5 |
| @hookform/resolvers | 5.9.1 |
| lucide-react | 1.48.0 |
| vitest | 5.0.2 |
| @playwright/test | 1.63.0 |

---

## R1. Framework and scaffolding

- **Decision**: `create-next-app@latest` (Next 16.3) in `/frontend` with App Router, TypeScript,
  Tailwind, ESLint, `src/` directory, Turbopack, import alias `@/*`. Keep the TypeScript version
  that `create-next-app` pins; enable `"strict": true` (default) plus `noUncheckedIndexedAccess`.
- **Rationale**: Owner-selected stack; Next 16 gives static generation, `next/image`, `next/font`
  and Vercel-native deployment (Phase 3).
- **Notes from docs**: In Next 16, `params` and `searchParams` are **async only** (must be
  awaited); `next lint` is gone — lint runs through the ESLint CLI (`eslint .`); Turbopack is the
  default bundler.
- **Alternatives**: Vite + React Router (no SSG/image pipeline, weaker SEO); Remix (not chosen by
  owner).

## R2. Styling and design tokens (Tailwind v4)

- **Decision**: Tailwind v4 CSS-first config — tokens in `src/app/globals.css` via `@theme`
  (`--color-charcoal-950: #0D0A08`, `--color-charcoal-900: #16110E`, `--color-ember-500: #FF5A1F`,
  `--color-flame-400: #FFB020`, `--color-cream-50: #FBF5EC`, plus derived shades, radii, shadows,
  `--shadow-glow`). No `tailwind.config.js`. Components use token utilities only
  (`bg-charcoal-950`, `text-ember-500`) — never raw hex (Principle II).
- **Contrast finding (WCAG AA, computed)**:
  - `#FF5A1F` on cream `#FBF5EC` ≈ **2.9:1 — fails** for text.
  - White on `#FF5A1F` ≈ **3.1:1 — fails** for normal-size button text.
  - Charcoal `#0D0A08` on `#FF5A1F` ≈ **6.3:1 — passes**; `#FF5A1F` on charcoal ≈ 6.3:1 passes;
    `#FFB020` on charcoal passes comfortably.
  - **Therefore**: ember/flame buttons use **charcoal text** (as the reference does with dark text
    on yellow); ember-coloured **text on cream** uses a deeper token
    `--color-ember-700: #C2410C` (≈ 4.8:1 on cream — passes). Bright ember stays for fills,
    icons, glows and text on dark bands.
- **Alternatives**: CSS Modules (more files, no utility speed); styled-components (runtime cost,
  RSC friction).

## R3. Fonts

- **Decision**: `next/font/google` for Manrope (variable), Caveat Brush (400) and Big Shoulders
  Display (700–900), exposed as CSS variables `--font-display`, `--font-body`, `--font-script`
  and mapped in `@theme`. `display: 'swap'`, subsets `latin`.
- **Risk / verification step**: Google Fonts has been consolidating the Big Shoulders family into a
  single variable family ("Big Shoulders" with an optical-size axis). At scaffold time, check the
  export name in `next/font/google`; if `Big_Shoulders_Display` is missing, use `Big_Shoulders`
  at display optical size — visually identical intent. No self-hosted files needed.
- **Alternatives**: Self-hosting via `next/font/local` (extra asset management, no benefit).

## R4. Animation library

- **Decision**: `motion` package (import from `motion/react`) — the renamed, actively maintained
  Framer Motion; identical API. Use `MotionConfig reducedMotion="user"` at the root plus a
  `useReducedMotion()` guard for particles, floating badges and fly-to-cart.
- **Ember particles**: ~18 absolutely positioned `<span>`s animated with **CSS keyframes**
  (transform/opacity only, GPU-composited), `aria-hidden`, removed entirely under
  `prefers-reduced-motion`. Cheaper than per-particle JS animation → protects Lighthouse
  performance (Principle VII).
- **Page reveals**: animate on **mount**, not on scroll; initial state is fully visible for
  no-JS/SSR and reduced-motion (opacity starts ≥ 0 only after hydration) so content is never
  hidden (Principle IV).
- **Fly-to-cart**: on add, read the product image rect and the cart icon rect (icon registers a
  ref in the UI store); render a fixed-position clone that animates `x/y/scale/opacity` along a
  curve, then trigger the badge bounce (`key` change → spring scale).
- **Alternatives**: GSAP (licensing/size, imperative); CSS-only (no layout-aware fly-to-cart).

## R5. Client state and persistence

- **Decision**: Zustand 5 stores with `persist` (localStorage, versioned keys `kbg-cart-v1`,
  `kbg-favourites-v1`, `kbg-orders-v1`) + a non-persisted `ui` store (cart drawer open, active
  item modal slug, cart icon ref).
- **SSR/hydration**: stores use `skipHydration: true`; a `<StoreHydrator/>` client component calls
  `rehydrate()` in `useEffect`; count badges and cart totals render `0`/skeleton until
  `hasHydrated` to avoid hydration mismatches.
- **Safety**: custom `createJSONStorage` wrapper with try/catch → falls back to in-memory storage
  when localStorage is blocked (spec edge case). `migrate`/`merge` drops cart lines whose
  `itemSlug` no longer exists or that fail schema validation (Zod) — rest of cart survives.
- **Cart line identity**: `lineKey = slug|optionId|sortedAddonIds|trimmedNote`; adding an
  identical configuration increments quantity (cap 20).
- **Alternatives**: React Context + reducer (more boilerplate, re-render fan-out); Redux Toolkit
  (heavier for this scope).

## R6. Forms and validation

- **Decision**: React Hook Form + Zod 4 via `@hookform/resolvers/zod`. Shared schemas in
  `src/lib/validation.ts` (checkout, contact, login, signup, newsletter). On invalid submit, RHF
  `shouldFocusError` moves focus to first invalid field; errors linked with `aria-describedby`
  and `aria-invalid`.
- **Pakistani mobile rule**: strip spaces/dashes → accept `^(?:\+92|0092|0)3\d{9}$`; normalise
  to `+923XXXXXXXXX` for storage, display as `0300 1234567`. Rejects landlines (e.g. `021…`).
- **Alternatives**: Formik (larger, slower); native constraint validation only (weak messaging).

## R7. Item detail: modal + shareable page

- **Decision**: One presentational `ItemDetail` component rendered in two shells:
  1. `ItemModal` — client dialog opened from any card via the UI store; desktop centred dialog
     (photo left / options right), mobile bottom sheet (drag-handle, slides up). Focus trap, Esc,
     backdrop click, scroll lock, focus restore (Principle III). Built on the native `<dialog>`
     element (`showModal()` gives focus containment + Esc + inert background) with motion
     transitions.
  2. `/menu/[slug]` — statically generated page (`generateStaticParams` over all 33 slugs,
     `dynamicParams = false` → unknown slugs hit the branded 404).
  The modal updates the URL with `?item=<slug>` via `history.replaceState`-style shallow update
  so opening an item is shareable/back-button friendly without a route change.
- **Alternatives**: Next intercepting + parallel routes (`@modal/(.)menu/[slug]`) — true URL
  change, but the modal must open from Home, Menu, Favourites and promos; intercepting routes
  complicate that and the layout tree. Rejected for complexity; revisit if SEO needs it.
- 📋 ADR candidate (see plan).

## R8. Pricing, promotions and time zone

- **Decision**: All money is **integer rupees**. Pure functions in `src/lib/pricing.ts`:
  `unitPrice(item, optionId, addonIds)`, `applyPromos(unit, item, now)`,
  `lineTotal`, `cartTotals(lines, now)` → `{ subtotal, discount, delivery, total,
  freeDeliveryRemaining }`. Delivery Rs 150, free when subtotal (after discounts) ≥ 1,500.
- **Wings Wednesday**: promo data `{ type: 'weekday-percent', weekday: 3, percent: 20,
  itemSlugs: ['fire-wings'] }`. Discount = `Math.round(unit * 0.2)` per unit.
- **PKT clock**: Pakistan has no DST → PKT = UTC+5 fixed. `src/lib/time.ts` computes PKT
  weekday/time from `Date.now()` using `Intl.DateTimeFormat('en-GB', { timeZone:
  'Asia/Karachi' })` (with UTC+5 arithmetic fallback), `msUntilNextPktMidnight()`,
  `msUntilNextWednesdayPkt()`, `isOpenNow()` (12:00–03:00 PKT, crossing midnight).
- **Hydration**: countdown and promo-dependent prices render after mount (client component) with
  a stable server placeholder to avoid mismatch.
- **Formatting**: `formatRs(n)` → `Rs 1,190` via `Intl.NumberFormat('en-PK')`, no decimals —
  single source (Principle I).

## R9. Data layer (backend-ready)

- **Decision**: Typed domain models in `src/lib/types.ts`; mock data in `src/lib/data/*.ts`;
  `src/lib/api.ts` exposes `async` functions (`getCategories`, `getMenuItems(filter)`,
  `getMenuItem(slug)`, `getPromos`, `getTestimonials`, `getDeliveryAreas`, `placeOrder`,
  `getOrder`). Components and pages import **only** from `@/lib/api` (enforced by an ESLint
  `no-restricted-imports` rule blocking `@/lib/data/*` outside `src/lib`).
- A `NEXT_PUBLIC_API_BASE_URL` switch is **not** added now (YAGNI); Phase 2 replaces function
  bodies with `fetch` calls against the OpenAPI contract in `contracts/openapi.yaml`.
- **Orders in this phase**: `placeOrder` validates, generates `KBG-` + 6 random digits, stores in
  the persisted orders store, returns the order. Tracker stage is **derived** from `placedAt`
  (Confirmed 0s, Preparing 20s, On the way 60s, Delivered 120s) so refresh is consistent.

## R10. Images

- **Decision**: Copy the 38 photos to `frontend/public/images/` (same names). Every image via
  `next/image` with explicit `sizes`; only the hero image gets `priority` (+ `fetchPriority`),
  all others lazy (default). Descriptive alt text lives in the data layer next to each item.
  `fire-bg.jpg` rendered as a `fill` image with `aria-hidden` overlay, not a CSS background, so
  it is optimised.
- **Unused photos**: `about-customers.jpg` is available for the About page.

## R11. Icons and social links

- **Finding**: lucide-react v1 **removed all brand icons** (Facebook, Instagram, etc.).
- **Decision**: Use lucide for UI icons; add a tiny `SocialIcons` component with inline SVG paths
  for Instagram, Facebook, TikTok and WhatsApp (monochrome, `currentColor`, accessible names).
- **Constitution note**: Principle I bans *other brands' names/logos* to prevent competitor or
  sponsor branding (Coca-Cola, KFC…). Footer social-platform glyphs linking to our own accounts
  are interpreted as permitted navigation icons, requested by the owner in the spec. Recommend a
  PATCH clarification to the constitution (see plan Complexity Tracking).

## R12. Testing strategy

- **Decision**:
  - **Vitest** (node env) for pure logic: pricing, promo/time-zone rules, phone validation,
    cart store line merging and caps, `formatRs`.
  - **Playwright** for P1/P2 journeys (customise → cart → checkout → confirmation; filters;
    reduced-motion) and viewport screenshots at 360/768/1280/1920.
  - **Lighthouse** (Chrome DevTools/CLI) on production build for home and menu, mobile profile.
  - Quality gates: `npm run lint`, `npm run typecheck` (`tsc --noEmit`), `npm run build`.
- **Rationale**: Money and time-zone logic are the highest-risk correctness areas; E2E verifies
  constitution UX rules (no direct add-to-cart, focus handling).
- **Alternatives**: Jest (slower, more config with ESM/TS); Cypress (heavier than Playwright).

## R13. Rendering strategy

- **Decision**: All pages statically generated. Home, About, Contact, Login, Signup — server
  components with client islands (navbar scroll state, hero particles, tabs, countdown,
  modal). Menu page — static shell; filter/search/sort read `useSearchParams` inside a
  `<Suspense>` boundary and filter client-side (33 items; instant). `/menu/[slug]` — SSG.
  Cart, Checkout, Favourites, `/order/[id]` — client components reading persisted stores.
- **Metadata**: per-page `metadata`/`generateMetadata` (title template
  "%s · Karachi Burger & Grill"), Open Graph image from the item photo on `/menu/[slug]`.

All Technical Context unknowns are resolved; no NEEDS CLARIFICATION remain.
