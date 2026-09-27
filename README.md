# Karachi Burger & Grill

> **Karachi ka asli zaiqa.** Charcoal-grilled burgers, crispy fried chicken and Burns Road BBQ,
> ordered online.

This is the restaurant's website frontend. It's fast, accessible and works like a food-ordering app
on phones. It runs on mock data today and is ready to plug into a FastAPI backend.

![Home page on desktop](docs/screenshots/home-desktop-1280.jpg)

## Features

- **Menu:** 33 items in 8 categories, with search, category filters and sorting. The filter state
  lives in the URL, so any view can be shared.
- **Item view:** a dialog on desktop and a draggable bottom sheet on phones. You choose the
  required size or meal first, then add-ons, a note and a quantity. The browser Back button closes
  it, and every item also has its own page (`/menu/<slug>`).
- **Cart:**
  - slide-in drawer and a `/cart` page
  - prices always recomputed from the menu
  - Wings Wednesday discount in Pakistan time
  - delivery Rs 150, free from Rs 1,500
- **Checkout:**
  - validated form with Pakistani mobile formatting
  - ASAP or a half-hour slot inside opening hours
  - Cash on Delivery
  - order confirmation with a demo live tracker
- **Also included:**
  - favourites
  - combos, about, contact, FAQ, privacy, terms and order-tracking pages
  - login and signup screens (UI only for now)
  - a branded 404 page
- **Polish:**
  - page transitions, scroll reveals and the fly-to-cart animation, all turned off by the OS
    "Reduce motion" setting
  - WCAG 2.1 AA, checked with axe
  - SEO: sitemap, robots, Open Graph image and JSON-LD
  - zero layout shift

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · Zustand 5 ·
React Hook Form + Zod 4 · motion · lucide-react · Vitest · Playwright + axe-core

## Getting started

Requires Node.js 20.9+ (tested on 24).

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

Optional: copy `frontend/.env.example` to `frontend/.env.local` and set `NEXT_PUBLIC_SITE_URL`
when deploying. It is used for share images, the sitemap and robots.

## Scripts

Run these from `frontend/`:

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm run start` | Production build and server |
| `npm run lint` | ESLint (zero errors required) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests (pricing, promos, time zone, validation, stores) |
| `npm run test:e2e` | Playwright: ordering flow, keyboard, accessibility and responsive checks at 360/768/1280/1920 px |

## Project structure

```
frontend/            Next.js app
  src/app/           routes (pages, sitemap, robots, OG image, icons)
  src/components/    UI grouped by area (home, menu, cart, checkout, layout, ui, forms)
  src/lib/api.ts     the only data entry point, to be swapped for the FastAPI backend
  src/lib/data/      mock catalogue, promos, site info
  src/stores/        Zustand stores (cart, favourites, UI)
  tests/             unit (Vitest) and e2e (Playwright)
specs/               SpecKit spec, plan, data model, API contracts and tasks
docs/                project journey and screenshots
history/             prompt history and decision records
assets/              source photos and design reference
```

## Backend-ready

Components never import data directly. They call `@/lib/api`, and an ESLint rule enforces this.
The draft API contract is in
[`specs/001-restaurant-frontend/contracts/openapi.yaml`](specs/001-restaurant-frontend/contracts/openapi.yaml).

## Honesty

The site shows no invented statistics or ratings. Testimonials are labelled **"Sample reviews"**
until real reviews exist, and card star ratings stay hidden until the backend provides real ones.

## More

For how it was built, phase by phase, including the problems solved and the Lighthouse results, see
[`docs/PROJECT-JOURNEY.md`](docs/PROJECT-JOURNEY.md).
