# ADR-0005: Customer and Admin Sessions on One Cookie, with Role- and Viewer-Based Access

- **Status:** Accepted
- **Date:** 2026-09-28
- **Feature:** 002-restaurant-backend
- **Context:** ADR-0002 chose the cookie, JWT and one `users` table with two roles. Building User Stories 4, 5 and 6 raised a follow-on question that ADR-0002 leaves open: how do customers and staff share one session mechanism without staff powers leaking to customers, and without a customer's own data leaking to anyone else? The site has three kinds of visitor for the same order: the guest or stranger with only an order number, the customer who placed it, and staff who run it. The same person may also be both (an admin who orders lunch).

## Decision

- **One session, two login doors.** Both roles use the same `kbg_session` cookie and the same `authenticate()` check. Customers sign in at `POST /auth/login`. Staff sign in at `POST /admin/auth/login`, which passes `require_role="admin"`. A customer account, a wrong password and an unknown account all get the same `INVALID_CREDENTIALS` answer, so the admin door cannot be used to find out who is an admin.
- **Role is re-read on every request.** The token carries only the user id. `get_current_user_optional` loads the user each time, so a disabled account or a changed role takes effect at once. Admin routes depend on `require_admin`; `/me/*` routes depend on `CurrentUser`.
- **Viewer resolution decides what an order shows.** `get_order_view` resolves the caller to `admin`, `owner` (the session user id equals `order.user_id`) or `public`. Only `admin` and `owner` see the full phone and address. `public` gets a masked phone and no address. Another customer's order is `public` to them; `reorder` and `/me/orders` return 404 or nothing for orders that are not theirs, never a masked copy.
- **Guests stay first-class.** `POST /orders` reads the session optionally. A signed-in order stores `user_id`; a guest order stores none and is reachable only by its number (masked).
- **The frontend treats the cookie as the source of truth.** The Zustand `useSession` store is not persisted; the Navbar loads it once. The admin shell and the account page both check it and redirect. `proxy.ts` redirects visitors with no cookie at all, as a speed-up only.
- **Same cookie means one identity per browser.** Logging in as a customer replaces an admin session in that browser, and the reverse. The two panels are meant to be used in different browsers or profiles.

## Consequences

### Positive

- One code path for passwords, lockout, cookies and rate limits; less to get wrong.
- Every privacy rule lives in the API (`viewer`, `require_admin`, ownership checks). The UI hiding a button is never the only protection.
- No account-enumeration difference between the customer and admin login doors.
- An admin can also be a customer and see their own orders normally.

### Negative

- One browser cannot be signed in as customer and admin at once. A tester who logs in as the admin and then as a customer is signed out of the admin panel.
- Role changes and disabled accounts apply immediately, but an already-issued token cannot be revoked before it expires (see ADR-0002).
- Every request that needs a user costs one extra database lookup.
- Viewer rules must be remembered by each new endpoint. Reviews and any future order data must reuse the same resolution instead of inventing their own.

## Alternatives Considered

- **Separate cookies and separate login systems for staff and customers**: allows both to be signed in together and isolates a customer-side compromise from staff, but duplicates the auth code and needs a second cookie name, second guard and second rate limits for a one-admin business.
- **Put the role only in the token and skip the per-request user lookup**: faster, but a demoted or disabled admin would keep access until the token expired.
- **Show guests their own order details through a per-order secret link**: better for guests, but not in the spec and a new secret to leak; masked public view plus the device's saved copy covers the need.
- **Role-based access decided in the UI only**: rejected; the API must be the enforcement point.

## References

- Feature Spec: [specs/002-restaurant-backend/spec.md](../../specs/002-restaurant-backend/spec.md)
- Implementation Plan: [specs/002-restaurant-backend/plan.md](../../specs/002-restaurant-backend/plan.md)
- Extends: [ADR-0002](0002-auth-session-and-same-origin-proxy.md) (no conflict; it adds viewer resolution and the two-door login)
- Code: `backend/app/api/deps.py`, `backend/app/services/auth.py`, `backend/app/services/orders.py` (`get_order_view`, `reorder`), `frontend/src/stores/session.ts`, `frontend/src/proxy.ts`
- Evaluator Evidence: history/prompts/002-restaurant-backend/025-implement-user-story-4-admin-panel.green.prompt.md, 026-implement-user-story-5-customer-accounts.green.prompt.md
