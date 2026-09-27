# ADR-0002: Authentication, Session Cookie & Same-Origin API Proxy

- **Status:** Accepted
- **Date:** 2026-09-27
- **Feature:** 002-restaurant-backend
- **Context:** Customers sign up and log in with email or phone plus password; guests can still order. Admins run the kitchen from `/admin`. The owner specified argon2 (pwdlib), a 7-day JWT in an **httpOnly, Secure, SameSite=Lax cookie**, separate customer and admin roles, an admin created from `.env` by a seed command, CORS limited to `FRONTEND_URL`, and rate limiting with slowapi. The frontend (Vercel) and backend (Render/Railway) will be on **different sites**, where browsers do not send `SameSite=Lax` cookies on cross-site fetches.

## Decision

- **Transport**: the browser calls the API **same-origin**. `next.config.ts` rewrites `/api/:path*` → `${NEXT_PUBLIC_API_URL}/api/:path*`, and browser code in `lib/api.ts` uses the relative `/api/v1`. Server Components (public menu, no cookie) call `NEXT_PUBLIC_API_URL` directly.
- **Passwords**: pwdlib `PasswordHash.recommended()` (Argon2id), with `verify_and_update` rehashing. A dummy verify runs for unknown accounts, to keep timing uniform.
- **Session token**: PyJWT HS256 with `JWT_SECRET` (≥ 32 bytes, from `.env`). Claims are `sub`, `role`, `iat` and `exp` (7 days). The user is re-loaded on each request, so disabling an account or changing a role takes effect at once.
- **Cookie**: `kbg_session`, `HttpOnly`, `Secure` (configurable for local development), `SameSite=Lax`, `Path=/`, host-only on the frontend origin. Logout clears it.
- **Roles**: one `users` table with `role ∈ {customer, admin}`. Customers log in at `/auth/login`. `/admin/auth/login` accepts only admins and answers everyone else with the same generic error. Admin routes depend on `require_admin`. The only way to create an admin is `python -m app.cli create-admin`, which reads `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
- **Route guard**: `frontend/src/proxy.ts` redirects signed-out visitors away from `/admin/*` and `/account/*` for a better experience. The API is always the real enforcement point.
- **CSRF**: SameSite=Lax, plus JSON-only mutations, plus an Origin allow-list middleware (`FRONTEND_URL`). CORS is limited to the same list.
- **Abuse limits**: slowapi per-IP limits:
  - login: 20 per 15 minutes
  - signup: 5 per hour
  - orders: 10 per hour
  - contact and newsletter: 5 per hour
  - tracking: 60 per minute

  In addition, a **failed-login lockout** of 5 per 15 minutes per IP + identifier is built on the `limits` library, because slowapi counts all requests, not only failures. The client IP comes from the left-most `X-Forwarded-For` only when `TRUST_PROXY=true`. Storage is in memory, which means a single instance.

## Consequences

### Positive

- The owner's cookie design works in all major browsers without buying a domain. The token is never readable by JavaScript, which removes the XSS token-theft risk.
- `proxy.ts` can see the cookie, giving fast redirects for protected pages.
- CORS misconfiguration cannot break the main path, which is same-origin.
- One auth code path serves both roles, and privilege separation is enforced per route.

### Negative

- Every browser API call passes through Vercel (one extra hop), and Vercel's rewrite is not suited to streaming, which rules out SSE and WebSockets through it (see ADR-0004).
- Stateless JWTs cannot be revoked server-side before they expire (up to 7 days) other than by rotating `JWT_SECRET`, which signs everyone out.
- Rate-limit correctness depends on proxy headers being right, and in-memory counters reset on restart and do not scale out without Redis.

## Alternatives Considered

- **Cross-site cookie (`SameSite=None; Secure`) with direct browser calls**: blocked or degraded by Safari ITP and Chrome third-party-cookie protections.
- **Bearer token in localStorage**: exposed to XSS, and contradicts the owner's httpOnly requirement.
- **Same-site custom domains (`www.` + `api.`)**: valid, and a future option that needs no auth changes, but requires a domain before launch.
- **Server-side session table**: supports revocation but adds a database lookup per request and cleanup jobs. The owner chose JWT.
- **Separate admin identity table or service**: duplicate code for one admin user.

## References

- Feature Spec: [specs/002-restaurant-backend/spec.md](../../specs/002-restaurant-backend/spec.md) (FR-014–FR-019, FR-031–FR-035)
- Implementation Plan: [specs/002-restaurant-backend/plan.md](../../specs/002-restaurant-backend/plan.md)
- Research: R1, R7, R8, R12 in [research.md](../../specs/002-restaurant-backend/research.md)
- Related ADRs: ADR-0001, ADR-0004
- Evaluator Evidence: history/prompts/002-restaurant-backend/018-plan-restaurant-backend-phase-2.plan.prompt.md
