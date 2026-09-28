# Feature Specification: Restaurant Backend (Phase 2)

**Feature Branch**: `002-restaurant-backend`
**Created**: 2026-09-27
**Status**: Draft
**Input**: User description: "Phase 2: BACKEND for Karachi Burger & Grill, connected to the existing frontend (keep all frontend UI and design as is). Stack: Python FastAPI + SQLModel + Neon Postgres (region Singapore), managed with uv, in a /backend folder. The frontend's lib/api.ts switches from mock data to this API. Features: 1. Menu from the database … 2. Real orders … 3. Order tracking … 4. Customer accounts … 5. Admin panel at /admin … 6. Contact form messages and newsletter signups … 7. Real reviews … Security: secrets only in backend/.env … rate limiting on login and order endpoints. Keep updating docs/PROJECT-JOURNEY.md." (full text in the PHR for this spec)

## Overview

Phase 1 delivered a finished customer website that runs on built-in sample data: orders live only
in the customer's browser, accounts and forms are "coming soon", and the home page shows labelled
"Sample reviews". Phase 2 turns it into a working restaurant system. It keeps the menu, orders,
customers, messages and reviews in one central store, gives the restaurant staff an admin panel,
and connects the existing screens to it **without changing their look, layout or behaviour**. New
screens (admin panel, "My orders", review form) follow the existing design system.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Place a real order that the restaurant receives (Priority: P1)

A hungry customer browses the menu, fills the cart and checks out (Cash on Delivery, as today). The
order reaches the restaurant, not just the customer's browser. The restaurant works out every price
again from its own menu, applies today's deals and the delivery rules, and checks opening hours and
the delivery area. It then saves the order with a readable number such as `KBG-10234` and status
**Confirmed**. The customer lands on the existing confirmation page.

**Why this priority**: Without real orders the business earns nothing; every other feature supports this.

**Independent Test**: Place an order from the site, then confirm it exists centrally with correct
totals, number and status. Also confirm that a tampered price sent from the browser is ignored.

**Acceptance Scenarios**:

1. **Given** an open restaurant and a cart of valid items, **When** the customer checks out with a valid name, Pakistani mobile number, delivery area and address, **Then** the order is saved with a unique `KBG-#####` number, status Confirmed, and totals the restaurant calculated itself, and the customer sees the confirmation page for that number.
2. **Given** a request whose item prices, discounts or totals were altered in the browser, **When** it is submitted, **Then** the saved order uses only menu prices and rules, ignoring the altered values.
3. **Given** it is Wednesday in Pakistan time, **When** an order contains Fire Wings, **Then** the Wings Wednesday discount (20%, rounded to the nearest rupee per unit) is applied. **Given** any other day, **Then** no wings discount is applied.
4. **Given** the amount after discounts is below Rs 1,500, **When** the order is placed, **Then** the delivery fee for the chosen area is charged. **Given** it is Rs 1,500 or more, **Then** delivery is free.
5. **Given** the restaurant is closed (outside 12 noon – 3 AM Pakistan time), **When** a customer tries to order for "as soon as possible", **Then** the order is refused with a clear "we're closed" message that shows opening hours.
6. **Given** a cart containing a sold-out item or an item removed from the menu, **When** checking out, **Then** the order is refused and the customer is told which items to remove.
7. **Given** a delivery area that is disabled or unknown, **When** checking out, **Then** the order is refused with a message asking the customer to pick a listed area.
8. **Given** the same device submits many orders in a short time, **When** it passes the order limit, **Then** further attempts are refused temporarily with a friendly "please wait" message.

---

### User Story 2 - Menu comes from the restaurant's own records (Priority: P1)

Everything the customer sees on the menu comes from the central records: categories, all 33 items,
size/option choices, extras, tags, photos, prices and deals. It is first filled with exactly the
current website content, so the site looks identical on day one. When staff mark an item sold out
or change a price, the website shows the change.

**Why this priority**: Orders can only be priced safely against one authoritative menu, and staff need it to reflect reality (sold out, price changes).

**Independent Test**: Compare every menu page before and after the switch (same items, prices, photos, order). Then mark one item sold out and confirm the site shows it as unavailable and refuses to sell it.

**Acceptance Scenarios**:

