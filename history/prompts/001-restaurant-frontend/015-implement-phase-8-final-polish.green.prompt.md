---
id: 015
title: Implement phase 8 final polish
stage: green
date: 2026-09-27
surface: agent
model: claude-opus-5-5
feature: 001-restaurant-frontend
branch: 001-restaurant-frontend
user: Shuaibali0786
command: /sp.implement
labels: ["implement", "phase-8", "polish", "animation", "responsive", "accessibility", "seo", "performance", "lighthouse", "docs"]
links:
  spec: specs/001-restaurant-frontend/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - frontend/package-lock.json
 - frontend/package.json
 - frontend/src/app/about/page.tsx
 - frontend/src/app/combos/page.tsx
 - frontend/src/app/favourites/page.tsx
 - frontend/src/app/fonts.ts
 - frontend/src/app/globals.css
 - frontend/src/app/layout.tsx
 - frontend/src/app/menu/[slug]/page.tsx
 - frontend/src/app/menu/page.tsx
 - frontend/src/app/page.tsx
 - frontend/src/app/providers.tsx
 - frontend/src/components/cart/CartDrawer.tsx
 - frontend/src/components/forms/NewsletterForm.tsx
 - frontend/src/components/forms/PasswordInput.tsx
 - frontend/src/components/home/AboutTeaser.tsx
 - frontend/src/components/home/Categories.tsx
 - frontend/src/components/home/ChefSpecials.tsx
 - frontend/src/components/home/EmberParticles.tsx
 - frontend/src/components/home/FinalCta.tsx
 - frontend/src/components/home/Hero.tsx
 - frontend/src/components/home/MostLoved.tsx
 - frontend/src/components/home/PromoBanners.tsx
 - frontend/src/components/home/Testimonials.tsx
 - frontend/src/components/layout/Footer.tsx
 - frontend/src/components/layout/Logo.tsx
 - frontend/src/components/layout/MobileMenu.tsx
 - frontend/src/components/menu/FavouritesView.tsx
 - frontend/src/components/menu/ItemDetail.tsx
 - frontend/src/components/menu/ItemModal.tsx
 - frontend/src/components/menu/MenuBrowser.tsx
 - frontend/src/components/menu/MenuGrid.tsx
 - frontend/src/components/menu/ProductCard.tsx
 - frontend/src/components/ui/PageHero.tsx
 - frontend/src/components/ui/Rating.tsx
 - frontend/src/hooks/useCartView.ts
 - frontend/src/lib/api.ts
 - frontend/src/lib/validation.ts
 - specs/001-restaurant-frontend/quickstart.md
 - specs/001-restaurant-frontend/tasks.md
 - README.md
 - docs/PROJECT-JOURNEY.md
 - frontend/playwright.config.ts
 - frontend/src/app/apple-icon.tsx
 - frontend/src/app/opengraph-image.tsx
 - frontend/src/app/robots.ts
 - frontend/src/app/sitemap.ts
 - frontend/src/app/template.tsx
 - frontend/src/components/layout/Overlays.tsx
 - frontend/src/components/menu/DealPrice.tsx
 - frontend/src/components/menu/MenuHeroCollage.tsx
 - frontend/src/components/menu/cardMap.tsx
 - frontend/src/hooks/useCatalog.ts
 - frontend/src/hooks/useSheetDrag.ts
 - frontend/src/lib/brand.ts
 - frontend/src/lib/phone.ts
 - frontend/src/lib/site-url.ts
 - frontend/tests/e2e/a11y.spec.ts
 - frontend/tests/e2e/helpers.ts
 - frontend/tests/e2e/menu.spec.ts
 - frontend/tests/e2e/order-flow.spec.ts
 - frontend/tests/e2e/responsive.spec.ts
 - docs/screenshots/*.jpg (8 files)
tests:
 - 67 unit tests pass (Vitest)
 - lint / typecheck / build — 0 errors
 - Playwright on production build, 4 viewports (360/768/1280/1920): 164 passed, 20 skipped — order flow, keyboard-only, reduced motion, menu search/filter/404, axe WCAG 2.1 AA on 16 routes (0 violations), no horizontal overflow, 44 px tap targets
 - Lighthouse (median of 5, production build, this laptop): mobile home 71 / menu 72; desktop home 93 / menu 90; accessibility, best practices, SEO 100; CLS 0 (desktop menu 0.006)
---

## Prompt

Phase 7 looks great. A "Meal" upgrade includes Masala Fries + Chilled Cola — show that under the Meal option everywhere. Commit Phase 7. Then /sp.implement Phase 8 only (final polish):
- Menu page header: fill the empty right side with a tasteful collage of 2–3 food photos (burger, grill platter, wings) so it feels premium like the home hero.
- Animations: smooth page transitions, section reveals, hover states and the fly-to-cart everywhere, all respecting prefers-reduced-motion.
- Responsive: check every page at 360, 768, 1280 and 1920 px and fix any overflow, cramped spacing or tiny tap targets. The mobile menu, item bottom sheet and cart must feel like a native app.
- Accessibility: keyboard navigation, visible focus, alt text, labels, contrast AA.
- SEO: unique title and description per page, Open Graph image, favicon with our flame logo, sitemap and robots.
- Performance: next/image sizes, lazy loading, no layout shift; aim Lighthouse 90+.
- Run npm run build and npm run lint with zero errors.
- Write docs/PROJECT-JOURNEY.md fully (what was built in each phase, tech used and why, problems solved, screenshots placeholders) and a README.md for GitHub.
Stop after Phase 8, commit, and give me a short summary of the finished frontend and the Lighthouse scores.

(Resumed after a usage-limit pause with: "continue")

## Response snapshot

Committed Phase 7 with Meal includes (a10c521). Phase 8 (T093–T102): menu header photo collage; page-enter transition (template.tsx) and CSS scroll-driven reveals (transform only, off under reduced motion); drag-to-close item sheet, safe-area bottom bars, no tap flash, 44 px targets; AA fixes (ember-700 #b43c0c, Rating role=img, focusable review strip); SEO (per-page metadata, generated OG image and apple icon, flame icon.svg, sitemap with 33 items, robots, Restaurant JSON-LD); performance (CSS ember bed replaces LCP photo, code-split overlays mounted on first open with on-demand catalogue, server-rendered ProductCard with client islands, CSS-mask rating, light newsletter form, content-visibility on below-the-fold sections, fewer embers); Playwright + axe suite over 4 viewports with screenshots to docs/screenshots; docs/PROJECT-JOURNEY.md and README.md. Mobile Lighthouse stayed below 90 on this laptop (71/72) — reported honestly with a PageSpeed Insights re-measure recommended after deploy.

## Outcome

- ✅ Impact: Frontend feature-complete and polished; all 102 tasks done; documented for GitHub.
- 🧪 Tests: 67 unit + 164 e2e pass; axe 0 violations; gates green.
- 📁 Files: see list above
- 🔁 Next prompts: deploy to Vercel and measure with PageSpeed Insights; add real contact details; start the FastAPI backend feature
- 🧠 Reflection: The biggest mobile wins came from shipping less work to the phone (CSS instead of images and JS, server cards, content-visibility), not from micro-tuning.

## Evaluation notes (flywheel)

- Failure modes observed: Lighthouse scores vary widely with laptop load (benchmark index 1,300–1,900); a time-dependent checkout e2e test failed outside opening hours (clock now pinned)
- Graders run and results (PASS/FAIL): lint PASS, typecheck PASS, vitest PASS, build PASS, playwright PASS, axe PASS, Lighthouse mobile ≥ 90 FAIL (71/72), desktop PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): measure on PageSpeed Insights after deploy before further tuning
