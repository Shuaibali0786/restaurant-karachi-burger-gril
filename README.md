# Karachi Burger & Grill

> **Karachi ka asli zaiqa**

A full online food-ordering website for a burger & BBQ restaurant on Burns Road, Karachi: a Next.js
website, a FastAPI backend with a real database, and an admin panel for the kitchen.

**Status: 🟢 Frontend complete — 🟢 backend complete — 🚀 ready to deploy** (see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md))

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
- ✅ **Get an order confirmation** with an order number, estimated arrival time and a **live tracker**
  (Confirmed → Preparing → On the way → Delivered) that refreshes itself every 15 seconds.
- 👤 **Make an account** with an email or mobile number, see **My orders**, tap **Order again**, and get
  your name and address filled in at checkout. Guest checkout still works.
- ⭐ **Review a delivered order.** Approved reviews appear on the home page.
- ✉️ **Contact us or join the newsletter.** Messages and sign-ups are saved for the restaurant.
- ❤️ **Save favourites** so you can find the dishes you love again.
- 🔥 **Get the Wings Wednesday deal.** Fire Wings are 20% off every Wednesday, on Karachi time.
- 🕒 **Order within opening hours.** The restaurant is open daily from 12 noon to 3 AM. When it's
  closed, the site tells you and lets you schedule for later.

## What the restaurant can do (admin panel at `/admin`)

- 🔔 **See new orders live**, with a chime and a highlight (refreshes every 15 seconds), plus today's
  order count and sales.
- 🍳 **Move each order along** (Confirmed → Preparing → On the way → Delivered) or cancel it. Two staff
  members can't overwrite each other by accident.
- 🧾 **Open any order** to see the items, options, notes, customer name, phone and address.
- 💰 **Change prices**, mark items **sold out** or **hidden**.
- 🗺️ **Manage delivery areas**: change a fee, switch an area on or off, add or remove one.
- 💬 **Read messages and newsletter sign-ups**, and mark messages as read.
- ⭐ **Approve or reject reviews.** The home page shows real reviews once 3 are approved; until then
  it shows clearly labelled sample reviews.

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
| **FastAPI + SQLModel** | The backend API. Every price is calculated on the server, so a tampered browser can't change what an order costs. |
| **Neon Postgres (Singapore)** | The database for menu, orders, accounts, messages and reviews. |
| **Argon2 + a secure cookie** | Passwords are hashed with Argon2id. Login is a 7-day, HttpOnly, SameSite cookie that scripts can't read. |
| **Render + Vercel** | The planned hosting: backend on Render (Singapore), website on Vercel. |

## Quality

| Lighthouse | Score |
|---|---|
| Accessibility | **100** |
| Best Practices | **100** |
| SEO | **100** |
| Performance (desktop) | **93** home / **90** menu |
| Performance (mobile, simulated slow phone) | **74** home / **72** menu (target 90 not reached; see the journey) |