1. **Given** the first fill of the records, **When** any menu, category, item or home page is viewed, **Then** names, prices, options, extras, tags, photos, ratings and ordering match Phase 1 exactly.
2. **Given** an item marked sold out, **When** customers view it, **Then** it still appears but shows as "Sold out" and cannot be added to the cart.
3. **Given** an item marked unavailable (hidden), **When** customers browse, **Then** it does not appear in menu lists or search. Its direct page shows a "not available" state instead of an error.
4. **Given** a price change by staff, **When** a customer next views the item or checks out, **Then** the new price is shown and charged.

---

### User Story 3 - Follow the order live (Priority: P1)

After ordering, the customer watches the existing tracker page for their order number. It shows the
real status set by the restaurant: Confirmed → Preparing → On the way → Delivered, or Cancelled. It
updates by itself without reloading.

**Why this priority**: Customers expect live tracking. The Phase 1 tracker only simulated progress, which becomes misleading once orders are real.

**Independent Test**: Place an order, change its status from the admin panel, and watch the tracker update within the refresh interval without a manual reload.

**Acceptance Scenarios**:

1. **Given** an order in status Preparing, **When** the customer opens its tracker page, **Then** the Preparing step is shown as current, with earlier steps completed.
2. **Given** the tracker page is open, **When** staff change the status, **Then** the page shows the new status within 15 seconds without a manual refresh.
3. **Given** an order is Cancelled, **When** its tracker page is viewed, **Then** a clear "Cancelled" state replaces the progress steps.
4. **Given** the order reaches Delivered or Cancelled, **Then** the page stops checking for updates.
5. **Given** an order number that does not exist, **When** its tracker page is opened, **Then** the existing "order not found" state is shown.
6. **Given** someone who is not the customer or staff opens a tracker page, **Then** they see status, items and totals, but not the customer's phone number or street address.

---

### User Story 4 - Staff run orders from the admin panel (Priority: P1)

A staff member signs in at `/admin`. They see today's orders as they arrive, with an audible and
visible new-order alert. They open an order to see the customer's details and items, move it through
the statuses, and see today's sales total and order count.

**Why this priority**: Real orders are useless if the kitchen cannot see and progress them.

**Independent Test**: Sign in as admin, place an order from another browser, and confirm the alert fires. Then move the order through each status and confirm today's totals update.

**Acceptance Scenarios**:

1. **Given** a signed-in admin on the orders screen, **When** a new order is placed, **Then** it appears at the top within 15 seconds with a sound and a visible highlight until opened.
2. **Given** an order, **When** the admin opens it, **Then** they see order number, time, customer name, phone, full address, area, timing (ASAP or scheduled slot), items with options/extras/notes, and totals.
3. **Given** an order in a given status, **When** the admin changes it, **Then** only forward steps (Confirmed → Preparing → On the way → Delivered) or Cancelled (before Delivered) are allowed. Each change is saved with its time.
4. **Given** today's orders, **Then** the dashboard shows the number of orders and the sales total for the current Pakistan-time business day. Cancelled orders are excluded from sales.
5. **Given** a visitor who is not signed in as admin, or a signed-in customer, **When** they open `/admin` or any admin function, **Then** they are refused and sent to the admin sign-in.

---

### User Story 5 - Customer accounts and "My orders" (Priority: P2)

A customer can sign up with name, email or phone, and a password, then log in with email or phone
plus password. Orders placed while signed in are saved to their account. A "My orders" page lists
past orders with status and totals, and offers "Order again", which refills the cart. Guests can
still check out without an account.

**Why this priority**: Accounts drive repeat orders, but ordering works without them.

**Independent Test**: Sign up, place two orders, sign out and in again, open "My orders", and use "Order again" to refill the cart.

**Acceptance Scenarios**:

