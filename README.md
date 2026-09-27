# Karachi Burger & Grill

> **Karachi ka asli zaiqa**

A full online food-ordering website for a burger & BBQ restaurant on Burns Road, Karachi.

**Status: 🟢 Frontend complete — 🛠️ backend in progress**

![Karachi Burger & Grill home page](docs/screenshots/home-desktop-1280.jpg)

| Menu | Item popup | Cart |
|---|---|---|
| ![Menu with search and category filters](docs/screenshots/menu-desktop-1280.jpg) | ![Item popup with options and extras](docs/screenshots/item-desktop-1280.jpg) | ![Cart drawer with free-delivery bar](docs/screenshots/cart-desktop-1280.jpg) |
| **Checkout** | **Order tracker** | **Mobile** |
| ![Checkout form with Cash on Delivery](docs/screenshots/checkout-desktop-1280.jpg) | ![Order confirmation and tracker](docs/screenshots/order-desktop-1280.jpg) | ![Item bottom sheet on a phone](docs/screenshots/item-mobile-360.jpg) |

---

## What you can do on the website

- 🍔 **Browse the full menu.** There are 33 items in 8 categories: Burgers, Wraps, Fried Chicken,
  Sandwiches, BBQ, Bowls, Sides & Drinks, and Combos.
- 🔎 **Search and filter.** Type "tikka" or "wings", tap a category, or sort by price or popularity.
- 🎛️ **Make it yours.** Choose a size or meal: a Meal includes Masala Fries + Chilled Cola. You can
  add extras like cheese or jalapeños and set the quantity.
- ✍️ **Add special instructions**, like "no onions" or "extra spicy".
- 🛒 **Review your cart.** Change quantities, and a progress bar shows how much more you need for
  **free delivery (Rs 1,500 and above)**. Otherwise delivery is Rs 150.
- 📍 **Check out for delivery in Karachi.** Choose Saddar, Clifton, DHA, PECHS, Gulshan or North
  Nazimabad, then ASAP or a time later today.
- 💵 **Pay with Cash on Delivery.** Card, JazzCash and Easypaisa are marked "coming soon".
- ✅ **Get an order confirmation** with an order number, estimated arrival time and a live-style
  tracker: Confirmed → Preparing → On the way → Delivered.
- ❤️ **Save favourites** so you can find the dishes you love again.
- 🔥 **Get the Wings Wednesday deal.** Fire Wings are 20% off every Wednesday, on Karachi time.
- 🕒 **Order within opening hours.** The restaurant is open daily from 12 noon to 3 AM. When it's
  closed, the site tells you and lets you schedule for later.

## How to use it

1. Open the **Menu** from the top bar.
2. **Pick an item** to open its popup (on a phone, it slides up from the bottom).
3. **Choose an option** (Single, Double or Meal), then add any extras or a note.
4. Tap **Add to cart**, then open the cart from the bag icon.
5. Tap **Checkout**, fill in your name, mobile number and address, and keep **Cash on Delivery**.
6. Tap **Place order** and **track your order** on the confirmation page.

## Tech stack

![Next.js](https://img.shields.io/badge/Next.js_16-000000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?logo=tailwindcss&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Motion_(Framer_Motion)-0055FF?logo=framer&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-443E38)
![React Hook Form](https://img.shields.io/badge/React_Hook_Form-EC5990?logo=reacthookform&logoColor=white)
![Zod](https://img.shields.io/badge/Zod_4-3E67B1?logo=zod&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white)

| Tool | Why |
|---|---|
| **Next.js 16 (App Router)** | Pages are rendered on the server, so they load fast and search engines can read them. |
| **TypeScript (strict)** | Every menu item, cart line and order is typed, so mistakes are caught before they reach users. |
| **Tailwind CSS 4** | One set of brand colours and spacing used everywhere, which keeps the design consistent. |
| **Motion (Framer Motion)** | Powers the fly-to-cart animation. Other effects are plain CSS, and all motion respects "Reduce motion". |
| **Zustand** | A tiny store that keeps your cart and favourites saved between visits. |
| **React Hook Form** | Fast, accessible forms that don't re-render on every keystroke. |
| **Zod** | One set of rules for checking names, phone numbers and addresses, reusable by the backend. |
| **Playwright** | Real-browser tests of the ordering journey on phone, tablet, laptop and large screens. |

## Quality

| Lighthouse | Score |
|---|---|
| Accessibility | **100** |
| Best Practices | **100** |
| SEO | **100** |
| Performance (desktop) | **93** home / **90** menu |

- ✅ **67 unit tests** (Vitest): pricing, discounts, Karachi time, validation, cart.
- ✅ **164 browser tests** (Playwright): the full order flow, keyboard-only use and reduced motion,
  plus an automated accessibility scan (WCAG 2.1 AA) at 360, 768, 1280 and 1920 px.
- Performance on mobile was 71 / 72 on a local laptop's simulated slow phone. It will be re-measured
  with PageSpeed Insights after deployment.

## Run it locally

You need [Node.js](https://nodejs.org/) 20.9 or newer (tested on 24). In **Command Prompt** or **PowerShell** on Windows:

```bat
git clone https://github.com/Shuaibali0786/restaurant-karachi-burger-gril.git
cd restaurant-karachi-burger-gril
cd frontend
npm install
npm run dev
```

Then open **http://localhost:3000** in your browser.

Other commands, run from `frontend`:

| Command | What it does |
|---|---|
| `npm run build` then `npm run start` | Production build and server |
| `npm run lint` / `npm run typecheck` | Code checks |
| `npm test` | Unit tests |
| `npm run test:e2e` | Browser tests (first run `npx playwright install chromium`) |

## Project structure

```
frontend/              Next.js website
  src/app/             pages, sitemap, robots, share image, icons
  src/components/      UI by area: home, menu, cart, checkout, layout, forms
  src/lib/api.ts       the one place data comes from (the backend plugs in here)
  src/lib/data/        demo menu, deals, delivery areas, site info
  src/stores/          saved cart, favourites and UI state
  tests/               unit and browser tests
specs/                 specification, plan, data model, API contract, task list
docs/                  project journey and screenshots
history/               prompt history records
```

## How it was built

This project follows **Spec-Driven Development** with **Spec-Kit Plus**
and **Claude Code**. The steps were:

1. Write a constitution, the project's ground rules (for example: no fake ratings or numbers).
2. Write a specification and resolve open questions with the owner.
3. Write a technical plan and data model.
4. Break the plan into 102 tasks.
5. Build it in 8 phases, each reviewed in the browser before committing.

- 📖 The full story (what was built in each phase, why each tool was chosen, and the problems solved)
  is in [`docs/PROJECT-JOURNEY.md`](docs/PROJECT-JOURNEY.md).
- 📐 The spec, plan, data model, API contract and tasks are in
  [`specs/001-restaurant-frontend/`](specs/001-restaurant-frontend/).

## Roadmap

- [x] **Phase 1: Frontend.** The complete ordering website (this repo, today).
- [ ] **Phase 2: Backend** with FastAPI, SQLModel and Neon Postgres. It will add real orders, an
  admin panel for the kitchen, customer accounts and real reviews.
- [ ] **Phase 3: Deployment** on Vercel.

## Honest note

- **Orders are demo-only for now.** They are saved in your browser, not sent to the restaurant,
  until the backend is live. The order tracker is a demo too.
- **Reviews on the home page are samples** and are labelled that way. Real reviews will come with
  the backend.

## Author

**Shuaib Ali**

- GitHub: [@Shuaibali0786](https://github.com/Shuaibali0786)
- LinkedIn: _add your LinkedIn profile link here_
