# Project Journey — Karachi Burger & Grill

This is how the Karachi Burger & Grill website was built, phase by phase. It covers what was
built, which tools were chosen and why, and which problems came up and how they were solved.

- **Scope:** Phase 1 is the customer-facing frontend (`frontend/`, sections 1–7). Phase 2 is the FastAPI
  backend, the admin panel and the real features behind the site (section 8). Both phases are complete;
  deployment is prepared but not done.
- **How the two fit:** the frontend always talked to a single data module (`src/lib/api.ts`), so the
  backend replaced the mock data without touching the visual design of any customer screen.
- **Method:** Spec-Driven Development with SpecKit:
  constitution → spec → clarifications → plan → tasks → implementation in 8 reviewed phases.
  Every phase was checked in the browser by the owner before it was committed.
- **Dates:** Phase 1: 26–27 September 2026 (branch `001-restaurant-frontend`). Phase 2: 27–28 September 2026
  (branch `002-restaurant-backend`).

---

## 1. Ground rules (the constitution)

Before any code, we wrote down eleven principles in `.specify/memory/constitution.md`. Four of them
shaped almost every decision later on:

| Principle | What it meant in practice |
|---|---|
| **Honesty** | No invented numbers: no "50K+ customers", no fake "4.9 rating", no review counts. Testimonials are labelled **"Sample reviews"**. Star ratings on cards stay hidden until real ratings exist. |
| **Own brand only** | No other brands' names or logos: no cola brand names, and the social icons are our own inline SVGs because lucide dropped brand icons. JazzCash, Easypaisa and Google appear only as plain text. |
| **Motion with restraint** | Every animation switches off under the OS "Reduce motion" setting, and no content is ever hidden behind an animation. |
| **Backend-ready** | Components read data only through `@/lib/api`. An ESLint rule enforces this. |

---

## 2. Tech stack and why

| Tool | Why we chose it |
|---|---|
| **Next.js 16 (App Router, Turbopack)** | Server components render the menu as HTML, which is fast and good for SEO. There are file-based routes for 16 pages plus 33 prerendered item pages, and built-in image, font, sitemap, robots and Open Graph support. |
| **React 19 + TypeScript (strict)** | Typed data model (menu items, options, cart lines, orders), so errors show up at build time. |
| **Tailwind CSS 4 (`@theme` tokens)** | One set of brand tokens (charcoal, ember, flame, cream) used everywhere. The contrast fixes were made once, in the tokens. |
| **Zustand 5 + persist** | Tiny stores for the cart, favourites and UI state, saved to `localStorage`. Hydration is deferred (`skipHydration`) so the server HTML never mismatches. |
| **React Hook Form 7 + Zod 4** | Checkout, contact, login and signup forms with shared schemas. The same schemas can later validate on the FastAPI side via OpenAPI. |
| **motion 13** | Used only for the fly-to-cart animation. Everything else is CSS, to keep the JavaScript small. |
| **lucide-react** | A consistent line-icon set (no brand icons, which suits the brand rule). |
| **Vitest 5** | 67 unit tests: pricing, Wings Wednesday, Pakistan time, scheduling, validation, cart store and catalogue integrity. |
| **Playwright + axe-core** | End-to-end ordering flow, keyboard-only flow, reduced motion, an axe WCAG 2.1 AA scan of 16 pages (including the 404), and overflow / tap-size checks at 360, 768, 1280 and 1920 px. |

---

## 3. What was built, phase by phase

### Phase 1 — Site shell
- Next.js app in `frontend/`: TypeScript strict, Tailwind tokens, three `next/font` families
  (Big Shoulders for headlines, Manrope for body text, Caveat Brush for accents) and 38 brand photos.
- Flame logo, announcement bar, sticky navbar, native-`<dialog>` mobile menu and search, and a
  footer with our own social icons.
- An ESLint rule blocks components from importing mock data directly.

### Phase 2 — Data layer and home hero
- Typed mock catalogue: 33 items, 8 categories, per-item size prices, add-ons, promos, delivery
  areas and sample testimonials.
- Premium hero modelled on `assets/design-reference.png`: the Grand Combo in a fire glow, ember
  particles, floating badges, features strip, category chips, and "Most Loved" tabs.
- Product cards **open the item view; they never add to the cart directly**.

### Phase 3 — Promos, specials, story
- Pakistan-time helpers (fixed UTC+5) and a live "Wings Wednesday" countdown.
- Promo banners, a Chef's Specials bento grid, the Burns Road about teaser, "Sample reviews", and
  the "Taste the fire" call to action.