1. **Given** a new visitor, **When** they sign up with a valid name, a valid email and/or Pakistani mobile number, and a password of at least 8 characters, **Then** the account is created and they are signed in.
2. **Given** an email or phone already registered, **When** someone signs up with it, **Then** sign-up is refused with a message suggesting they log in.
3. **Given** an existing account, **When** the customer logs in with either their email or phone and the correct password, **Then** they are signed in. **Given** a wrong password or unknown account, **Then** they see one generic "incorrect details" message.
4. **Given** repeated failed logins, **When** the login limit is passed, **Then** further attempts are refused temporarily.
5. **Given** a signed-in customer, **When** they check out, **Then** name and phone are pre-filled, and the order appears in "My orders".
6. **Given** a past order, **When** the customer taps "Order again", **Then** the cart is filled with those items at current prices. Items no longer sold are skipped, with a notice listing them.
7. **Given** a guest, **When** they check out, **Then** the order is placed without signing in, as in Phase 1.

---

### User Story 6 - Staff manage menu, delivery areas and messages (Priority: P2)

From the admin panel, staff edit item prices, hide or show items, and mark items sold out or back in
stock. They add, edit, enable or disable delivery areas and their delivery fees. They read contact
messages sent from the website and see newsletter sign-ups.

**Why this priority**: Day-to-day upkeep without a developer, but the site works with the initial data.

**Independent Test**: Change a price, add a delivery area with a fee, and send a contact message. Confirm each change shows on the customer site and in the admin panel.

**Acceptance Scenarios**:

1. **Given** the admin menu screen, **When** staff change a price (a whole number of rupees above zero), **Then** the site and new orders use it. Past orders keep the price they were placed at.
2. **Given** the admin areas screen, **When** staff add an area with a fee, or disable an area, **Then** checkout lists only enabled areas and charges the new fee.
3. **Given** a visitor submits the contact form, **Then** the message is saved and appears in the admin messages list, newest first, with a read/unread marker.
4. **Given** a visitor subscribes to the newsletter, **Then** the email is saved once. A repeat sign-up succeeds without creating a duplicate.

---

### User Story 7 - Real reviews replace sample reviews (Priority: P3)

A signed-in customer whose order was delivered can rate it 1–5 stars with a short comment. Staff
approve or reject reviews. Once approved reviews exist, the home page shows them in place of the
"Sample reviews".

**Why this priority**: Builds trust (Constitution X: no fake reviews), but depends on delivered orders and accounts.

**Independent Test**: Deliver an order to a test account, leave a review, approve it in the admin panel, and confirm it appears on the home page without the "Sample reviews" label.

**Acceptance Scenarios**:

1. **Given** a signed-in customer with a Delivered order, **When** they open that order in "My orders", **Then** they can submit one review (1–5 stars, optional comment up to 500 characters).
2. **Given** a customer with no Delivered order, or an order already reviewed, **Then** no review can be submitted for it.
3. **Given** a new review, **Then** it is hidden from the public until an admin approves it.
4. **Given** at least 3 approved reviews, **When** the home page is viewed, **Then** it shows the latest approved reviews (first name and last initial, stars, comment, month) and no "Sample reviews" label. **Given** fewer than 3, **Then** the labelled sample reviews remain.

---

### Edge Cases

- **Deal ends mid-checkout**: a cart built on Wednesday is submitted after midnight Pakistan time. The order is priced without the discount, and the customer sees the existing "deal ended" notice before confirming.
- **Price changed since the cart was built**: the order uses the current price, and the confirmation shows the charged amount.
- **Scheduled orders**: a scheduled slot must fall within today's service window (12 noon – 3 AM PKT) and be at least 45 minutes ahead. Otherwise it is refused. Scheduled orders may be placed while closed only for slots after opening.
- **Duplicate submission** (double tap or retry after a network drop): only one order is created for the same checkout attempt.
- **Order number collisions**: numbers are unique and never reused. Numbers start at `KBG-10001` and increase.
- **Invalid input** (overlong notes, quantity 0 or above 20, bad phone or email, script in text fields): refused with field-level messages. Stored text is shown as plain text only.
- **Central store unreachable**: the menu shows a friendly "we're having trouble loading the menu" state with retry. Checkout shows an error, and the cart is kept so nothing is lost.
- **Admin status race**: two staff change the same order at once. The later change is rejected if it is no longer a valid next step, and the screen refreshes.
- **Old Phase 1 orders** saved only in a browser: they are not migrated. The Track Order page keeps showing them as before, labelled as placed on this device.
- **Account deleted or disabled**: that account's orders remain visible to staff.

## Requirements *(mandatory)*

### Functional Requirements

