---
id: 033
title: Fix Vercel build unreachable API
stage: green
date: 2026-09-28
surface: agent
model: claude-sonnet-5
feature: 002-restaurant-backend
branch: main
user: Shuaibali0786
command: /sp.implement
labels: ["deployment", "vercel", "build", "resilience"]
links: {spec: specs/002-restaurant-backend/spec.md, ticket: null, adr: history/adr/0004-freshness-polling-and-isr.md, pr: null}
files:
 - frontend/src/lib/http.ts
 - frontend/src/lib/server-data.ts
 - frontend/src/app/page.tsx
 - frontend/src/app/menu/page.tsx
 - frontend/src/app/menu/[slug]/page.tsx
 - frontend/src/app/cart/page.tsx
 - frontend/src/app/checkout/page.tsx
 - frontend/src/app/combos/page.tsx
 - frontend/src/app/favourites/page.tsx
 - frontend/package.json
 - docs/DEPLOYMENT.md
tests:
 - build with API refused: exit 0, six pages become on-demand (home, menu, cart, checkout, combos, favourites)
 - build with a black-hole API address (timeouts and retries): exit 0 in 2m46s
 - build against the live Render backend: exit 0, 61 static pages as before
 - vitest 86 passed, eslint and tsc clean
---

## Prompt

Vercel deploy of the frontend FAILED ... Error occurred prerendering page "/cart" ... ApiError: We couldn't reach the kitchen (code NETWORK). Find the root cause: /cart (and any other page) must NOT fail the build when the API is unreachable at build time ... Verify with the backend NOT reachable, run unit tests and lint, check Vercel settings (Node 24), commit and push to main.

## Response snapshot

Root cause: pages read the menu from the backend while Next.js pre-builds them; on Vercel the free Render backend was asleep, the 10 s timeout fired and the whole build exited. Fix in two layers: during the build only, requests wait longer (25 s, up to 3 tries, and 5xx counts as "still waking") and stop waiting once the backend has clearly not answered; if a page still cannot load its data during the build, `loadForPage` calls Next's `connection()` so that page is rendered per request instead of failing or baking in an error. At request time nothing changes. Node pinned to 24.x in engines.