- **Honesty fixes requested by the owner:** the 4.9 rating and 50K+ figures were replaced with
  "Made fresh, every order" and "Loved across Karachi"; card star ratings were hidden; at most three
  "Bestseller" tags (a test enforces this).

### Phase 4 — Menu and item view
- `/menu` with search, category chips with live counts, and sort. All state lives in the URL, so
  views are shareable.
- **Item view** driven by `?item=slug`: a centred two-column dialog on desktop and a bottom sheet on
  phones. The browser Back button closes it. A required option gates the Add button. Also add-ons,
  a 500-character note, and a quantity stepper on a `Rs X | Add to cart` button.
- `/menu/[slug]` is prerendered for all 33 items (unknown slugs give a 404), with breadcrumbs and
  related items.

### Phase 5 — Cart and pricing rules
- Prices are **always recomputed from the menu**. Nothing trusts a saved price.
- Wings Wednesday discount (Pakistan time). Delivery is Rs 150, and free from Rs 1,500 after
  discounts.
- Slide-in cart drawer and a `/cart` page: steppers, free-delivery progress bar, discount line,
  "deal ended" and "we're closed" notices.
- Fly-to-cart animation plus a bounce on the bag icon.

### Phase 6 — Checkout and confirmation
- Checkout collects name, Pakistani mobile (tidied to `03XX-XXXXXXX`), area, address, landmark and
  notes, with ASAP or a half-hour slot inside opening hours.
- Payment is Cash on Delivery. Card, JazzCash and Easypaisa are shown as "coming soon".
- Inline errors, an error banner, and focus moves to the first invalid field.
- `placeOrder` re-prices every line. The confirmation page shows a `KBG-12345` order number with a
  copy button, the ETA, and a demo tracker that advances every 6 seconds.

### Phase 7 — Remaining pages
- `/favourites`, `/login` and `/signup` (UI only: accounts are "coming soon"), `/about`,
  `/contact` (validated form, no embedded map), `/combos`, `/faq`, `/privacy`, `/terms`, `/track`
  and a branded 404 ("This grill's gone cold").
- The Meal upgrade now shows **"Includes Masala Fries + Chilled Cola"** everywhere: item view,
  cart, checkout and the combos page.

### Phase 8 — Final polish
- **Menu header:** a tilted three-photo collage (smash burger, grill platter, wings) with an ember
  glow fills the right side on desktop.
- **Motion:**
  - soft page-enter transition (`template.tsx`)
  - scroll-driven section reveals (CSS `animation-timeline: view()`, transform only, so content
    is never invisible)
  - hover lift and zoom on cards
  - fly-to-cart on every page
  - all of it off under reduced motion
- **Native-app feel on phones:**
  - drag the item sheet down to close it
  - safe-area padding on bottom bars (`viewport-fit: cover`)
  - no grey tap flash
  - 44 px minimum tap targets, checked automatically
- **Accessibility:**
  - `ember-700` darkened to `#b43c0c` to pass AA on cream
  - ratings exposed as images with labels
  - the scrollable review strip is keyboard-focusable
  - footer and password toggles enlarged
  - axe finds **0 violations** on 16 pages at 4 viewports
- **SEO:**
  - a unique title and description per page
  - a generated 1200×630 Open Graph image (Grand Combo, flame and tagline)
  - flame `icon.svg` plus a generated `apple-icon`
  - `sitemap.xml` covering all pages and 33 items
  - `robots.txt` that keeps cart, checkout, orders and accounts out of search
  - Restaurant JSON-LD on the home page