**Menu**
- **FR-001**: The system MUST store categories, menu items (33 at launch), option groups and options with per-item price overrides, extras, tags, photos, ratings, popularity rank, featured placements and deals centrally. It MUST serve them to the website.
- **FR-002**: The initial menu data MUST be loaded from the current Phase 1 website content, so the customer site is identical after the switch. The load MUST be repeatable without creating duplicates.
- **FR-003**: Each item MUST have two independent flags, *available* (shown or hidden) and *sold out* (shown but not orderable). Staff can change both.

**Orders & pricing**
- **FR-004**: The system MUST accept Cash-on-Delivery orders from guests and signed-in customers, with name, Pakistani mobile number, delivery area, address, optional delivery notes, timing (ASAP or a scheduled slot) and cart lines (item, option, extras, quantity, note).
- **FR-005**: The system MUST calculate every price itself from the central menu: unit price, deal discount, line total, subtotal, delivery fee and total. It MUST ignore any prices or totals sent from the browser.
- **FR-006**: Wings Wednesday (20% off the eligible item, rounded to the nearest rupee per unit) MUST apply only when the order is placed on a Wednesday in Pakistan time (UTC+5).
- **FR-007**: The delivery fee MUST be the chosen area's fee. Delivery MUST be free when the amount after discounts is at least the free-delivery threshold (Rs 1,500 at launch).
- **FR-008**: ASAP orders MUST be refused outside opening hours (12 noon – 3 AM PKT). Orders for disabled or unknown areas, and orders containing sold-out, hidden or unknown items, options or extras, MUST be refused. Each refusal MUST carry a customer-readable reason.
- **FR-009**: Each saved order MUST get a unique, never-reused number in the format `KBG-` followed by at least 5 digits. It MUST record status Confirmed, the time placed, and a copy of each item's name, choices and prices as charged.
- **FR-010**: The same checkout attempt submitted more than once MUST create only one order.

**Tracking**
- **FR-011**: Order status MUST be one of Confirmed, Preparing, On the way, Delivered or Cancelled. Changes MUST only move forward, or to Cancelled before Delivered. The time of each change MUST be recorded.
- **FR-012**: The existing tracker page MUST show the real status and refresh itself at least every 15 seconds while the order is active. It MUST stop once the order is Delivered or Cancelled.
- **FR-013**: Public tracking MUST NOT reveal the customer's phone or street address. Only the ordering customer (signed in) and staff see full details.

**Accounts**
- **FR-014**: Customers MUST be able to sign up with name, password and at least one of email or Pakistani mobile number. Email and phone MUST each be unique across accounts.
- **FR-015**: Customers MUST be able to log in with email or phone plus password. Passwords MUST be stored only in a one-way protected (hashed) form. Failed logins MUST give one generic message.
- **FR-016**: Signed-in sessions MUST expire after a set time (7 days at launch). Sign-out MUST end the session on that device.
- **FR-017**: Signed-in customers MUST see "My orders" (newest first, with status and total). They MUST be able to re-order, which refills the cart at current prices and skips items no longer sold, with a notice.
- **FR-018**: Guest checkout MUST remain available.

**Admin**
- **FR-019**: The admin panel at `/admin` MUST be reachable only by accounts with the admin role. Customer accounts MUST be refused.
- **FR-020**: Admins MUST see a live list of orders (today by default, filterable by status and date). New orders MUST appear within 15 seconds with a sound and visual alert.
- **FR-021**: Admins MUST be able to view full order and customer details and change order status, following FR-011.
- **FR-022**: Admins MUST be able to edit item price, availability and sold-out status. Price edits MUST NOT change past orders.
- **FR-023**: Admins MUST be able to add, edit, enable and disable delivery areas and set each area's fee.
- **FR-024**: Admins MUST see today's order count and sales total (Pakistan-time business day, excluding cancelled orders).
- **FR-025**: Admins MUST be able to read contact messages, mark them read, and view newsletter sign-ups.
- **FR-026**: Admins MUST be able to approve or reject customer reviews.

