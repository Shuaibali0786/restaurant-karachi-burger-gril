---
id: 024
title: Implement user story 3 tracking
stage: green
date: 2026-09-27
surface: agent
model: claude-sonnet-5
feature: 002-restaurant-backend
branch: 002-restaurant-backend
user: Shuaibali0786
command: /sp.implement
labels: ["backend", "frontend", "tracking", "polling", "privacy", "cli"]
links:
  spec: specs/002-restaurant-backend/spec.md
  ticket: null
  adr: history/adr/0004-freshness-polling-and-isr.md
  pr: null
files:
 - backend/app/services/orders.py
 - backend/app/api/routes/orders.py
 - backend/app/cli.py
 - backend/tests/integration/test_tracking_api.py
 - frontend/src/hooks/usePolling.ts
 - frontend/src/lib/orders.ts
 - frontend/src/lib/api.ts
 - frontend/src/components/checkout/OrderTracker.tsx
 - frontend/src/components/checkout/OrderConfirmation.tsx
 - frontend/src/components/checkout/TrackOrder.tsx
 - frontend/tests/unit/usePolling.test.ts
 - frontend/tests/unit/orders.test.ts
 - frontend/package.json
 - specs/002-restaurant-backend/tasks.md
tests:
 - backend: uv run pytest -q -> 71 passed, 39 skipped (need TEST_DATABASE_URL); test_tracking_api.py covers public masking, owner/admin full details, another customer still gets the public view, 404, statusHistory order, rate limit
 - backend: ruff check/format, mypy app -> all clean
 - frontend: npm test -> 85 passed; new usePolling.test.ts (jsdom + fake timers) covers the 15s cadence, hidden-tab pause, focus refetch, error backoff/recovery, done-stops-polling, disabled+initialData, unmount cleanup
 - frontend: lint / tsc --noEmit / next build -> clean
 - e2e (real backend, real Neon dev DB): order-flow.spec.ts + a11y.spec.ts full suites re-run, no regressions from the tracker rebuild
 - manual: a live browser tab open on a real order's tracker page picked up two CLI-driven status changes (confirmed→preparing, then →cancelled) within 15 seconds each, with no reload; public masking verified end to end on an order this browser had no local record of
---

## Prompt

Commit User Story 1. Then /sp.implement User Story 3 only (real order tracking): the /order/[number] page reads the real status from the API and refreshes every 15 seconds, hides the customer's phone and street address on the public tracker, and shows Cancelled properly. Remove the old demo auto-advance. Stop after US3 and tell me in simple steps how to see the status change on the tracker (for now you can change the status for me with a command, until the admin panel exists).

## Response snapshot

Confirmed US1 was already committed (f09c848). Implemented US3: `mask_phone` (first + last two digits only) and viewer resolution (admin / owner-by-user_id / public) in `get_order_view`, `GET /api/v1/orders/{number}` (optional session, 60/min rate limit, 404 for unknown/malformed numbers), and — since the user explicitly asked for a way to change status themselves before the admin panel exists — a `change_status` state-machine helper plus a `set-order-status` CLI command (validates the same forward-only/cancel-anytime transitions as the data model, ahead of US4's own admin endpoint, noted as such in tasks.md). On the frontend: `usePolling` (15s cadence, pauses on `document.hidden`, refetches on focus/visibility, backs off to 60s after 3 failures, stops on a `done` predicate, cleans up on unmount — verified with fake timers under jsdom, newly added as dev dependencies), `lib/orders.ts` stripped of the demo elapsed-time simulation in favour of `stageIndexFor(status)`, and `OrderTracker`/`OrderConfirmation`/`TrackOrder` rebuilt on real polled data with a distinct Cancelled state and viewer-aware field visibility. `getOrder`/`getRecentOrders` in `lib/api.ts` now call the API but merge in the device's own locally-saved full details when the server's answer is masked (`viewer: "public"`) and this device placed the order itself, so a guest never loses sight of their own address after leaving the confirmation page. Verified live: opened a real order's tracker in a browser, changed its status twice via the new CLI command, and watched both updates (Preparing, then Cancelled) land automatically within 15 seconds with no reload; also hit one transient Neon DNS blip mid-session, which surfaced as a correctly-handled INTERNAL error and self-recovered on the next poll.

## Outcome

- ✅ Impact: the order tracker now shows real, live, privacy-masked status; staff (via a CLI command, pending the admin panel) can move orders through their lifecycle
- 🧪 Tests: 71 backend + 85 frontend unit tests, full e2e suites re-run with no regressions
- 📁 Files: ~14 changed/new files across backend/ and frontend/
- 🔁 Next prompts: User Story 4 (admin panel with sign-in) is the natural next step, and will extend `change_status` with the optimistic-locking `expected` parameter for real concurrent-staff safety
- 🧠 Reflection: mixing vitest fake timers with testing-library's `waitFor` deadlocks (waitFor's own polling never advances under fake time); flushing microtasks manually with `act(async () => { await Promise.resolve(); })` avoided it

## Evaluation notes (flywheel)

- Failure modes observed: a `vi.useFakeTimers()` + `@testing-library/react` `waitFor` combination hung indefinitely in the first test run; testing hooks required adding jsdom + @testing-library/react (this repo's first hook-level unit tests, everything before was pure-logic tests or Playwright)
- Graders run and results (PASS/FAIL): ruff/mypy/eslint/tsc/pytest/vitest/playwright all PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): default to manual microtask flushing (`act(async () => { await Promise.resolve(); })`) over testing-library's `waitFor` whenever a test also uses fake timers
