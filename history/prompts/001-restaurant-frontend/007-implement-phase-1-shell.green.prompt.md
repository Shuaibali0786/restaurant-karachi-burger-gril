---
id: 007
title: Implement phase 1 site shell
stage: green
date: 2026-09-26
surface: agent
model: claude-opus-5-5
feature: 001-restaurant-frontend
branch: 001-restaurant-frontend
user: Shuaibali0786
command: /sp.implement
labels: ["implement", "phase-1", "nextjs", "design-tokens", "navbar", "footer"]
links:
  spec: specs/001-restaurant-frontend/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - .gitignore
 - frontend/ (create-next-app scaffold: package.json, tsconfig.json, eslint.config.mjs, next.config.ts)
 - frontend/public/images/*.jpg (38 photos)
 - frontend/src/app/globals.css
 - frontend/src/app/fonts.ts
 - frontend/src/app/layout.tsx
 - frontend/src/app/providers.tsx
 - frontend/src/app/page.tsx
 - frontend/src/app/icon.svg
 - frontend/src/lib/types.ts
 - frontend/src/lib/api.ts
 - frontend/src/lib/data/site.ts
 - frontend/src/lib/format.ts
 - frontend/src/lib/cn.ts
 - frontend/src/hooks/useScrolled.ts
 - frontend/src/hooks/useModalDialog.ts
 - frontend/src/components/ui/Button.tsx
 - frontend/src/components/ui/Badge.tsx
 - frontend/src/components/ui/SectionHeading.tsx
 - frontend/src/components/ui/Reveal.tsx
 - frontend/src/components/layout/Logo.tsx
 - frontend/src/components/layout/AnnouncementBar.tsx
 - frontend/src/components/layout/SkipLink.tsx
 - frontend/src/components/layout/SocialIcons.tsx
 - frontend/src/components/layout/SearchDialog.tsx
 - frontend/src/components/layout/MobileMenu.tsx
 - frontend/src/components/layout/Navbar.tsx
 - frontend/src/components/layout/Footer.tsx
 - specs/001-restaurant-frontend/tasks.md
 - specs/001-restaurant-frontend/research.md
tests:
 - npm run lint (0 errors)
 - npm run typecheck (0 errors)
 - npm run build (0 warnings)
 - Playwright MCP visual check at 1280px and 360px; mobile menu, search dialog, Esc + focus restore
---

## Prompt

Phase 1 only. Stop after Phase 1 is complete. Then tell me the exact commands to run in CMD and what I should see at http://localhost:3000.

## Response snapshot

Completed T001–T024. Scaffolded Next 16.3.6 in /frontend; installed motion, zustand, RHF, zod, resolvers, lucide-react, vitest, playwright (bumped @types/node to ^24 to satisfy vitest 5 peer). Copied 38 photos. Tokens via Tailwind v4 @theme (incl. ember-700 for AA text), fonts via next/font (Big_Shoulders — Display export no longer exists), SVG flame logo, announcement bar, sticky navbar (transparent over home band, solid on scroll/other routes), native-dialog mobile menu and search dialog on a shared useModalDialog hook, footer with inline social SVGs. Fixes found in verification: Reveal switched from motion to CSS so SSR content is never hidden; "Order Now" hidden-class conflict caused 360px overflow; search input autofocus; Next 16 `preload` replaces `priority`, `images.qualities` required; removed Next.js default favicon (other brand) and added flame icon.svg.

## Outcome

- ✅ Impact: Phase 1 shell done; lint/typecheck/build clean; no horizontal overflow at 360px.
- 🧪 Tests: quality gates + manual browser verification (no unit tests in Phase 1 by plan)
- 📁 Files: see list above
- 🔁 Next prompts: /sp.implement Phase 2
- 🧠 Reflection: Reading the bundled Next 16 docs caught two API changes before they became bugs.

## Evaluation notes (flywheel)

- Failure modes observed: vitest 5 peer conflict with scaffold @types/node 20; utility-class conflict (hidden vs inline-flex); dev hydration warning caused only by Playwright caret-color injection
- Graders run and results (PASS/FAIL): lint PASS, typecheck PASS, build PASS, brand scan PASS, raw-hex scan PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
