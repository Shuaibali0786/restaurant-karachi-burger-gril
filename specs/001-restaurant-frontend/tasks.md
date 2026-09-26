---
description: "Task list for the Karachi Burger & Grill frontend phase"
---

# Tasks: Karachi Burger & Grill — Customer Website (Frontend Phase)

**Input**: Design documents from `specs/001-restaurant-frontend/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Organization**: The owner asked for 8 phases that can each be checked in the browser. Phases
follow that order; every task inside a feature phase carries the spec user story it serves:

| Label | User story (spec.md) | Priority |
|-------|----------------------|----------|
| US1 | Browse the menu and customise an item into the cart | P1 |
| US2 | Review cart and place a Cash-on-Delivery order | P1 |
| US3 | Home page that sells the brand | P2 |
| US4 | Find something specific fast (search/filter/sort) | P2 |
| US5 | Save favourites | P3 |
| US6 | Learn about and contact the restaurant | P3 |
| US7 | Account screens (UI only) | P3 |

**Tests**: Unit tests (Vitest) cover the money, time-zone and validation logic (plan R12, highest
risk). End-to-end (Playwright) tests are in Phase 8. No other test tasks.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1–US7 as above; Phase 1 and Phase 8 tasks have no story label
- All paths are relative to the repository root `D:\karachi-burger-grill\`

## Rules that apply to every task

- Components import data **only** from `@/lib/api` (never `@/lib/data/*`).
- Colours only through the Tailwind tokens from T007 — no raw hex in components.
- Text on cream uses `ember-700`; buttons on ember/flame use charcoal text (research R2).
- Every image uses `next/image` with `alt` from the data layer and a `sizes` prop.
- Prices only through `formatRs()` → `Rs 1,190`.
- Interactive targets ≥ 44×44 px with a visible `focus-visible` ring.

---

## Phase 1: Setup, design system and site shell

**Purpose**: Next.js app in `/frontend`, photos, tokens, fonts, logo, announcement bar, navbar
(desktop + mobile), footer. Blocks every later phase.

- [X] T001 Scaffold the app from the repo root: `npx create-next-app@latest frontend --ts --tailwind --eslint --app --src-dir --turbopack --import-alias "@/*" --use-npm --disable-git` (accept defaults for any other prompt); then delete the starter SVGs in `frontend/public/` and empty the starter markup in `frontend/src/app/page.tsx`
- [X] T002 Install runtime and dev dependencies in `frontend/`: `npm i motion zustand react-hook-form zod @hookform/resolvers lucide-react` and `npm i -D vitest @playwright/test`; record exact versions in `frontend/package.json`
- [X] T003 Configure `frontend/tsconfig.json` (`"strict": true`, `"noUncheckedIndexedAccess": true`) and add scripts to `frontend/package.json`: `"lint": "eslint ."`, `"typecheck": "tsc --noEmit"`, `"test": "vitest run"`, `"test:e2e": "playwright test"`
- [X] T004 [P] Copy all 38 photos: `Copy-Item assets\images\*.jpg frontend\public\images\` (create the folder first); confirm 38 files with the same names in `frontend/public/images/`
- [X] T005 [P] Add a `no-restricted-imports` rule to `frontend/eslint.config.mjs` that forbids `@/lib/data/*` everywhere except files under `src/lib/` (Constitution IX)
- [X] T006 [P] Configure `frontend/next.config.ts`: `images.formats = ['image/avif','image/webp']`, no remote patterns, `reactStrictMode: true`
- [X] T007 Define design tokens in `frontend/src/app/globals.css` with Tailwind v4 `@theme`: colours `charcoal-950 #0D0A08`, `charcoal-900 #16110E`, `charcoal-800 #221A15`, `ember-500 #FF5A1F`, `ember-600 #E8480F`, `ember-700 #C2410C`, `flame-400 #FFB020`, `cream-50 #FBF5EC`, `cream-100 #F4EADB`, `ink-900 #1E1712`, `ink-600 #5C4F45`; font vars `--font-display/--font-body/--font-script`; radius `--radius-card: 1.25rem`; shadows `--shadow-card` (soft warm) and `--shadow-glow` (0 0 32px ember/40%); keyframes `ember-rise`, `float-y`, `badge-pop`; base `body` = cream bg + ink text; global `:focus-visible` ring (2px flame-400 + offset); `@media (prefers-reduced-motion: reduce)` disabling animations
- [X] T008 Load fonts in `frontend/src/app/fonts.ts` via `next/font/google`: Big Shoulders Display (700, 800, 900), Manrope (variable), Caveat Brush (400), `display: 'swap'`, exposing the three CSS variables from T007. First check the export name — if `Big_Shoulders_Display` does not exist, use `Big_Shoulders` (research R3)
- [X] T009 [P] Create domain types in `frontend/src/lib/types.ts` exactly as in `specs/001-restaurant-frontend/data-model.md` (CategorySlug, Option, OptionGroup, Addon, Category, MenuItem, MenuItemView, Promo, Testimonial, DeliveryArea, CartLine, CartTotals, Order, OrderLine, OrderStatus, MenuQuery, MenuSort)
- [X] T010 [P] Create site facts in `frontend/src/lib/data/site.ts`: name, tagline "Karachi ka asli zaiqa", address "Burns Road, Saddar, Karachi", hours "Open daily 12 noon – 3 AM", phone `+92 300 0000000` and email `hello@karachiburgergrill.pk` (owner placeholders — launch blocker), social URLs for Instagram, Facebook, TikTok, WhatsApp, nav links, footer link groups; expose via `getSiteInfo()` in `frontend/src/lib/api.ts` (create the file)
- [X] T011 [P] Implement `formatRs(n)` (`Intl.NumberFormat('en-PK')`, no decimals, prefix `Rs `) and `formatPhone()` in `frontend/src/lib/format.ts`
- [X] T012 [P] Create `frontend/src/components/ui/Button.tsx`: variants `primary` (ember-500 bg, charcoal text, glow on hover), `secondary` (outline), `ghost`, `dark`; sizes `md`/`lg`; renders `next/link` when `href` given; min height 44 px; optional leading/trailing lucide icon
- [X] T013 [P] Create `frontend/src/components/ui/Badge.tsx` (tag pill: bestseller, hot, new, veg with icon + colour) and `frontend/src/components/ui/SectionHeading.tsx` (optional Caveat Brush eyebrow in ember, Big Shoulders uppercase title, optional right-aligned link; `as` prop for heading level)
- [X] T014 [P] Create `frontend/src/components/ui/Reveal.tsx`: client wrapper using `motion/react` that animates opacity/translateY **on mount** (never on scroll); renders fully visible when reduced motion is on
- [X] T015 [P] Create `frontend/src/components/layout/Logo.tsx`: inline SVG glowing flame-over-coal mark (ember→flame gradient, soft glow filter) + wordmark "KARACHI" (large, Big Shoulders 900) with "BURGER & GRILL" below (tracked, smaller); `tone="light" | "dark"`; wraps in link to `/` with `aria-label="Karachi Burger & Grill — home"`
- [X] T016 [P] Create `frontend/src/components/layout/AnnouncementBar.tsx`: charcoal-950 strip, centred text "Free delivery on orders over Rs 1,500 · Open daily 12 noon – 3 AM" (wraps cleanly at 360 px), flame accent icon
- [X] T017 [P] Create `frontend/src/hooks/useScrolled.ts` (returns true after 24 px scroll, passive listener) and `frontend/src/components/layout/SkipLink.tsx` ("Skip to content" → `#main`)
- [X] T018 [P] Create `frontend/src/components/layout/SocialIcons.tsx`: inline monochrome SVGs (`currentColor`) for Instagram, Facebook, TikTok, WhatsApp with `aria-label`s, links from site data (lucide v1 has no brand icons — research R11)
- [X] T019 Create `frontend/src/components/layout/SearchDialog.tsx`: native `<dialog>` with a search input; submit navigates to `/menu?q=<term>`; Esc closes; focus returns to the trigger
- [X] T020 Create `frontend/src/components/layout/MobileMenu.tsx`: full-height charcoal panel (slides from right) with nav links, "Order Now" button, login link; opens from hamburger, closes on Esc / link click / close button, traps focus, locks body scroll, `aria-expanded` on the trigger
- [X] T021 Create `frontend/src/components/layout/Navbar.tsx` (client): sticky; logo; links Home, Menu, Combos (`/menu?category=combos`), About, Contact with active state; search button (T019), login icon (`/login`), cart icon button with a count bubble (reads `0` until Phase 4), "Order Now" button (`/menu`); transparent over the home hero and solid charcoal with shadow once `useScrolled()` is true or on any non-home route; below `lg` shows hamburger (T020)
- [X] T022 Create `frontend/src/components/layout/Footer.tsx`: charcoal-950 background; logo + tagline + one-line story; Quick Links (Home, Menu, Combos, About, Contact); Support (FAQ, Track Order, Privacy, Terms → `/coming-soon`); Contact (address, hours, phone, email with lucide icons); newsletter email field + "Subscribe" button (static for now, wired in T090); SocialIcons; bottom bar "© 2026 Karachi Burger & Grill · Karachi ka asli zaiqa"
- [X] T023 Create `frontend/src/app/providers.tsx` (client: `MotionConfig reducedMotion="user"`) and rewrite `frontend/src/app/layout.tsx`: `<html lang="en">` with font variables, `metadata` (title template `%s · Karachi Burger & Grill`, default title, description), `<body>` with SkipLink, AnnouncementBar, Navbar, `<main id="main">`, Footer, all inside Providers
- [X] T024 Replace `frontend/src/app/page.tsx` with a temporary charcoal band containing the Logo and tagline so the shell can be checked (fully replaced in Phase 2)

**✅ Phase 1 checkpoint — run:**

```powershell
cd frontend
npm run dev
```

**At http://localhost:3000 you should see:** the dark announcement bar with the free-delivery
text; the navbar with the flame logo ("KARACHI" / "BURGER & GRILL"), five links, search, login
and cart icons and an ember "Order Now" button; the rich dark footer with four columns, newsletter
field and social icons. Scrolling makes the navbar solid. At 360 px wide (DevTools device
toolbar) the links collapse into a hamburger that opens a full-height menu and closes with Esc.
Big Shoulders headings, Manrope body text. Menu/Login links 404 for now — that is expected.

---

## Phase 2: Home page, part 1 — Hero, Features, Categories, Most Loved (US3)

**Goal**: The top half of the home page, driven by the real data layer.
**Independent test**: Home shows hero, features, 8 category chips and Most Loved tabs with real
items, photos and prices.

### Data layer (used by every later phase)

- [X] T025 [P] [US3] Create option groups in `frontend/src/lib/data/options.ts` (Burgers: Single +0 / Double +300 / Meal +350; Wraps: Regular / Large +150 / Meal +300; Fried Chicken: Regular / Double / Family Pack; Sandwiches: Regular / Large +250 / Meal +300; BBQ: Single / Double / Family Pack; Bowls: Regular / Large +200; Sides & Drinks: Regular / Large +120; Combos: Regular only) per the spec Menu Catalogue
- [X] T026 [P] [US3] Create add-ons in `frontend/src/lib/data/extras.ts` (Burgers: Extra cheese 100, Jalapeños 50, Extra patty 300, Chipotle sauce 50; Wraps: Extra cheese 100, Jalapeños 50; Fried Chicken: Extra dip 80, Coleslaw 150; Sandwiches: Extra cheese 100, Fries on the side 150; BBQ: Extra naan 60, Raita 80; Bowls: Extra chicken 250, Avocado 200; Sides & Drinks and Combos: none)
- [X] T027 [P] [US3] Create the 8 categories in `frontend/src/lib/data/categories.ts` with names, order, chip photo and alt text (chip photos per data-model.md) linking option groups and add-ons from T025/T026
- [X] T028 [P] [US3] Create all 33 items in `frontend/src/lib/data/menu-items.ts` copying name, base price, photo file, tag and description **verbatim** from the spec Menu Catalogue; add slug, descriptive `imageAlt`, `rating` (4.5–4.9), `popularity` (bestsellers first, then hot, then catalogue order), `optionOverrides` for the 7 Fried Chicken/BBQ items from the spec size-pricing table, and `featured`: `most-loved` on 2 items per category (bestseller/hot first), `chef-special` on grill-mix-platter, grand-combo, loaded-fire-fries
- [X] T029 [P] [US3] Create `frontend/src/lib/data/promos.ts` (burger-combo: price 1490, wasPrice 1830, itemSlug grand-combo, image grand-combo; wings-wednesday: weekday-percent, weekday 3, percent 20, itemSlug fire-wings, image chicken-wings), `frontend/src/lib/data/testimonials.ts` (6 entries, Karachi first names + initial and areas, ≤ 180-char quotes, `isSample: true`) and `frontend/src/lib/data/areas.ts` (6 delivery areas)
- [X] T030 [US3] Implement catalogue functions in `frontend/src/lib/api.ts` per `contracts/frontend-api.md`: `getCategories`, `getMenuItems(query)` (filter, case-insensitive search on name/description/category name, sort popular/price-asc/price-desc), `getMenuItem(slug)` (null if unknown), `getMenuSlugs`, `getFeaturedItems`, `getPromos`, `getTestimonials`, `getDeliveryAreas`; `MenuItemView` resolves options (with overrides) and add-ons from the category

### Client state needed by cards

- [X] T031 [P] [US3] Create `frontend/src/stores/storage.ts`: `createJSONStorage` wrapper around localStorage with try/catch and in-memory fallback (spec edge case: storage blocked)
- [X] T032 [P] [US3] Create `frontend/src/stores/ui.ts` (not persisted): `activeItemSlug`, `openItem(slug)`, `closeItem()`, `cartOpen`, `openCart()`, `closeCart()`, `cartIconRef` setter
- [X] T033 [US3] Create `frontend/src/stores/favourites.ts` (persist key `kbg-favourites-v1`, `skipHydration: true`, `toggle(slug)`, `has(slug)`, drops unknown slugs on merge), `useHydrated()` in `frontend/src/stores/hydration.ts`, and a `StoreHydrator` client component in `frontend/src/app/providers.tsx` that rehydrates persisted stores in `useEffect`

### Components

- [X] T034 [P] [US3] Create `frontend/src/components/ui/Rating.tsx` (5 stars with partial fill + numeric value, `aria-label="Rated 4.8 out of 5"`, no review count) and `frontend/src/components/ui/Price.tsx` (uses `formatRs`; optional struck-through `wasPrice`; `from` prefix option)
- [X] T035 [P] [US3] Create `frontend/src/components/menu/FavouriteButton.tsx`: heart toggle using the favourites store, `aria-pressed`, label "Add to favourites" / "Remove from favourites", renders unfilled until hydrated
- [X] T036 [US3] Create `frontend/src/components/menu/ProductCard.tsx`: rounded card (cream-50 on light sections), 4:3 photo with hover zoom, Badge top-left, FavouriteButton top-right, name, one-line description (2-line clamp), Rating, "from" Price, "Add +" button; card hover lifts with ember glow; clicking the card or "Add +" calls `openItem(slug)` (modal arrives in Phase 4) — it must **never** add to cart
- [X] T037 [P] [US3] Create `frontend/src/components/home/EmberParticles.tsx`: ~18 `aria-hidden` spans with randomised (seeded, SSR-stable) left/size/delay using the `ember-rise` CSS keyframe; renders nothing under reduced motion
- [X] T038 [US3] Create `frontend/src/components/home/Hero.tsx` following `assets/design-reference.png`: charcoal-950 → charcoal-900 radial warm background; left column — Caveat Brush "It's not just food —" above Big Shoulders headline "it's Karachi's fire!" (with ember/flame accent word), subline "Fresh ingredients. Bold flavours. Unforgettable taste.", buttons "Order Online" (primary, bike icon → `/menu`) and "View Menu" (secondary → `/menu`); right column — `grand-combo.jpg` via `next/image` with `preload` (Next 16 replaces the deprecated `priority`) and warm ember glow behind it, EmberParticles, floating badges ("25–30 min delivery", "Made fresh, every order", "Freshly made" with hand-drawn SVG arrow) using the `float-y` keyframe, and a dark card "Loved across Karachi" (revised 2026-09-26: no invented numbers); stacks to one column on mobile with the photo first-visible
- [X] T039 [P] [US3] Create `frontend/src/components/home/Features.tsx`: white/cream card overlapping the hero bottom edge, 4 items (Fresh Ingredients / "Sourced fresh every morning", 100% Halal / "Certified halal, always", 30 Min Delivery / "Hot at your door across Karachi", Easy Online Ordering / "Order in a few taps") with lucide icons in ember circles; 2×2 on mobile, 4 across on desktop
- [X] T040 [P] [US3] Create `frontend/src/components/home/Categories.tsx`: SectionHeading (eyebrow "Craving something?", title "Explore the menu"); 8 round photo chips from `getCategories()` with names, each a link to `/menu?category=<slug>`; horizontal scroll-snap row on mobile, 8-across grid on desktop; hover ring in ember
- [X] T041 [US3] Create `frontend/src/components/home/MostLoved.tsx` (client island receives items from server parent): SectionHeading (eyebrow "Our signature", title "Most Loved Items", link "View full menu →" to `/menu`); tab list "All" + categories that have most-loved items (proper `role="tablist"` with arrow-key navigation); grid of ProductCards (1 col 360 px, 2 col 640 px, 3 col 1024 px, 5 col ≥ 1280 px)
- [X] T042 [US3] Compose `frontend/src/app/page.tsx` (server component, fetches via `@/lib/api`): Hero, Features, Categories, MostLoved on alternating charcoal/cream bands; set home `metadata` title "Karachi ka asli zaiqa"

**✅ Phase 2 checkpoint — run:**

```powershell
cd frontend
npm run dev
```

**At http://localhost:3000 you should see:** a dark, warm hero with the "It's not just food —
it's Karachi's fire!" headline, the Grand Combo photo glowing with slowly rising embers, three
gently floating badges and the "Loved across Karachi" card; the four-item features strip; eight
round category photos (clicking one goes to `/menu?category=…`, which 404s until Phase 4); and
"Most Loved Items" with working tabs and cards showing photo, tag, heart, name, description,
stars and `from Rs 690`-style prices. Hearts toggle and stay after refresh. "Add +" does nothing
yet (the item modal arrives in Phase 4) — it must not add anything to the cart.

---

## Phase 3: Home page, part 2 — Promos, Chef's specials, About, Testimonials, CTA (US3)

**Goal**: Complete the home page.
**Independent test**: All remaining home sections render with real content; the countdown ticks
in Pakistan time.

- [X] T043 [P] [US3] Implement `frontend/src/lib/time.ts`: `nowPkt()` parts (weekday, hours, minutes) via `Intl.DateTimeFormat` with `timeZone: 'Asia/Karachi'` (UTC+5 fallback), `msUntilNextPktMidnight(now)`, `msUntilNextWednesdayPkt(now)`, `isWednesdayPkt(now)`, `isOpenNow(now)` (open 12:00 → 03:00 PKT across midnight)
- [X] T044 [P] [US3] Vitest config already created in Phase 2 as `frontend/vitest.config.mts` (with `tests/unit/catalogue.test.ts`); add (node env, `@` alias) and tests `frontend/tests/unit/time.test.ts`: Wednesday detection for a UTC time that is still Tuesday elsewhere, midnight rollover, next-Wednesday from Thursday, open/closed at 11:59, 12:00, 02:59, 03:00 PKT
- [X] T045 [US3] Create `frontend/src/hooks/useNow.ts` (hydration-safe ticking clock; replaces the planned useCountdown and also serves T066) and `WingsCountdown` in `frontend/src/components/ui/Countdown.tsx` (client; HH:MM:SS boxes, "Ends in" on Wednesdays PKT / "Starts in" otherwise, `aria-live="off"` with a static `aria-label` summary; renders stable placeholder `--:--:--` until mounted to avoid hydration mismatch)
- [X] T046 [US3] Create `frontend/src/components/home/PromoBanners.tsx`: two banners side by side (stacked on mobile) — flame-400 banner "Burger Combo — Big taste. Bigger savings!" with struck `Rs 1,830` and bold `Rs 1,490`, grand-combo photo, "Order combo →" button; charcoal banner "Wings Wednesday" with "20% off wings", chicken-wings photo, Countdown, "Grab the deal →" button; both buttons call `openItem('grand-combo' | 'fire-wings')`
- [X] T047 [P] [US3] Create `frontend/src/components/home/ChefSpecials.tsx`: SectionHeading (eyebrow "Chef's specials", title "Fresh off the coals"); bento grid — Grill Mix Platter as the large tile (spans 2 rows on desktop), Grand Combo and Loaded Fire Fries as smaller tiles; photo with dark gradient overlay, name, one-line description, price, "Add +" → `openItem`; single column on mobile
- [X] T048 [P] [US3] Create `frontend/src/components/home/AboutTeaser.tsx`: cream band; collage of `about-chef.jpg`, `about-restaurant.jpg`, `about-street.jpg`; Caveat accent "Pure happiness!"; heading "Born on Burns Road"; 2–3 sentence story (Burns Road roots, charcoal grill craft, halal ingredients, open till 3 AM); 4 value ticks (Made with love, Premium quality, Charcoal-grilled, Always fresh); "Our Story" button → `/about`
- [X] T049 [P] [US3] Create `frontend/src/components/home/Testimonials.tsx`: SectionHeading "What Karachi says" with a visible pill label **"Sample reviews"** (rendered whenever any testimonial `isSample`) plus a one-line note "Real reviews coming soon"; 3-up cards (scroll-snap on mobile) with stars, quote, name and area, initials avatar (no stock faces)
- [X] T050 [P] [US3] Create `frontend/src/components/home/FinalCta.tsx`: full-width band with `fire-bg.jpg` (`next/image fill`, lazy) under a dark gradient, Big Shoulders "Taste the fire", subline "Hot, fresh and at your door in 30 minutes.", "Order Now" primary button → `/menu`
- [X] T051 [US3] Add PromoBanners, ChefSpecials, AboutTeaser, Testimonials and FinalCta to `frontend/src/app/page.tsx` in that order after MostLoved, alternating cream/charcoal bands as in the reference

**✅ Phase 3 checkpoint — run:**

```powershell
cd frontend
npm test
npm run dev
```

**`npm test` should show:** all `time.test.ts` tests passing.
**At http://localhost:3000 you should see** (scroll below Most Loved): the gold Burger Combo
banner with ~~Rs 1,830~~ **Rs 1,490** next to the dark Wings Wednesday banner whose countdown
ticks every second ("Ends in" on a Wednesday in Pakistan, otherwise "Starts in"); the Chef's
specials bento with the big Grill Mix Platter tile; the Burns Road about teaser with three photos
and an "Our Story" button; three testimonials under a clear "Sample reviews" label; the fiery
"Taste the fire" band; then the footer. The home page is now complete top to bottom.

---

## Phase 4: Menu page, item detail modal and /menu/[slug] (US4, US1)

**Goal**: Browse/search/filter/sort the full menu; every item opens the customisation view; items
can be added to the cart (count updates in the navbar).
**Independent test**: Search "tikka" → filter BBQ → sort high→low; open an item, choose Double +
Extra cheese, qty 2 → button reads `Rs 2,180 | Add to cart →` → navbar count shows 2.

### Menu page (US4)

- [X] T052 [P] [US4] Create `frontend/src/components/ui/EmptyState.tsx` (icon, title, text, action button)
- [X] T053 [US4] Create `frontend/src/components/menu/Filters.tsx` (client): search input (debounced 200 ms, clear button, label "Search the menu"), category chips "All" + 8 categories (radio-group semantics), sort `<select>` (Popular, Price: low to high, Price: high to low); reads and writes `?q=`, `?category=`, `?sort=` with `router.replace` (no scroll jump)
- [X] T054 [US4] Create `frontend/src/components/menu/MenuGrid.tsx` (client): applies the same filter/search/sort rules as `getMenuItems` to the item list passed in; shows result count ("12 items"), ProductCard grid (1/2/3/4 columns at 360/640/1024/1280 px), and EmptyState "No matches for “xyz”" with a "Clear filters" button
- [X] T055 [US4] Create `frontend/src/app/menu/page.tsx`: charcoal page header "Our Menu" with tagline; server-fetch all items and categories via `@/lib/api`; render Filters + MenuGrid inside `<Suspense>` (required for `useSearchParams`); `metadata` title "Menu"

### Item detail (US1)

- [X] T056 [P] [US1] Implement `unitPrice(item, optionId, addonIds)` and `lineTotal(unit, qty)` in `frontend/src/lib/pricing.ts` (integer rupees; throws on unknown option/add-on)
- [X] T057 [P] [US1] Create `frontend/src/components/ui/QuantityStepper.tsx`: − / value / + buttons (44 px), min 1 max 20; at 1 the minus shows a trash icon with `aria-label="Remove"` and calls `onRemove`; `aria-live="polite"` value
- [X] T058 [US1] Create `frontend/src/stores/cart.ts` (persist key `kbg-cart-v1`, `skipHydration: true`, safe storage): `lines`, `add({ itemSlug, optionId, addonIds, note, quantity })` merging by line key `slug|optionId|sortedAddonIds|trimmedNote` with quantity capped at 20, `count()` selector; register in StoreHydrator; show the hydrated count in the Navbar cart bubble (T021)
- [X] T059 [US1] Create `frontend/src/components/menu/ItemDetail.tsx` (client, shared by modal and page): photo, Badge, name, Rating, description, live price; fieldset "Choose an option" (Required pill, radio cards with `+Rs 300` deltas, none preselected); fieldset "Make it extra" (checkbox rows with prices; hidden when no add-ons); "Special instructions" textarea (maxLength 500, live "123/500" counter, paste capped); QuantityStepper; sticky footer button `Rs X | Add to cart →` where X = `lineTotal(unitPrice(...), qty)` — disabled with hint "Choose an option to continue" until an option is chosen; on add calls cart `add()` then `onAdded()`; trash at qty 1 calls `onCancel()`
- [X] T060 [US1] Create `frontend/src/components/menu/ItemModal.tsx` (client, mounted once in `layout.tsx` inside Suspense): driven by `?item=<slug>` (pushState on open, so Back closes it); native `<dialog>` with `showModal()` (focus containment, Esc, inert background); desktop ≥ 768 px centred two-column (photo left, options right, max-h 90vh scroll on right); mobile bottom sheet sliding up with drag handle and rounded top; backdrop click and close button close it; restores focus to the opener; body scroll lock; syncs `?item=<slug>` in the URL (open on load if present, remove on close); motion enter/exit respecting reduced motion
- [X] T061 [US1] Create `frontend/src/app/menu/[slug]/page.tsx`: `generateStaticParams` from `getMenuSlugs()`, `export const dynamicParams = false`, `await params` (Next 16), `notFound()` when missing; breadcrumb (Menu › Category › Item); ItemDetail in page layout (photo left / details right on desktop); on add shows an inline "Added to cart" confirmation; `generateMetadata` with item name, description and Open Graph image from the item photo

**✅ Phase 4 checkpoint — run:**

```powershell
cd frontend
npm run dev
```

**At http://localhost:3000/menu you should see:** a dark "Our Menu" header, search box, 9
category chips and a sort menu above a grid of all 33 items. Typing "tikka" narrows the grid,
tapping "BBQ" and choosing "Price: high to low" re-orders it, and the URL updates (e.g.
`/menu?q=tikka&category=bbq&sort=price-desc`). Clicking any card or "Add +" (also on the home
page and promo banners) opens the item modal — side-by-side on desktop, a bottom sheet at 360 px.
The add button stays disabled until you pick an option; Burns Road Zinger + Double + Extra cheese
× 2 reads **Rs 2,180 | Add to cart →**; adding closes the modal and the navbar cart count shows 2.
http://localhost:3000/menu/burns-road-zinger shows the same item as a full page;
`/menu/nope` shows a 404.

---

## Phase 5: Cart drawer, /cart page and pricing rules (US2, US1)

**Goal**: Full cart with correct totals, Wings Wednesday, delivery fee, fly-to-cart feedback.
**Independent test**: Add items, open drawer, change quantities, remove a line, refresh — totals
and delivery nudge are correct and the cart persists.

- [X] T062 [US2] Extend `frontend/src/lib/pricing.ts`: `promoDiscountPerUnit(item, unit, now)` (20 % rounded to nearest rupee on `fire-wings` when `isWednesdayPkt(now)`), `cartTotals(lines, catalogue, now)` → `{ subtotal, discount, delivery, total, freeDeliveryRemaining }` with delivery Rs 150, free when `subtotal − discount ≥ 1500`
- [X] T063 [P] [US2] Write `frontend/tests/unit/pricing.test.ts`: Zinger Double + Extra cheese × 2 = 2,180; Crispy Bucket Family Pack = 4,770; Fire Wings Double on a Wednesday PKT = 1,690 − 338 = 1,352 and full price on Thursday; subtotal 1,190 → delivery 150, total 1,340, remaining 310; subtotal 1,500 → delivery 0; unknown option throws
- [X] T064 [P] [US2] Write `frontend/tests/unit/format.test.ts` (`formatRs(1190)` = "Rs 1,190", 0, 150, 7330) and `frontend/tests/unit/cart-store.test.ts` (identical config merges, different note makes new line, cap 20, `setQuantity(0)` removes, invalid/unknown lines dropped on merge)
- [X] T065 [US2] Complete `frontend/src/stores/cart.ts`: `setQuantity(key, n)` (n < 1 removes), `remove(key)`, `clear()`, `merge`/`migrate` dropping lines whose slug/option/add-ons no longer exist in the catalogue (spec edge case)
- [X] T066 [P] [US2] Reuse `frontend/src/hooks/useNow.ts` (created in Phase 3) with a 30 s interval (client time source updated every 30 s so promo/opening-hours UI re-evaluates across midnight)
- [X] T067 [US2] Create `frontend/src/components/cart/CartLine.tsx`: thumbnail, name, option label, add-on labels, note (italic, truncated with full text in `title`), unit price (with struck original when Wings Wednesday applies), QuantityStepper (trash at 1 removes), line total, remove button with `aria-label="Remove Burns Road Zinger"`
- [X] T068 [US2] Create `frontend/src/components/cart/CartSummary.tsx`: subtotal, "Wings Wednesday −Rs X" line when discount > 0, delivery ("Free" or `Rs 150`), total; progress bar + "Add Rs 310 more for free delivery" when below threshold; "We're closed right now — orders open at 12 noon" note when `!isOpenNow`; "Wings Wednesday has ended" notice when a wings line lost its discount since being added; "Checkout" button → `/checkout`
- [X] T069 [US2] Create `frontend/src/components/cart/CartDrawer.tsx` (client, mounted in `layout.tsx`): right-side slide-in panel (full width on mobile) using `<dialog>`; header "Your order (n)"; list of CartLines; CartSummary; "View full cart" link → `/cart`; EmptyState "Your cart is empty" + "Browse menu"; Esc/backdrop/close button close it; focus restore
- [X] T070 [US2] Create `frontend/src/components/cart/CartButton.tsx` and use it in the Navbar: opens the drawer, registers `cartIconRef` in the UI store, shows hydrated count, bounces (`badge-pop` / motion spring keyed on count) when count increases
- [X] T071 [US1] Create `frontend/src/components/cart/FlyToCart.tsx` (mounted in `layout.tsx`): on `add`, clones the item image from the source rect to the cart icon rect along a curved motion path (scale → 0.2, fade), ~600 ms; skipped entirely under reduced motion; wire the trigger into ItemDetail's add handler (T059)
- [X] T072 [US2] Create `frontend/src/app/cart/page.tsx`: "Your cart" heading, CartLines list and sticky CartSummary side panel on desktop / below on mobile, "Continue shopping" link, EmptyState when empty; `metadata` title "Cart"
- [X] T073 [US1] Show Wings Wednesday pricing on items: `Price` with struck `wasPrice` and a "Wings Wednesday −20%" badge on the Fire Wings ProductCard and in ItemDetail's live price when `isWednesdayPkt(useNow())`

**✅ Phase 5 checkpoint — run:**

```powershell
cd frontend
npm test
npm run dev
```

**`npm test` should show:** time, pricing, format and cart-store tests all passing.
**At http://localhost:3000 you should see:** adding an item sends its photo flying into the cart
icon and the count bounces. Clicking the cart opens a drawer from the right listing each line with
option, extras, note, unit price, stepper and remove. With one Double Trouble Cheese (Rs 1,190)
the summary shows delivery **Rs 150**, total **Rs 1,340** and "Add Rs 310 more for free delivery";
at Rs 1,500 or more delivery shows **Free**. "View full cart" opens http://localhost:3000/cart
with the same controls. Refreshing keeps the cart. On a Wednesday (Pakistan time) Fire Wings shows
a struck-through price and the cart shows a "Wings Wednesday" discount line.

---

## Phase 6: Checkout, order confirmation and mock tracker (US2)

**Goal**: Place a Cash-on-Delivery order and follow it.
**Independent test**: Submit empty (errors + focus), then valid → `KBG-XXXXXX` confirmation,
tracker advances, cart empty.

- [X] T074 [P] [US2] Create Zod schemas in `frontend/src/lib/validation.ts`: `pkMobile` (strip spaces/dashes, `^(?:\+92|0092|0)3\d{9}$`, transform to `+923XXXXXXXXX`), `checkoutSchema` (name 2–60, phone, area enum, address 10–200, notes ≤ 200 optional, payment literal `cod`), `contactSchema`, `loginSchema`, `signupSchema` (confirm matches), `newsletterSchema` — with friendly messages, e.g. "Enter a Pakistani mobile number like 0300 1234567"
- [X] T075 [P] [US2] Write `frontend/tests/unit/validation.test.ts`: accepts `03001234567`, `0300-1234567`, `+923001234567`, `0092 300 1234567`; rejects `02112345678`, `0300123456`, `+9230012345678`; checkout rejects short address and missing area
- [X] T076 [US2] (Implemented as `frontend/src/lib/local-orders.ts`, a device-local stand-in for the backend behind `lib/api.ts`, rather than) `frontend/src/stores/orders.ts` (persist key `kbg-orders-v1`, `skipHydration`): `save(order)`, `get(id)`; register in StoreHydrator
- [X] T077 [US2] Implement `placeOrder(input)` and `getOrder(id)` in `frontend/src/lib/api.ts` per `contracts/frontend-api.md`: validate with `checkoutSchema`, throw `ApiError` codes `EMPTY_CART` / `UNKNOWN_ITEM` / `INVALID_OPTION` / `VALIDATION_FAILED`, recompute every price from the catalogue with `cartTotals(…, new Date())`, snapshot order lines, generate unique `KBG-` + 6 digits, save to the orders store, return the order; also add `orderStatus(order, now)` in `frontend/src/lib/orders.ts` (confirmed 0 s, preparing 20 s, on-the-way 60 s, delivered 120 s)
- [X] T078 [P] [US2] Create `frontend/src/components/forms/Field.tsx`: label, input/select/textarea slot, hint, error text linked via `aria-describedby`, `aria-invalid`, required marker
- [X] T079 [US2] Create `frontend/src/components/checkout/OrderSummary.tsx`: compact line list (name × qty, option/add-ons, line total) + totals using `cartTotals`; reused on checkout and confirmation (accepts snapshot lines)
- [X] T080 [US2] Create `frontend/src/components/checkout/CheckoutForm.tsx` (React Hook Form + `zodResolver(checkoutSchema)`, `shouldFocusError`): sections "Your details" (name, phone with `inputMode="tel"`), "Delivery" (area select with the 6 areas, full address, delivery notes), "Payment" (radio cards: Cash on Delivery selected; Card disabled with "Coming soon" pill); "Place order · Rs X" button disabled while submitting (prevents duplicates); on success clears cart and `router.push('/order/<id>')`; shows a form-level error on `ApiError`
- [X] T081 [US2] Create `frontend/src/app/checkout/page.tsx` (client after hydration): two columns on desktop (form left, sticky OrderSummary right), stacked on mobile; EmptyState with "Browse menu" when cart empty; `metadata` title "Checkout"
- [X] T082 [US2] Create `frontend/src/components/checkout/OrderTracker.tsx`: 4 steps Confirmed → Preparing → On the way → Delivered with lucide icons, completed/active/pending styles, animated progress line (static under reduced motion), `aria-current="step"`, re-evaluates every second from `placedAt`; note "Demo tracker — live tracking coming soon"
- [X] T083 [US2] Create `frontend/src/app/order/[id]/page.tsx` (client): reads `getOrder(id)` after hydration; success header "Shukriya! Your order is confirmed" with order number `KBG-XXXXXX` (copy button), estimated delivery "25–30 min", OrderTracker, delivery address/area/phone, payment "Cash on Delivery", OrderSummary; "Order again" → `/menu`; not-found state if the id is unknown on this device

**✅ Phase 6 checkpoint — run:**

```powershell
cd frontend
npm test
npm run dev
```

**`npm test` should show:** validation tests passing along with all earlier tests.
**At http://localhost:3000/checkout you should see** (with items in the cart): your details,
delivery and payment sections beside the order summary. Clicking "Place order" empty shows red
messages under each field and moves focus to Name. Card payment is greyed out with "Coming
soon". Entering `0300-1234567`, area Clifton, a full address and Cash on Delivery then "Place
order" takes you to `/order/KBG-123456`-style page: "Shukriya! Your order is confirmed", the
order number, and a tracker moving from Confirmed to Preparing (~20 s), On the way (~1 min) and
Delivered (~2 min). The cart badge is now empty; refreshing the confirmation page keeps it.

---

## Phase 7: Favourites, Login, Signup, About, Contact, coming-soon and 404 (US5, US6, US7, US1)

**Goal**: Every remaining route is finished and on-brand.
**Independent test**: Visit each route; forms validate and show their success/"coming soon" states.

- [X] T084 [P] [US5] Create `frontend/src/app/favourites/page.tsx` (client after hydration): heading "Your favourites", ProductCard grid of hearted items (via `getMenuItems` + favourites store), un-hearting removes the card, EmptyState "No favourites yet" with heart icon and "Browse menu"; `metadata` title "Favourites"; add a heart link to favourites in the Navbar and MobileMenu
- [X] T085 [P] [US7] Create `frontend/src/components/forms/AuthForm.tsx` (mode `login` | `signup`, RHF + Zod; show/hide password toggle with `aria-pressed`; on valid submit calls `login`/`signup` in `frontend/src/lib/api.ts` which resolve `{ status: 'coming-soon' }`, then shows notice "Accounts are coming soon — you can order as a guest" with "Browse menu" button; nothing stored)
- [X] T086 [US7] Create `frontend/src/app/login/page.tsx` and `frontend/src/app/signup/page.tsx`: split layout — form card on cream beside a charcoal panel with a food photo (`smash-burger.jpg` / `fried-chicken.jpg`) and brand line; links between the two pages; `metadata` titles
- [X] T087 [P] [US6] Create `frontend/src/app/about/page.tsx`: charcoal hero "Our Story" with `about-street.jpg`; sections "From Burns Road with fire" (origins), "The grill is our kitchen" (`about-chef.jpg`, charcoal craft), "Halal. Fresh. Every day." (values grid), "A table for everyone" (`about-restaurant.jpg`, `about-customers.jpg`); CTA to menu; `metadata` title "About"
- [X] T088 [P] [US6] Create `frontend/src/components/forms/ContactForm.tsx` (RHF + `contactSchema`: name, phone or email (at least one), message 10–1000; on valid calls `sendContactMessage` → success panel "Thanks! We'll get back to you soon."; nothing is sent)
- [X] T089 [US6] Create `frontend/src/app/contact/page.tsx`: header "Get in touch"; ContactForm; info cards (address Burns Road, Saddar, Karachi; phone; email); opening-hours table Monday–Sunday "12:00 PM – 3:00 AM" with today's row highlighted (PKT) and live "Open now"/"Closed" pill; `metadata` title "Contact"
- [X] T090 [P] [US6] Create `frontend/src/components/forms/NewsletterForm.tsx` (email + `newsletterSchema`, calls `subscribeNewsletter`, inline success "You're on the list!") and use it in the Footer (replace the static field from T022)
- [X] T091 [P] [US6] (Superseded at owner request: real `/faq`, `/privacy`, `/terms` and `/track` pages replace the planned `/coming-soon` page; Combos nav now opens `/combos`)
- [X] T092 [P] [US1] Create `frontend/src/app/not-found.tsx`: charcoal page with a large ember "404", Big Shoulders "This grill's gone cold", Caveat accent "Wrong turn on Burns Road?", buttons Home and Menu

**✅ Phase 7 checkpoint — run:**

```powershell
cd frontend
npm run dev
```

**At http://localhost:3000 you should see:** `/favourites` lists hearted items (or a friendly
empty state); `/login` and `/signup` show validated forms — submitting valid details shows
"Accounts are coming soon — you can order as a guest"; `/about` tells the Burns Road story with
four photos; `/contact` has a validated form with a thank-you message and the opening-hours table
with an "Open now"/"Closed" pill; footer Support links open `/coming-soon`; the newsletter shows
"You're on the list!"; any unknown URL (e.g. `/xyz`) shows the branded "This grill's gone cold"
404. Every navbar and footer link now works.

---

## Phase 8: Polish — animation, responsive, accessibility, SEO, build, journey log

**Purpose**: Meet every constitution quality gate and document the phase.

- [ ] T093 Apply `Reveal` page-load animations to page headers and section headings on all pages (mount only, staggered ≤ 0.4 s); add card hover lift + image zoom consistency; verify floating badges, embers, fly-to-cart and badge bounce all switch off with OS "Reduce motion" and no content is ever hidden (Constitution IV)
- [ ] T094 Responsive pass at 360, 768, 1280 and 1920 px on every route: no horizontal scroll, no clipped/overlapping text, hero and bento layouts balanced at 1920 (max content width ~1280–1440 px), touch targets ≥ 44 px; fix issues in the affected components
- [ ] T095 Accessibility pass: one `h1` per page and ordered headings; landmarks (`header`, `nav` with `aria-label`, `main`, `footer`); every `next/image` has meaningful alt (decorative ones `alt=""`); visible focus on every control; keyboard-only run of Story 1 and Story 2 (open modal, pick option, add, open drawer, checkout) with focus returning to the opener; check contrast of all text/background token pairs against AA (fix with `ember-700` / charcoal text per research R2)
- [ ] T096 [P] SEO: per-route `metadata` descriptions; Open Graph/Twitter defaults in `frontend/src/app/layout.tsx` using `grand-combo.jpg`; `frontend/src/app/sitemap.ts` (static routes + all 33 `/menu/<slug>`), `frontend/src/app/robots.ts`, `frontend/src/app/icon.svg` (flame mark from Logo); Restaurant JSON-LD (name, address, opening hours, servesCuisine, priceRange) on the home page
- [ ] T097 [P] Brand/honesty scan: search `frontend/src` for other brand names (`coca`, `kfc`, `burgerbyte`, `pepsi`, `mcdonald`), `lorem`, `TODO`, `placeholder` text and raw hex colours in components; fix any hits (site placeholders in `site.ts` are the only allowed exception)
- [ ] T098 [P] Add Playwright config `frontend/playwright.config.ts` (webServer `npm run start`, projects for 360×800, 768×1024, 1280×800, 1920×1080) and tests `frontend/tests/e2e/order-flow.spec.ts` (modal gating → add → drawer totals → checkout errors → confirmation), `frontend/tests/e2e/menu.spec.ts` (search/filter/sort/URL + 404 slug), `frontend/tests/e2e/a11y-keyboard.spec.ts` (keyboard-only add-to-cart, focus restore, reduced motion shows all content), `frontend/tests/e2e/viewports.spec.ts` (full-page screenshots of `/`, `/menu`, `/cart`, `/checkout` into `frontend/tests/e2e/__screenshots__/`, asserting no horizontal overflow)
- [ ] T099 Run Lighthouse (mobile) on the production build for `/` and `/menu`; fix until Performance ≥ 90 and Accessibility ≥ 90 (typical fixes: hero image `sizes`, reduce particle count, defer non-critical client islands); record the scores
- [ ] T100 Quality gates: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` all pass with **zero errors**; fix anything that fails
- [ ] T101 Create `docs/PROJECT-JOURNEY.md` with the Phase 1 (Frontend) entry: date, what was built (routes, features), technologies and why (from plan/research), problems faced and solutions (e.g. AA contrast of ember on cream, lucide brand icons removed, hydration of persisted stores, PKT time zone, Next 16 async params), Lighthouse scores, launch blockers (real phone/email), and a "Screenshots" placeholder section referencing the Playwright screenshots
- [ ] T102 Run the full manual walkthrough in `specs/001-restaurant-frontend/quickstart.md` and tick the Development Workflow checklist from the constitution; update `quickstart.md` if any command changed

**✅ Phase 8 checkpoint — run:**

```powershell
cd frontend
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run start
```

**You should see:** lint, typecheck, unit tests and build finish with **0 errors**; Playwright
reports all end-to-end tests passing and screenshots saved for four screen sizes. At
**http://localhost:3000** (production server) the whole site behaves as in Phases 1–7 but faster,
with smooth page-load reveals; with "Reduce motion" turned on in Windows (Settings → Accessibility
→ Visual effects → Animation effects: Off) embers and floating badges disappear and all content is
still visible. Lighthouse (DevTools → Lighthouse → Mobile) shows **90+** for Performance and
Accessibility on `/` and `/menu`. `docs/PROJECT-JOURNEY.md` contains the frontend phase entry.
The frontend is ready for owner approval before Phase 2 (backend).

---

## Dependencies & Execution Order

### Phase dependencies

```text
Phase 1 (setup/shell)
   └─▶ Phase 2 (data layer + home part 1)
          ├─▶ Phase 3 (home part 2)          ─┐
          └─▶ Phase 4 (menu + item detail)    │
                 └─▶ Phase 5 (cart + pricing)  │
                        └─▶ Phase 6 (checkout) │
          Phase 7 (other pages) needs Phase 2 (+ Phase 4 cards/modal for favourites)
Phase 8 needs all of 1–7
```

- Phase 3 and Phase 4 can proceed in parallel after Phase 2 (different files; both only add to
  `page.tsx` / new routes).
- Phase 7 tasks T085–T092 depend only on Phase 1–2 and can run in parallel with Phases 4–6;
  T084 (favourites page) needs ProductCard + ItemModal (Phase 4).

### User story coverage

| Story | Tasks | Complete after |
|-------|-------|----------------|
| US1 (P1) customise → cart | T056–T061, T071, T073, T092 | Phase 5 |
| US2 (P1) cart → COD order | T062–T070, T072, T074–T083 | Phase 6 |
| US3 (P2) home page | T025–T051 | Phase 3 |
| US4 (P2) search/filter/sort | T052–T055 | Phase 4 |
| US5 (P3) favourites | T084 (+ T033, T035) | Phase 7 |
| US6 (P3) about/contact | T087–T091 | Phase 7 |
| US7 (P3) account UI | T085–T086 | Phase 7 |

### Within each phase

Data/types → stores/logic (+ unit tests) → leaf components → composed components → route page.

## Parallel Examples

```text
Phase 1: T004, T005, T006, T009, T010, T011 together; then T012–T018 together.
Phase 2: T025, T026, T027, T028, T029 (data files) together; T031, T032 together;
         T034, T035, T037, T039, T040 together.
Phase 3: T043 + T044 with T047, T048, T049, T050.
Phase 4: T052, T056, T057 together.
Phase 5: T063, T064, T066 together.
Phase 6: T074, T075, T078 together.
Phase 7: T084, T085, T087, T088, T090, T091, T092 together.
Phase 8: T096, T097, T098 together.
```

## Implementation Strategy

- **Owner-requested order**: Phases 1 → 8, stopping at every checkpoint for a browser review.
- **MVP (fastest path to a working order)**: Phases 1, 2 (data layer + cards only: T025–T036),
  4, 5, 6 → a customer can browse, customise, pay COD and see a confirmation (US1 + US2).
- **Incremental delivery**: each checkpoint leaves the site runnable with no broken pages except
  routes explicitly noted as arriving in a later phase.
- Commit after each phase with a message like `feat(frontend): phase 3 — home promos, specials,
  about, testimonials, CTA`.

## Notes

- 102 tasks total. `[P]` = different files and no unfinished dependency.
- Never add an item to the cart outside `ItemDetail` (Constitution III).
- Stop at each checkpoint and confirm in the browser before continuing.
