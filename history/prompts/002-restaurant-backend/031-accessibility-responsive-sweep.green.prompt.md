---
id: 031
title: Accessibility responsive sweep
stage: green
date: 2026-09-28
surface: agent
model: claude-sonnet-5
feature: 002-restaurant-backend
branch: 002-restaurant-backend
user: Shuaibali0786
command: /sp.implement
labels: ["accessibility", "responsive", "admin", "account", "e2e"]
links: {spec: specs/002-restaurant-backend/spec.md, ticket: null, adr: null, pr: null}
files:
 - frontend/tests/e2e/authed-pages.spec.ts
 - frontend/tests/e2e/responsive.spec.ts
 - frontend/tests/e2e/account.spec.ts
 - frontend/src/components/admin/AdminShell.tsx
 - frontend/src/components/admin/AreasTable.tsx
 - frontend/src/components/admin/MenuTable.tsx
 - frontend/src/components/admin/MessagesList.tsx
 - frontend/src/components/admin/OrderDetail.tsx
 - frontend/src/app/admin/(panel)/page.tsx
 - specs/002-restaurant-backend/tasks.md
tests:
 - authed-pages.spec.ts on mobile-360, tablet-768, desktop-1280, wide-1920: admin pages (/admin, menu, areas, messages, reviews, an order) and /account/orders (empty and with a delivered order): axe WCAG 2.1 AA, no horizontal scroll, 44px controls, all pass
 - a11y, responsive and menu specs on all four viewports: 161 passed (includes /login, /signup, /admin/login); tap-target check extended to those three pages
---

## Prompt

3. Run accessibility and responsive (360/768/1280/1920) checks on /login, /signup, /account/orders and all /admin pages, and fix anything found.

## Response snapshot

Found and fixed: admin dashboard had no h1; the icon-only Sign out button had no accessible name and the logo/sign-out were under 44px; On/Off and sold-out/hidden toggles were too narrow; the Messages tablist wrongly contained a checkbox; the order detail used definition lists without terms. /login, /signup and /account/orders were already clean. The account e2e now uses a fresh phone number per run (phone is unique per account).
