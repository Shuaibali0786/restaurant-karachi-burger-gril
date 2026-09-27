# Frontend Data-Layer Contract: `frontend/src/lib/api.ts` (Phase 2)

Supersedes `specs/001-restaurant-frontend/contracts/frontend-api.md`. Components keep calling the
same functions. Bodies switch from mock data to HTTP through `lib/http.ts`.

## Transport (`frontend/src/lib/http.ts`, new)

- **Base URL**:
  - On the server (`typeof window === "undefined"`): `${process.env.NEXT_PUBLIC_API_URL}/api/v1`.
  - In the browser: the relative `/api/v1`, served same-origin by the `next.config.ts` rewrite
    `/api/:path*` → `${NEXT_PUBLIC_API_URL}/api/:path*` (research R1).
- **Credentials**: `credentials: "include"` on browser calls (same-origin, so the cookie is
  first-party).
- **Caching**: public menu GETs made on the server use `next: { revalidate: 60, tags: ["menu"] }`.
  Everything else uses `cache: "no-store"`.
- **Errors**: a non-2xx response parses the envelope and throws
  `new ApiError(code, message, fields, details)`.
  - A network failure throws `ApiError("NETWORK", "We couldn't reach the kitchen. Check your connection and try again.")`.
  - A 5xx response throws `ApiError("INTERNAL", …)`.
- **Timeout**: 10 s through `AbortSignal.timeout(10_000)`.

`ApiErrorCode` gains every code in `contracts/openapi.yaml`, plus the client-only `NETWORK`.

## Existing functions (same name; signature unchanged unless noted)

| Function | Endpoint | Notes |
|---|---|---|
| `getSiteInfo()` | none (static `lib/data/site.ts`) | Out of spec scope; unchanged |
| `getCategories()` | `GET /categories` | |
| `getMenuItems(query?)` | `GET /menu-items?category&search&sort` | Filtering moves server-side; `filterMenu` stays for tests and export |
| `getMenuItem(slug)` | `GET /menu-items/{slug}` | Returns `null` on 404 |
| `getMenuSlugs()` | `GET /menu-items` → `slug`s | Used by `generateStaticParams`; returns `[]` on failure (R10) |
| `getFeaturedItems(placement)` | `GET /menu-items?featured=…&sort=popular` | |
| `getPromos()` | `GET /promos` | |
| `getTestimonials()` | `GET /testimonials` | `isSample` now boolean; the UI shows the "Sample reviews" label only when `isSample` |
| `getDeliveryAreas()` | `GET /delivery-areas` | Now includes `fee` |
| `placeOrder(input, opts?)` | `POST /orders` | **New optional** `opts.idempotencyKey`; the checkout form creates one per attempt with `crypto.randomUUID()` and reuses it on retry. Saves the returned number to the device list |
| `getOrder(id)` | `GET /orders/{id}` | `null` on 404. For an id found only in Phase 1 local storage (not on the server), returns the local copy with `status` from the old demo logic and `viewer: "public"`, labelled "placed on this device" |
| `getRecentOrders()` | Device numbers (localStorage) → `GET /orders/{n}` each (max 10); if signed in, merged with `GET /me/orders` | Track Order page |
| `login(input)` | `POST /auth/login` | **Return type changes** to `SessionUser` (was `{status:"coming-soon"}`) |
| `signup(input)` | `POST /auth/signup` | Same change; `email` and `phone` become optional (at least one required) |
| `sendContactMessage(input)` | `POST /contact-messages` | Return type unchanged |
| `subscribeNewsletter(email)` | `POST /newsletter-subscriptions` | Return type unchanged |

## New functions

| Function | Endpoint |
|---|---|
| `logout()` | `POST /auth/logout` |
| `getSession()` | `GET /auth/me` → `SessionUser \| null` (401 → null) |
| `getMyOrders(cursor?)` | `GET /me/orders` |
| `reorder(id)` | `POST /me/orders/{id}/reorder` → `{lines, skipped}`; the caller adds `lines` to the cart store and shows `skipped` |
| `submitReview(id, {rating, comment})` | `POST /me/orders/{id}/review` |
| `adminLogin(input)` | `POST /admin/auth/login` |
| `getAdminOrders({date,status,since})` | `GET /admin/orders` |
| `getAdminOrder(id)` | `GET /admin/orders/{id}` |
| `setOrderStatus(id, status, expectedStatus)` | `PATCH /admin/orders/{id}/status` |
| `getTodaySummary()` | `GET /admin/summary/today` |
| `getAdminMenuItems()` / `updateMenuItem(slug, patch)` | `GET` / `PATCH /admin/menu-items…` |
| `getAdminAreas()` / `createArea(a)` / `updateArea(id, patch)` | `/admin/delivery-areas…` |
| `getContactMessages({unread})` / `markMessageRead(id, isRead)` | `/admin/contact-messages…` |
| `getNewsletterSubscribers()` | `GET /admin/newsletter-subscribers` |
| `getAdminReviews({status})` / `moderateReview(id, status)` | `/admin/reviews…` |

## Type changes

See data-model.md "Frontend type changes". In addition, `OrderLine` gains `optionId` and
`addonIds`, so "Order again" and the review UI can reference the exact choices. The existing
fields are unchanged.

## Pricing on the client

`resolveCart` and `cartTotals` stay in the browser for instant display. `cartTotals` gains an
optional `deliveryFee` (default `150`). Checkout passes the selected area's `fee`. The server
remains authoritative: the confirmation page always shows the totals returned by `placeOrder`.
