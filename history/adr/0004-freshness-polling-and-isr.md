# ADR-0004: Data Freshness — 15 s Polling and 60 s ISR (No WebSockets)

- **Status:** Accepted
- **Date:** 2026-09-27
- **Feature:** 002-restaurant-backend
- **Context:** The customer tracker and the admin orders board must reflect changes within 15 seconds (FR-012, FR-020, SC-004). Sold-out flags and price edits must reach the menu. The Phase 1 site is statically generated for Lighthouse ≥ 90 (Constitution VII). Browser traffic goes through a Next.js rewrite (ADR-0002), which does not suit long-lived streaming connections. The owner specified 15-second polling.

## Decision

- **Polling hook**: `usePolling` refetches every **15 s**. It pauses while the tab is hidden, refetches on focus, backs off to 60 s after 3 consecutive errors, and stops on a `done` predicate.
  - **Tracker**: polls `GET /orders/{number}` and stops at `delivered` or `cancelled`.
  - **Admin board**: polls `GET /admin/orders?since=<last seen>`. The new-order alert combines:
    - a Web Audio chime, after one "Enable sound" click, because of autoplay rules;
    - a highlighted card;
    - an `aria-live` announcement;
    - a title badge.
- **Menu**: server-side fetches use **ISR `revalidate: 60`** with the `menu` tag. `generateStaticParams` tolerates an unreachable API (`[]` with `dynamicParams`). Checkout always re-validates availability and price on the server, so staleness can never sell a sold-out item.

## Consequences

### Positive

- No persistent connections, sticky sessions or reconnection logic. It works through the rewrite and on any host.
- Public pages keep static performance. The API can be briefly down without taking the menu offline.
- Easy to test: deterministic intervals and a plain REST contract.

### Negative

- Up to 15 s delay for status changes and new-order alerts, and up to 60 s for menu edits to appear. Correctness is still guaranteed at checkout.
- Constant light polling load while admin and tracker pages are open. This is negligible at restaurant scale.
- Audio alerts need a one-time click per admin session.

## Alternatives Considered

- **WebSockets**: instant, but need a streaming-capable path (not the Vercel rewrite), connection state and scaling concerns. Overkill for a 15 s requirement.
- **Server-Sent Events**: simpler than WebSockets, but share the same proxy and streaming limitations.
- **Fully dynamic rendering for menu pages**: always fresh, but slower TTFB and a Lighthouse regression.
- **On-demand `revalidateTag` webhook from the backend**: fresher menu, but a signed webhook adds moving parts. Kept as a follow-up if 60 s proves too slow.

## References

- Feature Spec: [specs/002-restaurant-backend/spec.md](../../specs/002-restaurant-backend/spec.md) (FR-003, FR-012, FR-020, SC-004)
- Implementation Plan: [specs/002-restaurant-backend/plan.md](../../specs/002-restaurant-backend/plan.md)
- Research: R10, R11 in [research.md](../../specs/002-restaurant-backend/research.md)
- Related ADRs: ADR-0002
- Evaluator Evidence: history/prompts/002-restaurant-backend/018-plan-restaurant-backend-phase-2.plan.prompt.md