**Messages, newsletter, reviews**
- **FR-027**: Contact form submissions (name, phone, email, message) MUST be validated and saved.
- **FR-028**: Newsletter sign-ups MUST be saved once per email address.
- **FR-029**: Only a signed-in customer MAY review their own Delivered order, once per order, with 1–5 stars and an optional comment up to 500 characters. Reviews stay hidden until approved.
- **FR-030**: The home page MUST show approved reviews in place of the labelled sample reviews once at least 3 approved reviews exist. Until then, the sample reviews and their label MUST remain.

**Security & operations**
- **FR-031**: Secrets (database credentials, signing keys, admin bootstrap password) MUST live only in an uncommitted environment file. A committed example file MUST list every setting with placeholder values.
- **FR-032**: The service MUST accept browser requests only from the configured website address(es).
- **FR-033**: Every input MUST be validated for type, length and format. Invalid requests MUST be refused with field-level reasons and no internal details.
- **FR-034**: Login, sign-up and order placement MUST be rate-limited per client (defaults: 5 failed logins per 15 minutes, 10 orders per hour). Contact and newsletter forms MUST be rate-limited as well.
- **FR-035**: The first admin account MUST be created from environment settings, never from a public sign-up.
- **FR-036**: The existing customer screens MUST keep their current visual design, copy and interactions. Changes are limited to real data, real errors, sold-out states and the new account and review features.
- **FR-037**: `docs/PROJECT-JOURNEY.md` MUST gain a Phase 2 entry covering what was built, technologies and why, problems and fixes, and a screenshots section.

### Key Entities

- **Category**: menu section (e.g. Burgers). Has name, slug, display order, one option group (e.g. sizes) and a set of extras.
- **Menu Item**: sellable dish. Has slug, name, category, base price, description, photo and alt text, tag, rating, popularity rank, featured placements, per-item option price overrides, and available/sold-out flags.
- **Option / Extra**: a size or variant choice with a price change, or an add-on with a price, belonging to a category.
- **Deal (Promo)**: a fixed-price combo or a weekday percentage discount on one item (Wings Wednesday).
- **Delivery Area**: name, fee, enabled flag.
- **Customer Account**: name, email and/or phone (unique), protected password, role (customer or admin), created time.
- **Order**: number (`KBG-#####`), optional customer account, contact name and phone, area and address, notes, timing, payment method (COD), status with history of changes, totals, placed time.
- **Order Line**: snapshot of item name, chosen option and extras, note, quantity, unit price, discount and line total at the time of ordering.
- **Contact Message**: name, phone, email, message, received time, read flag.
- **Newsletter Subscriber**: email, signed-up time.
- **Review**: linked to one Delivered order and its customer. Has stars (1–5), comment, status (pending, approved or rejected), created time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visual comparison of the home, menu, item, cart, checkout and tracker pages before and after the switch shows no differences in layout, copy, prices or photos (sold-out labels excepted).
- **SC-002**: 100% of test orders with tampered browser prices are saved at the correct menu price. Totals match the pricing rules in 100% of automated pricing tests, including Wednesday/non-Wednesday and above/below the free-delivery threshold.
- **SC-003**: A customer can go from cart to confirmed order number in under 2 minutes. 95% of order submissions get a result in under 2 seconds.
- **SC-004**: Status changes made by staff appear on the customer's tracker, and new orders appear on the admin screen, within 15 seconds in 95% of cases.
- **SC-005**: Staff can find a new order, open it and move it to Preparing in under 30 seconds from the alert.
- **SC-006**: A returning customer can re-order a past order in 3 taps or fewer from "My orders".
- **SC-007**: No secret appears in the code history. Admin functions refuse 100% of requests without an admin session. The login limit blocks the 6th failed attempt within 15 minutes.
- **SC-008**: No review appears publicly unless it came from a Delivered order and was approved by staff.
- **SC-009**: The Phase 2 journey entry exists in `docs/PROJECT-JOURNEY.md` before the phase is marked complete.

## Assumptions

