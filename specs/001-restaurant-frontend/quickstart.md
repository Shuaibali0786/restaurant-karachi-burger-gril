# Quickstart: Karachi Burger & Grill — Frontend

## Prerequisites

- Node.js 20.9+ (verified on v24.13.0), npm 10+
- Git, a modern browser

## Run locally

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

## Quality gates (all must pass — Constitution VIII)

```bash
npm run lint         # eslint . — zero errors
npm run typecheck    # tsc --noEmit — strict
npm run test         # vitest — pricing, promos, time zone, validation, cart store
npm run build        # next build — zero errors
npm run test:e2e     # playwright — ordering flow, keyboard, axe AA scan, 4 viewports
# Screenshots for docs: SCREENSHOTS=1 npx playwright test tests/e2e/responsive.spec.ts --project=mobile-360 --project=desktop-1280
```

Lighthouse (Principle VII): `npm run build && npm run start`, then run Lighthouse (mobile) on
`/` and `/menu` — Performance and Accessibility must be ≥ 90.

## Manual acceptance walkthrough (≈ 5 min)

1. **Home** at 360px and 1280px: announcement bar, hero (headline, badges, "Loved across Karachi" card, embers),
   features, 8 category chips, Most Loved tabs, two promo banners with live countdown, Chef's
   specials, About teaser, "Sample reviews" label, "Taste the fire" band, footer.
2. **Customise → cart**: tap "Add +" on Burns Road Zinger → modal opens, cart unchanged → button
   disabled until "Double" chosen → add Extra cheese, qty 2 → button reads
   `Rs 2,180 | Add to cart →` → add → fly-to-cart + badge shows 2.
3. **Shareable page**: open `/menu/burns-road-zinger` directly; `/menu/nope` → branded 404.
4. **Cart**: open drawer → line shows Double, Extra cheese, unit Rs 1,090, total; subtotal
   Rs 2,180, delivery Free. Refresh → cart persists.
5. **Checkout**: submit empty → inline errors, focus on Name. Enter `0300-1234567`, area Clifton,
   address, COD → Place order → `KBG-XXXXXX` confirmation, tracker advances; cart empty.
6. **Menu**: search "tikka", filter BBQ, sort Price high→low; URL reflects state.
7. **Keyboard only**: repeat step 2 with Tab/Shift+Tab/Enter/Space/Esc; focus visible throughout,
   returns to the "Add +" button after closing the modal.
8. **Reduced motion**: enable OS "reduce motion" → no particles, floating or fly-to-cart; all
   content visible.
9. **Wings Wednesday**: in DevTools set time zone / system clock to a Wednesday in PKT → Fire Wings
   shows struck-through price and cart shows discount line.

## Photos

Source photos live in `assets/images/`; they are copied (same file names) to
`frontend/public/images/` during setup. Never add photos from other sources.
