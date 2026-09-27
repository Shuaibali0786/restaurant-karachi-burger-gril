---
id: 016
title: GitHub README and push to origin
stage: misc
date: 2026-09-27
surface: agent
model: claude-opus-5-5
feature: 001-restaurant-frontend
branch: 001-restaurant-frontend
user: Shuaibali0786
command: README + git push
labels: ["docs", "readme", "github", "screenshots", "push"]
links:
  spec: specs/001-restaurant-frontend/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - README.md
 - docs/PROJECT-JOURNEY.md
 - docs/screenshots/item-*.jpg, cart-*.jpg, order-*.jpg, checkout-*.jpg
 - frontend/tests/e2e/responsive.spec.ts
tests:
 - SCREENSHOTS=1 playwright responsive.spec.ts "capture" at mobile-360 and desktop-1280 — 8 passed
 - lint and typecheck on tests — 0 errors
---

## Prompt

Two tasks:

TASK 1 — Make README.md a great GitHub landing page (update the existing one, don't start from zero):
- Top: project name "Karachi Burger & Grill", tagline "Karachi ka asli zaiqa", one line explaining it is a full online food-ordering website for a burger & BBQ restaurant on Burns Road, Karachi.
- A hero screenshot (docs/screenshots) right under the title, then a small gallery: home, menu, item popup, cart, checkout, order tracker, mobile view.
- "What you can do on the website" — explained simply for a non-technical visitor: browse 33 items in 8 categories, search and filter, choose options and extras, add special instructions, cart with free-delivery bar, checkout with Karachi delivery areas, Cash on Delivery, order confirmation and live-style tracker, favourites, Wings Wednesday discount, opening-hours logic.
- "How to use it" — a short step-by-step customer walkthrough (open menu → pick item → choose option → add to cart → checkout → track order).
- Tech stack with badges (Next.js, TypeScript, Tailwind CSS, Framer Motion, Zustand, React Hook Form, Zod, Playwright) and why each was chosen, in one line each.
- Quality: Lighthouse scores table (Accessibility 100, Best Practices 100, SEO 100, Performance desktop 93/90), 67 unit tests, 164 browser tests.
- "Run it locally" — exact commands for Windows (cd frontend, npm install, npm run dev, open http://localhost:3000).
- Project structure (short tree), and how it was built with Spec-Driven Development (Spec-Kit Plus + Claude Code), linking docs/PROJECT-JOURNEY.md and specs/.
- Roadmap: Phase 2 backend (FastAPI + SQLModel + Neon Postgres: real orders, admin panel, accounts, real reviews), Phase 3 deployment (Vercel). Mark current status clearly: "Frontend complete — backend in progress".
- Honest note: orders are demo-only (saved in the browser) until the backend is live; reviews are samples.
- Author section: Shuaib Ali, GitHub link, and a placeholder for LinkedIn.
Commit this.

TASK 2 — Push to GitHub: https://github.com/Shuaibali0786/restaurant-karachi-burger-gril.git
- Add it as remote "origin" (update the URL if origin exists).
- Push the current branch 001-restaurant-frontend to GitHub as "main" and set upstream. Do not rename or delete the local branch.
- If the remote already has commits, fetch and merge safely, keeping our README.md. Never force-push.
- Make sure .gitignore covers node_modules, .next, .env and .env.local, and no secrets are pushed.
- If the GitHub CLI (gh) is available and logged in, also set the repo description and topics (nextjs, typescript, tailwindcss, restaurant, food-ordering, karachi, spec-driven-development). If not, tell me exactly what to type in the GitHub "About" box.
- Finally show me the GitHub link and a summary of what was pushed.

## Response snapshot

Captured item popup, cart drawer, filled checkout and order tracker screenshots via a new SCREENSHOTS=1 journey test (clock pinned to opening hours, views scrolled to top, toast cleared). Rewrote README as a landing page: title/tagline/status, hero + 6-image gallery, plain-language features and walkthrough, badges with one-line reasons, quality table (desktop 93/90 plus an honest mobile note), Windows run commands, structure tree, SDD section, roadmap, honest note, author. Journey doc screenshot table updated. Verified .gitignore (.env*, node_modules, .next) and no secrets tracked; added origin and pushed 001-restaurant-frontend to main with upstream; set description and topics via gh.

## Outcome

- ✅ Impact: Repository has a clear public landing page and is on GitHub.
- 🧪 Tests: screenshot capture 8/8 pass.
- 📁 Files: see list above
- 🔁 Next prompts: add LinkedIn link; start Phase 2 backend spec (FastAPI + SQLModel + Neon)
- 🧠 Reflection: Generating screenshots from a test keeps them reproducible after UI changes.

## Evaluation notes (flywheel)

- Failure modes observed: first capture scrolled views and caught a toast; toast Dismiss click timed out (waited for auto-hide instead)
- Graders run and results (PASS/FAIL): lint PASS, typecheck PASS, capture PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