- Payment stays Cash on Delivery only. Online payment is out of scope.
- One restaurant branch. Opening hours are fixed at 12 noon – 3 AM PKT for this phase (not editable in the admin panel).
- The free-delivery threshold stays at Rs 1,500 and is shared across areas. Each area's fee starts at Rs 150 (today's flat fee) and can be changed by staff.
- Order status is changed manually by staff. There is no rider app or automatic progression.
- "Live" means automatic refresh within 15 seconds. Instant push is not required.
- Order numbers are sequential from `KBG-10001`. Because they are guessable, public tracking hides personal details (FR-013).
- Guest orders are not automatically attached to an account created later.
- No password reset, email/SMS verification or Google sign-in in this phase (shown as "coming soon" where the UI already says so).
- Only admins exist as staff; there are no separate kitchen or rider roles.
- Reviews show first name and last initial only. At least 3 approved reviews are needed before sample reviews are replaced.
- Menu photos stay the existing website images. Uploading new photos from the admin panel is out of scope.
- The technology stack (named in the input) is fixed by the owner and is recorded in the plan, not here.

## Out of Scope

- Online payments, refunds, invoices and tax receipts.
- Adding or deleting menu items or categories, and photo uploads, from the admin panel (price, availability and sold-out only).
- Sending newsletters. Email or SMS notifications to customers or staff.
- Multiple branches, rider tracking on a map, loyalty points, coupon codes.
- Production hosting and deployment (a later phase per the constitution).

## Dependencies

- Owner approval of the Phase 1 frontend (constitution build order) — given by requesting this phase.
- A hosted database account for the central store, provisioned by the owner. Credentials are supplied via the uncommitted environment file.
- The existing frontend data layer (`frontend/src/lib/api.ts`) as the single seam that switches from sample data to the live service.


---

## Acceptance status (recorded 2026-09-28)

How each story was checked. "Automated" means a test that ran and passed against a real Postgres (the
integration suite runs on a separate scratch database) or in a real browser against the running backend.
"Manual" means done by hand against the real Neon development database.

| Story | Scenarios | Evidence |
|---|---|---|
| US2 Menu from the database | 1–4 | Automated: seed data drift guard (`npm run export:backend-data -- --check`), `test_menu_api.py`, `admin-catalog.spec.ts`. **Scenario 1 also needs an owner side-by-side look** at the pages (SC-001). |
| US1 Real orders | 1–8 | Automated: `test_orders_api.py`, `test_pricing*.py` (server matches the website's own numbers), `order-flow.spec.ts`. Scenario 2: the server **refuses** an order that carries a price field (422) rather than silently ignoring it, which is stricter than the scenario and equally safe. |
| US3 Tracking | 1–6 | Automated: `test_tracking_api.py`, `usePolling.test.ts`, `order-lifecycle.spec.ts`. Manual: status changes reached an open tracker tab within 15 s with no reload. |
| US4 Admin orders | 1–5 | Automated: `test_admin_orders_api.py`, `test_transitions.py`, `order-lifecycle.spec.ts`, admin page accessibility sweep. |
| US5 Accounts | 1–7 | Automated: `test_auth_api.py`, `test_me_api.py`, `account.spec.ts` (includes guest checkout). |
| US6 Areas, messages | 1–4 | Automated: `test_admin_catalog_api.py`, `test_content_api.py`, `admin-catalog.spec.ts`, `admin-messages.spec.ts`. |
| US7 Reviews | 1–4 | Automated: `test_reviews_api.py`, `reviews.spec.ts`. Scenario 1: the comment is **required** (3–500 characters) rather than optional, because it is shown as a quote on the home page. |

| Success criterion | Status |
|---|---|
| SC-001 identical look | Needs the owner's visual check. Customer screens were not restyled; only the navbar account icon and My orders were added. |
| SC-002 tampered prices | Met (automated). |
| SC-003 cart to order in under 2 min, 95% of submissions under 2 s | Not formally timed. Order placement took about 1–3 s against the remote development database. Re-measure on the deployed site. |
| SC-004 changes within 15 s | Met by design (15 s polling) and shown in the lifecycle test. |
| SC-005 staff act in under 30 s | Not timed; the flow is alert, one click to open, one click to move on. Try it live. |
| SC-006 re-order in 3 taps or fewer | Met: My orders, then Order again. |
| SC-007 no secrets in history, admin refusal, login limit | Met (see the security check in the journey document). |
| SC-008 reviews only from delivered, approved orders | Met (automated). |
| SC-009 journey entry | Done: section 8 of `docs/PROJECT-JOURNEY.md`. |

**Owner approval of Phase 2 is still to be given** (Constitution: phase completion requires it).
