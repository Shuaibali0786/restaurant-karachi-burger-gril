# ADR-0003: Server-Authoritative Pricing, Parity Fixtures & Seed Export

- **Status:** Accepted
- **Date:** 2026-09-27
- **Feature:** 002-restaurant-backend
- **Context:** The browser already computes prices instantly (`frontend/src/lib/pricing.ts`: options with per-item overrides, extras, Wings Wednesday 20% in PKT rounded per unit, Rs 150 delivery, free delivery at Rs 1,500). The server must never trust browser prices (FR-005), yet customers must see the same numbers they are charged. The 33-item menu exists only as TypeScript data, and it must seed the database exactly (FR-002). The owner asked for one pricing module as the source of truth, with tests proving it matches the frontend for every menu item.

## Decision

- **Authority**: `backend/app/services/pricing.py` is the only server pricing code, mirroring the frontend functions one to one (`unit_price`, `active_promo_for`, `promo_discount_per_unit`, `resolve_cart`, `cart_totals`). Values are integer rupees only. Order requests reject any price fields (`extra="forbid"`). Every order is re-priced from the database menu, today's promos (PKT), the chosen area's fee and the free-delivery threshold setting.
- **Rounding**: discounts use `(unit * percent + 50) // 100`, which matches JavaScript's `Math.round` half-up rounding. Python's half-to-even `round()` is never used for money.
- **Parity proof**: `frontend/scripts/export-backend-data.ts` (tsx) runs the **real frontend modules** to produce `backend/tests/fixtures/pricing_golden.json`. It covers every item × option × {none, each single extra, all extras} × {Wednesday, non-Wednesday}, plus cart-total scenarios around the threshold. `test_pricing_parity.py` asserts equality. `--check` mode fails when committed fixtures are stale.
- **Seed export**: the same script writes `backend/app/seed/data/*.json` (categories, options, extras, 33 items, promos, 6 areas at Rs 150, sample testimonials). `app.cli seed` upserts by natural key and never overwrites staff edits unless `--reset-menu` is passed.
- **Client display**: the browser keeps its pricing for instant feedback. `cartTotals` takes the selected area's `deliveryFee`. The confirmation page shows only server-returned totals.
- **Data ownership**: after launch the **database** owns the live menu. `frontend/src/lib/data/*` remains only as the export source and test oracle, and components never import it (ESLint rule).

## Consequences

### Positive

- Tampered prices are impossible to charge. Displayed and charged totals are provably equal for the whole catalogue.
- No hand-retyping of 33 items, options and overrides, so the seed matches Phase 1 byte for byte.
- A frontend pricing change without a matching backend change fails the gates instead of silently mischarging.

### Negative

- Pricing logic exists in two languages. Every rule change must be made twice, although the parity tests enforce it.
- After admins edit prices in the database, the TypeScript data no longer reflects live prices. It is a launch snapshot and oracle, not a mirror, and the docs say so.
- Adds `tsx` as a frontend dev dependency and a cross-folder generated-file step.

## Alternatives Considered

- **Server quote endpoint for every cart change (single implementation)**: removes duplication, but adds latency to an instant UI and changes component behaviour (FR-036).
- **Trust client totals and verify only a checksum**: still requires server pricing to verify. No benefit.
- **Hand-written Python seed**: error-prone, and drifts from the frontend.
- **Run the TypeScript pricing inside Python (JS engine or WASM)**: heavy dependency, unusual, and hard to debug.

## References

- Feature Spec: [specs/002-restaurant-backend/spec.md](../../specs/002-restaurant-backend/spec.md) (FR-001–FR-009, SC-002)
- Implementation Plan: [specs/002-restaurant-backend/plan.md](../../specs/002-restaurant-backend/plan.md)
- Research: R5, R6 in [research.md](../../specs/002-restaurant-backend/research.md)
- Related ADRs: ADR-0001
- Evaluator Evidence: history/prompts/002-restaurant-backend/018-plan-restaurant-backend-phase-2.plan.prompt.md