- **Performance:** see [§5](#5-lighthouse-scores).
- **Docs:** this file and the root `README.md`.

---

## 4. Problems we hit and how we solved them

| Problem | Solution |
|---|---|
| Ember text on cream was 4.4:1, just under AA | Darkened the `ember-700` token to `#b43c0c`, which fixed every use at once. |
| lucide v1 removed brand icons | Wrote small inline SVG social icons (which also fits the "own brand only" rule). |
| Saved cart/favourites caused hydration mismatches | Zustand `persist` with `skipHydration` plus a `StoreHydrator`. UI waits for `useHydrated()`. |
| Wings Wednesday must follow Karachi time, not the visitor's | Fixed UTC+5 arithmetic (Pakistan has no daylight saving) with unit tests at day boundaries. |
| Next 16 breaking changes | `params` is now async, `preload` replaced `priority` on images, `images.qualities` is required, and `useSearchParams` needs a Suspense boundary. We read the bundled docs in `node_modules/next/dist/docs/` rather than guessing. |
| "Reveal" animations hid server-rendered content until JavaScript ran | Moved reveals to pure CSS that animates transform only, never opacity, so text is always readable. |
| Closing a dialog then navigating left the page scroll-locked | `useModalDialog().close()` releases the scroll lock synchronously. |
| Focusing a field inside the bottom sheet scrolled the sheet itself | `overflow-clip` instead of `overflow-hidden` on the `<dialog>`. |
| Headings hidden under the sticky navbar after navigation | `scroll-margin-top` on `#main > *`. |
| Lighthouse flagged a decorative fire photo as the hero's LCP | Replaced it with a CSS radial-gradient ember bed, which looks the same with no image request. |
| Footer newsletter pulled a 400 KB data + Zod chunk into every page | Rewrote it as a tiny form that loads the API module only on submit. |
| The whole catalogue was embedded in every page for the item modal | Item view, cart drawer and fly-to-cart are code-split. They load their data on demand (`useCatalog`) and mount the first time they're opened. |
| 80 KB of inline star SVGs in the home HTML | One CSS-mask star repeated. Home HTML went from 364 to 320 KB. |
| Product cards were hydrated as client components | Cards are server components with tiny client islands (open button, favourite heart, live deal price). |
| Heavy style/layout work for the long menu on phones | `content-visibility: auto` on off-screen sections, which cut mobile Total Blocking Time roughly in half. |
| Checkout e2e test failed in the morning (the restaurant is closed, so ASAP isn't allowed) | The test pins the browser clock to an open hour. |

---

## 5. Lighthouse scores

Measured on the production build (`npm run build && npm run start`) with Lighthouse on this
development laptop, using the median of 5 runs.

| Page | Mobile Performance | Desktop Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|---|
| `/` (home) | 71 | 93 | 100 | 100 | 100 |
| `/menu` | 72 | 90 | 100 | 100 | 100 |

- **Cumulative Layout Shift is 0** on mobile, and at most 0.006 on desktop /menu (the "good" threshold is 0.1).
- Mobile First Contentful Paint is about 1.2–1.9 s. Largest Contentful Paint is about 4.0–4.2 s.
- **The mobile target of 90 was not reached on this machine.**
  - Lighthouse's mobile mode simulates a slow phone CPU on top of this laptop, and the laptop's
    own benchmark varied between runs (index about 1,300–1,900). The same build scored anywhere
    from 62 to 87 on home.
  - The remaining cost is React hydrating a long, image-rich page.
  - Measure again with PageSpeed Insights after deploying to Vercel, which gives a stable reference.

---

## 6. Before launch

Phase 1 items that were open, and what happened to them:

- [ ] Real phone number, email and social links in `frontend/src/lib/data/site.ts`. These are
      placeholders today.
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the real domain (used by Open Graph, sitemap and robots).
- [x] ~~Connect the FastAPI backend behind `src/lib/api.ts`~~ — done in Phase 2 (section 8).
- [x] ~~Real ratings and reviews before removing the "Sample reviews" label~~ — done: real reviews
      replace the samples once 3 are approved. No star counts are shown on cards.
- [ ] Online payments and Google sign-in (both still shown as "coming soon"). Email/phone accounts
      exist now.

The deployment checklist is at the end of section 8, and the step-by-step guide is
[`DEPLOYMENT.md`](DEPLOYMENT.md).

---

## 7. Screenshots

Generated by `SCREENSHOTS=1 npx playwright test tests/e2e/responsive.spec.ts --project=mobile-360 --project=desktop-1280`
into `docs/screenshots/`.

| Page | Phone (360 px) | Desktop (1280 px) |
|---|---|---|
| Home | ![Home on a phone](screenshots/home-mobile-360.jpg) | ![Home on desktop](screenshots/home-desktop-1280.jpg) |
| Menu | ![Menu on a phone](screenshots/menu-mobile-360.jpg) | ![Menu on desktop](screenshots/menu-desktop-1280.jpg) |
| Checkout | ![Checkout on a phone](screenshots/checkout-mobile-360.jpg) | ![Checkout on desktop](screenshots/checkout-desktop-1280.jpg) |
| Item view | ![Item bottom sheet on a phone](screenshots/item-mobile-360.jpg) | ![Item dialog on desktop](screenshots/item-desktop-1280.jpg) |
| Cart | ![Cart drawer on a phone](screenshots/cart-mobile-360.jpg) | ![Cart drawer on desktop](screenshots/cart-desktop-1280.jpg) |
| Order tracker | ![Order confirmation on a phone](screenshots/order-mobile-360.jpg) | ![Order confirmation on desktop](screenshots/order-desktop-1280.jpg) |
| About | ![About on a phone](screenshots/about-mobile-360.jpg) | ![About on desktop](screenshots/about-desktop-1280.jpg) |

Placeholder to add by hand:

- _[Screenshot: branded 404 page]_

---

## 8. Phase 2 — The backend (27–28 September 2026)

Branch `002-restaurant-backend`. Built the same way as Phase 1 (constitution → spec → plan → tasks →
implementation), one user story at a time, each checked by the owner and committed before the next.

### What was built

| Story | What the restaurant and its customers can now do |
|---|---|
| Menu from the database (US2) | The menu, deals, delivery areas and fees come from Postgres. The pages look exactly as before. |
| Real orders (US1) | Cash-on-Delivery orders are saved, priced **by the server**, checked against opening hours and delivery areas, rate limited, and protected against double submission. Order numbers are real (`KBG-10001`…). |
| Live tracking (US3) | The order page reads the real status and refreshes every 15 seconds. The public view hides the phone and street address. Cancelled is shown properly. |
| Admin panel (US4) | `/admin`: separate staff login, today's orders and sales, a live list with a chime and highlight for new orders, order detail, and Confirmed → Preparing → On the way → Delivered or Cancel (with a confirm step). Price, sold-out and hidden editing and delivery-area fees came with it. |
| Customer accounts (US5) | Sign up and log in with email or phone, logout, "My orders", "Order again", checkout pre-fill. Guest checkout still works. |
| Messages and newsletter (US6) | The contact form and footer sign-up are saved. `/admin/messages` lists them with mark-as-read. Admin can also add and remove delivery areas. |
| Real reviews (US7) | Only a customer with a delivered order can review it (1–5 stars and a comment). Admin approves or rejects. After 3 approvals the home page shows real reviews instead of the labelled samples. |

### Technologies and why

| Tool | Why we chose it |
|---|---|
| **FastAPI** | Typed request and response shapes, automatic API docs at `/docs`, and a clean error format the frontend can rely on. |
| **SQLModel + Alembic** | Tables defined as Python classes, with versioned migrations so the database can change safely. |
| **Neon Postgres (Singapore)** | Real relational data (orders, accounts) close to Karachi. Two branches: one for development, one only for tests. |
| **uv** | Fast, reproducible Python installs from `uv.lock`. |
| **pwdlib (Argon2id) + PyJWT** | Passwords are stored as Argon2id hashes. Login is a 7-day token in an HttpOnly, Secure, SameSite=Lax cookie that scripts cannot read. |
| **slowapi + `limits`** | Per-IP limits on login, signup, orders, contact and tracking, plus a lockout after 5 failed logins. |
| **Zod + React Hook Form** (existing) | The same validation rules on the forms, with the server as the final judge. |
| **pytest, ruff, mypy (strict)** | 187 backend tests (all pass against a scratch Neon database; 77 need no database at all), with strict typing. |
| **Playwright + axe** (existing) | Browser tests against the real backend at four screen sizes. |

Decisions are written up in `history/adr/`: backend stack, session cookie and same-origin proxy,
server-authoritative pricing, freshness (polling and caching), and customer/admin sessions.

### Problems we hit and how we solved them

| Problem | Solution |
|---|---|
| **Cross-site cookie problem.** The website (Vercel) and the API (Render) will be on different sites. Browsers refuse to send `SameSite=Lax` cookies on cross-site requests, and third-party cookies are being phased out. | The browser only ever calls its own site. Next.js forwards `/api/*` to the backend (a rewrite), so the cookie is first-party and stays HttpOnly. No domain purchase needed. (ADR-0002) |
| **Rounding difference.** Python's `round()` rounds halves to the nearest even number; JavaScript's `Math.round` rounds halves up. A Wings Wednesday discount could differ by a rupee between the website and the server. | Integer half-up arithmetic `(price × percent + 50) // 100` in Python, proven identical to the website by golden test files generated from the frontend's own pricing code. |
| **Failed-login limit.** The rate limiter counts every request, so it can't express "5 *failed* logins per 15 minutes". | A small lockout guard built on the `limits` library, keyed by IP and identifier, reset on success. Unknown accounts still run a dummy password check so timing doesn't reveal them. |
| Checkout was rejected by the server for every real order. | The cart's internal `key` field was being sent, and the API refuses unknown fields on purpose. Found by the end-to-end test; checkout now sends only the fields the API allows. |
| Two staff could move the same order at once and overwrite each other. | The admin sends the status they saw; if it changed meanwhile the server answers 409 with the current status and the screen refreshes. |
| The single root layout wrapped the admin pages in the customer's navbar and footer. | A small client component skips the customer chrome on `/admin/*`, instead of restructuring every customer route. |
| `RATELIMIT_ENABLED=false` did not switch limits off. | The rate-limit tests showed the library read the setting as the text "false", which counts as on. The app now pins it to a real boolean. |
| Tests could have wiped the real database. | The test run aborts if `TEST_DATABASE_URL` points at the same database as `DATABASE_URL`; every integration test also runs in a transaction that is rolled back. |
| A file containing the real admin password appeared by accident in the working tree (a shell mistake). | Caught by `git status` before staging, deleted, and confirmed it was never committed. Later a full `git grep` of tree and history for every secret value found nothing. |
| The new-order highlight faded the text (an opacity pulse), which failed the contrast check mid-animation. | The highlight now only animates a glow around the card; the text is never dimmed. |
| Accessibility scan of the new pages found gaps. | Fixed: no main heading on the dashboard, an unnamed icon-only button, tap targets under 44 px, a tab list that wrongly held a checkbox, and definition lists without terms. |

### Checks run at the end

- Backend: `ruff`, `ruff format --check`, `mypy --strict` clean; all 187 tests pass (the 108 integration tests
  ran for the first time here, against a temporary scratch database that was then deleted; they exposed
  three mistakes in the tests themselves and none in the app).
- Frontend: `eslint`, `tsc`, 86 unit tests and the production build all with zero errors or warnings.
- Browser (Playwright, real backend, 360/768/1280/1920 px): ordering, tracking, accounts, admin, messages,
  reviews, and the accessibility and tap-target scans of every login, account and admin page.
- Security: no secret value in any tracked file or in git history; `backend/.env` is untracked; an unknown
  origin is refused (403); admin routes refuse signed-out visitors and customers; no password is ever
  printed by the seed or admin commands.

### Lighthouse (mobile), backend connected

Measured on the production build (`npm run build && npm run start`) with the backend connected, mobile
mode, median of 5 runs, on the development laptop.

| Page | Performance | Accessibility | Best practices | SEO | LCP | Total blocking time | CLS |
|---|---|---|---|---|---|---|---|
| `/` (home) | 74 (runs 65–78) | 100 | 100 | 100 | 4.1 s | 416 ms | 0 |
| `/menu` | 72 (runs 60–79) | 100 | 100 | 100 | 4.1 s | 532 ms | 0 |

- Accessibility, best practices and SEO meet the target on both pages. Layout shift is 0.
- **The mobile Performance target of 90 was not reached**, the same as in Phase 1 (71 / 72), and for the
  same reason: Lighthouse's mobile mode simulates a slow phone CPU on top of a laptop, and the cost is
  React hydrating a long, image-rich page. The backend did not make it worse (home 71 → 74, menu 72 → 72,
  both within run-to-run noise of about ±10). Real numbers will come from PageSpeed Insights after deploy.
- The first measurement showed Best practices at 96: every guest page made a request to ask who was signed
  in, and the expected "not signed in" answer was logged as a console error. A small readable
  `kbg_auth` hint cookie now lets guest visits skip that request, and the score is back to 100.

### Screenshots

Placeholders to add by hand:

- _[Screenshot: admin dashboard with a new order highlighted]_
- _[Screenshot: admin order detail with the status buttons]_
- _[Screenshot: My orders with Order again]_
- _[Screenshot: home page with real reviews]_

### Before launch (deployment)

Follow [`DEPLOYMENT.md`](DEPLOYMENT.md). In short:

- [ ] A clean production database on Neon, then `alembic upgrade head`, `seed` and `create-admin` run
      once from your computer.
- [ ] Backend on Render (`render.yaml`, Singapore) with `COOKIE_SECURE=true`, `TRUST_PROXY=true` and
      `FRONTEND_URL` set to the Vercel address.
- [ ] Frontend on Vercel with root directory `frontend` and `NEXT_PUBLIC_API_URL` /
      `NEXT_PUBLIC_SITE_URL` set **before** the first build.
- [ ] Use Render's paid **Starter** instance for real use (the free one sleeps when idle).
- [ ] Real contact details in `frontend/src/lib/data/site.ts`.
- [ ] Run the manual walkthrough in `specs/002-restaurant-backend/quickstart.md` (section 5) on the live site.
- [ ] Measure the live site with PageSpeed Insights.