- ✅ **86 unit tests** (Vitest): pricing, discounts, Karachi time, validation, cart, live polling.
- ✅ **187 backend tests** (pytest): pricing rules (checked against the website's own numbers), order
  rules, accounts, admin, reviews, rate limits. 77 need no database; the rest use a separate test database.
- ✅ **Browser tests** (Playwright, real backend, 4 screen sizes): ordering, accounts, the admin panel,
  reviews, messages, keyboard-only use, reduced motion, and an automated accessibility scan
  (WCAG 2.1 AA) at 360, 768, 1280 and 1920 px, including every login and admin page.
- Lighthouse numbers with the backend connected are in [`docs/PROJECT-JOURNEY.md`](docs/PROJECT-JOURNEY.md).

## Run it locally

You need [Node.js](https://nodejs.org/) 20.9 or newer, Python 3.12+ with [uv](https://docs.astral.sh/uv/), and a
free [Neon](https://neon.tech) Postgres database. In **PowerShell** or **Command Prompt**:

```bat
git clone https://github.com/Shuaibali0786/restaurant-karachi-burger-gril.git
cd restaurant-karachi-burger-gril

:: 1. Backend (first time only: copy .env.example to .env and fill it in)
cd backend
uv sync
uv run alembic upgrade head
uv run python -m app.cli seed
uv run python -m app.cli create-admin
uv run fastapi dev app/main.py --port 8000

:: 2. Website (a second window, from the project folder)
cd frontend
npm install
echo NEXT_PUBLIC_API_URL=http://localhost:8000> .env.local
npm run dev
```

Open **http://localhost:3000** for the website and **http://localhost:3000/admin** for the admin panel.
The step-by-step version, with every setting explained, is in
[`specs/002-restaurant-backend/quickstart.md`](specs/002-restaurant-backend/quickstart.md) and
[`backend/README.md`](backend/README.md).

Other commands, run from `frontend`:

| Command | What it does |
|---|---|
| `npm run build` then `npm run start` | Production build and server |
| `npm run lint` / `npm run typecheck` | Code checks |
| `npm test` | Unit tests |
| `npm run test:e2e` | Browser tests (backend running; first run `npx playwright install chromium`) |

From `backend`: `uv run pytest`, `uv run ruff check .`, `uv run mypy app`.

## How it fits together

```
Browser ──► Next.js website ──(/api/* forwarded)──► FastAPI backend ──► Neon Postgres
             (Vercel)                                 (Render, Singapore)
```

The browser only talks to the website, which forwards `/api/*` to the backend. That keeps the login
cookie first-party, so it works in every browser. The decisions and their reasons are written up as
short ADRs in [`history/adr/`](history/adr/).

## Project structure

```
frontend/              Next.js website
  src/app/             pages, sitemap, robots, share image, icons
  src/components/      UI by area: home, menu, cart, checkout, layout, forms
  src/app/admin/       the admin panel
  src/app/account/     "My orders"
  src/lib/api.ts       the one place data comes from (calls the backend)
  src/lib/data/        the menu and site info the backend is seeded from
  src/stores/          saved cart, favourites, and the signed-in user
  tests/               unit and browser tests
backend/               FastAPI backend
  app/api/routes/      HTTP routes (admin/ = staff only)
  app/services/        the rules (all pricing lives in services/pricing.py)
  app/models/, alembic/  tables and migrations
  tests/               unit, pricing-parity and integration tests
specs/                 specifications, plans, data models, API contracts, task lists (one folder per phase)
docs/                  project journey, deployment guide, screenshots
history/               prompt history records and architecture decisions (adr/)
render.yaml            Render blueprint for the backend
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
- 📐 The specs, plans, data models, API contracts and tasks are in
  [`specs/001-restaurant-frontend/`](specs/001-restaurant-frontend/) (website) and
  [`specs/002-restaurant-backend/`](specs/002-restaurant-backend/) (backend, seven user stories).
- 🧭 How to put it online: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Roadmap

- [x] **Phase 1: Frontend.** The complete ordering website.
- [x] **Phase 2: Backend** with FastAPI, SQLModel and Neon Postgres: real orders, live tracking, customer
  accounts, the admin panel, contact messages and real reviews.
- [ ] **Phase 3: Deployment** on Render (backend) and Vercel (website). Prepared, not yet done; see
  [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Honest note

- **Payment is Cash on Delivery only.** Card, JazzCash and Easypaisa are shown as "coming soon".
- **Reviews on the home page are samples** (and are labelled that way) until 3 real reviews are approved.
- **Not deployed yet.** Until it is, everything runs on your own computer.
- The contact details in the footer are placeholders until the owner supplies the real ones.

## Author

**Shuaib Ali**

- GitHub: [@Shuaibali0786](https://github.com/Shuaibali0786)
- LinkedIn: _add your LinkedIn profile link here_
