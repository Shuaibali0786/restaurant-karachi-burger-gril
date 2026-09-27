# Data Model: Restaurant Backend (Phase 2)

**Feature**: `002-restaurant-backend` | **Date**: 2026-09-27 | **Plan**: [plan.md](./plan.md)

Postgres (Neon). Schema changes happen only through Alembic migrations. Conventions:
- **Money** is `INTEGER` rupees, as in Phase 1 `types.ts`.
- **Timestamps** are `TIMESTAMPTZ` stored in UTC and converted to PKT only for business rules and
  display.
- **Natural keys** (slugs) are kept where the frontend already uses them as ids, so API payloads
  match `frontend/src/lib/types.ts` unchanged.
- **Enums** are Postgres `TEXT` + `CHECK` constraints rather than native `ENUM`, so adding a value
  is a simple migration.

```text
category 1─* category_option          users 1─* orders 1─* order_line
category 1─* category_addon                     orders 1─* order_status_event
category 1─* menu_item 1─* promo                orders 1─0..1 review *─1 users
delivery_area 1─* orders (by id, name snapshotted)
contact_message · newsletter_subscriber · sample_testimonial  (stand-alone)
```

---

## Menu

### `category`
| Column | Type | Rules |
|---|---|---|
| `id` | `TEXT` PK | slug, one of the 8 `CategorySlug` values (`burgers` … `combos`) |
| `name` | `TEXT` | 1–40 chars |
| `image`, `image_alt` | `TEXT` | path under `/images/`; alt text required |
| `sort_order` | `SMALLINT` | unique |
| `option_group_label` | `TEXT` | e.g. "Choose size"; the option group is always required |

### `category_option`
| Column | Type | Rules |
|---|---|---|
| `id` | `SERIAL` PK | internal |
| `category_id` | FK → `category.id` | |
| `key` | `TEXT` | the frontend `Option.id` (e.g. `single`, `meal`); `UNIQUE(category_id, key)` |
| `label` | `TEXT` | |
| `price_delta` | `INTEGER` | ≥ 0 |
| `includes` | `TEXT NULL` | e.g. "Masala Fries + Chilled Cola" |
| `sort_order` | `SMALLINT` | |

### `category_addon`
Same shape as `category_option`, with `price INTEGER > 0` in place of `price_delta` and no
`includes`. `UNIQUE(category_id, key)`.

### `menu_item`
| Column | Type | Rules |
|---|---|---|
| `id` | `SERIAL` PK | internal |
| `slug` | `TEXT UNIQUE` | public id (e.g. `burns-road-zinger`) |
| `name` | `TEXT` | 1–60 |
| `category_id` | FK → `category.id` | |
| `base_price` | `INTEGER` | > 0, ≤ 100 000; **editable by admin** |
| `description`, `image`, `image_alt` | `TEXT` | |
| `tag` | `TEXT NULL` | CHECK in (`bestseller`,`chef-pick`,`hot`,`new`,`veg`) |
| `rating` | `NUMERIC(2,1)` | 0–5 (display value carried over from Phase 1) |
| `popularity` | `SMALLINT` | sales rank for the "Popular" sort |
| `featured` | `TEXT[]` | subset of (`most-loved`,`chef-special`) |
| `option_overrides` | `JSONB` | `{optionKey: priceDelta}`; every key must exist in the category's options (validated by the seed and service) |
| `is_available` | `BOOLEAN` default true | false → hidden from lists and search; direct page shows "not available" |
| `is_sold_out` | `BOOLEAN` default false | true → listed with a "Sold out" pill, not orderable |
| `updated_at` | `TIMESTAMPTZ` | |

**API view** (`MenuItemView`): options are resolved from the category with overrides applied, and
addons come from the category. `soldOut = is_sold_out`. Hidden items are omitted from public lists;
`GET /menu-items/{slug}` still returns them with `available: false`.

### `promo`
| Column | Type | Rules |
|---|---|---|
| `id` | `TEXT` PK | `burger-combo`, `wings-wednesday` |
| `title`, `image` | `TEXT` | |
| `kind` | `TEXT` | CHECK in (`price`,`weekday-percent`) |
| `item_slug` | FK → `menu_item.slug` | |
| `price`, `was_price` | `INTEGER NULL` | required when `kind='price'` |
| `weekday` | `SMALLINT NULL` | 0 = Sunday … 6, evaluated in PKT; required when `kind='weekday-percent'` |
| `percent` | `SMALLINT NULL` | 1–90; required when `kind='weekday-percent'` |
| `is_active` | `BOOLEAN` default true | |

A table-level CHECK enforces the kind-specific required columns.

---

## Delivery

### `delivery_area`
| Column | Type | Rules |
|---|---|---|
| `id` | `TEXT` PK | slug (`saddar`, `clifton`, `dha`, `pechs`, `gulshan`, `north-nazimabad`); new ones added by admin as lowercase kebab-case, 2–40 chars, immutable |
| `name` | `TEXT UNIQUE` | 2–40 |
| `fee` | `INTEGER` | 0–2 000; seeded at 150 |
| `is_enabled` | `BOOLEAN` default true | disabled → hidden from checkout, and orders are refused with `AREA_UNAVAILABLE` |
| `sort_order` | `SMALLINT` | |

The free-delivery threshold (Rs 1,500) is a setting (`FREE_DELIVERY_THRESHOLD`, default 1500),
not a column. It is shared by all areas (spec Assumptions).

**Frontend type change**: `DeliveryArea` widens from a fixed union to `string`, because admins
can add areas. `DeliveryAreaOption` gains `fee: number`.

---

## Accounts

### `users`
| Column | Type | Rules |
|---|---|---|
| `id` | `UUID` PK | `gen_random_uuid()` |
| `name` | `TEXT` | 2–60 |
| `email` | `TEXT NULL UNIQUE` | stored lowercased and trimmed; ≤ 254 |
| `phone` | `TEXT NULL UNIQUE` | normalised `+923XXXXXXXXX` |
| `password_hash` | `TEXT` | Argon2id (pwdlib) |
| `role` | `TEXT` | CHECK in (`customer`,`admin`), default `customer` |
| `is_active` | `BOOLEAN` default true | |
| `created_at`, `last_login_at` | `TIMESTAMPTZ` | |

A table CHECK requires `email IS NOT NULL OR phone IS NOT NULL` (FR-014). Public sign-up always
creates `customer`; `admin` is created only by the CLI (FR-035).

---

## Orders

### Sequence
`CREATE SEQUENCE order_number_seq START 10001;` The display form is `KBG-{number}`.

### `orders`
| Column | Type | Rules |
|---|---|---|
| `id` | `UUID` PK | internal, never exposed |
| `number` | `BIGINT UNIQUE` | default `nextval('order_number_seq')` |
| `idempotency_key` | `UUID UNIQUE` | from the `Idempotency-Key` header |
| `request_hash` | `TEXT` | SHA-256 of the canonical request body (detects key reuse with a different body) |
| `user_id` | FK → `users.id` NULL | set when placed while signed in; NULL for guests |
| `customer_name` | `TEXT` | 2–60 |
| `customer_phone` | `TEXT` | normalised `+923…` |
| `area_id` | FK → `delivery_area.id` | |
| `area_name` | `TEXT` | snapshot |
| `address` | `TEXT` | 10–200 |
| `landmark`, `notes` | `TEXT NULL` | ≤ 200 |
| `timing_type` | `TEXT` | CHECK in (`asap`,`scheduled`) |
| `scheduled_for` | `TIMESTAMPTZ NULL` | required iff `scheduled` |
| `payment` | `TEXT` | CHECK = `cod` |
| `status` | `TEXT` | CHECK in (`confirmed`,`preparing`,`on-the-way`,`delivered`,`cancelled`), default `confirmed` |
| `subtotal`, `discount`, `delivery_fee`, `total` | `INTEGER` | ≥ 0; `total = subtotal − discount + delivery_fee` (CHECK) |
| `placed_at` | `TIMESTAMPTZ` | |
| `business_date` | `DATE` | `(placed_at AT TIME ZONE 'Asia/Karachi' − 6 h)::date` (research R3) |
| `updated_at` | `TIMESTAMPTZ` | |

Indexes:
- `(business_date, status)` for today's summary and the admin list.
- `(placed_at DESC)` for the admin `since` polling.
- `(user_id, placed_at DESC)` for "My orders".

### `order_line` (snapshot at the time of ordering; later menu edits never change it)
| Column | Type | Rules |
|---|---|---|
| `id` | `SERIAL` PK | |
| `order_id` | FK → `orders.id` ON DELETE CASCADE | |
| `position` | `SMALLINT` | cart order |
| `item_slug` | `TEXT` | not an FK, because snapshots must survive menu changes |
| `item_name`, `option_key`, `option_label` | `TEXT` | `option_label` uses the same summary as `optionSummary()` |
| `addon_keys`, `addon_labels` | `JSONB` (array of text) | |
| `note` | `TEXT` | ≤ 500 |
| `quantity` | `SMALLINT` | 1–20 |
| `unit_price`, `discount`, `line_total` | `INTEGER` | `discount` is for the whole line (per-unit discount × quantity), matching `OrderLine` |

### `order_status_event`
| Column | Type | Rules |
|---|---|---|
| `id` | `SERIAL` PK | |
| `order_id` | FK → `orders.id` | |
| `from_status` | `TEXT NULL` | NULL for the initial `confirmed` event |
| `to_status` | `TEXT` | |
| `changed_by` | FK → `users.id` NULL | NULL = system (order placement) |
| `changed_at` | `TIMESTAMPTZ` | |

#### Status state machine (FR-011)

```text
confirmed ──► preparing ──► on-the-way ──► delivered   (terminal)
    │             │              │
    └─────────────┴──────────────┴──────► cancelled     (terminal)
```

- Allowed transitions: `confirmed→preparing`, `preparing→on-the-way`, `on-the-way→delivered`, and
  any non-terminal status → `cancelled`.
- Skipping steps forward (e.g. `confirmed→delivered`) is **not** allowed, which keeps the
  customer's tracker meaningful.
- **Concurrency** (edge case "admin status race"): `PATCH` carries `expectedStatus`. The update is
  `UPDATE orders SET status=:to WHERE id=:id AND status=:expected`. Zero rows updated →
  `409 INVALID_TRANSITION`, with the current status in the response so the UI refreshes.

---

## Reviews and content

### `review`
| Column | Type | Rules |
|---|---|---|
| `id` | `SERIAL` PK | |
| `order_id` | FK → `orders.id` **UNIQUE** | one review per order |
| `user_id` | FK → `users.id` | must equal `orders.user_id` |
| `rating` | `SMALLINT` | CHECK 1–5 |
| `comment` | `TEXT NULL` | ≤ 500 |
| `status` | `TEXT` | CHECK in (`pending`,`approved`,`rejected`), default `pending` |
| `created_at`, `moderated_at` | `TIMESTAMPTZ` | |
| `moderated_by` | FK → `users.id` NULL | |

Creation rules (FR-029), checked in the service: the order belongs to the caller, the order status
is `delivered`, and no review exists yet. Otherwise `409 REVIEW_NOT_ALLOWED`.

**Public projection** (`Testimonial`), from `GET /testimonials`:
- If there are **≥ 3** approved reviews, it returns the latest 6 approved as
  `{ id, name: "Ayesha K.", area: <order area_name>, quote, rating, month: "2026-09", isSample: false }`.
- Otherwise it returns `sample_testimonial` rows with `isSample: true`, and the UI keeps its
  "Sample reviews" label (FR-030, Constitution X).
- The frontend type `Testimonial.isSample` widens from `true` to `boolean`, and it gains an
  optional `month`.

### `sample_testimonial`
Seeded copy of Phase 1 `testimonials.ts`: `id TEXT PK`, `name`, `area`, `quote`, `rating`.

### `contact_message`
| Column | Type | Rules |
|---|---|---|
| `id` | `SERIAL` PK | |
| `name` | `TEXT` | 2–60 |
| `phone` | `TEXT NULL` | normalised if given |
| `email` | `TEXT NULL` | lowercased if given |
| `message` | `TEXT` | 10–1 000 |
| `is_read` | `BOOLEAN` default false | |
| `created_at` | `TIMESTAMPTZ` | |

At least one of `phone` or `email` is required (validated in the request schema, matching the
Phase 1 contact form rules).

### `newsletter_subscriber`
`id SERIAL PK`, `email TEXT UNIQUE` (lowercased), `created_at`. Inserts use
`ON CONFLICT (email) DO NOTHING`, and the API returns `200 {status: "subscribed"}` either way
(FR-028, and it does not reveal whether an email is already on the list).

---

## Frontend type changes (summary)

All changes are in `frontend/src/lib/types.ts`. Existing field names are kept.

| Type | Change |
|---|---|
| `MenuItemView` | + `soldOut: boolean`, + `available: boolean` |
| `DeliveryArea` | union → `string` |
| `DeliveryAreaOption` | + `fee: number` |
| `OrderStatus` | + `"cancelled"` |
| `Order` | + `status: OrderStatus`, + `statusHistory: {status, at}[]`, + `viewer: "public" \| "owner" \| "admin"`; `delivery.address` becomes optional (omitted for the public viewer); + `review?: {rating, status}` for the owner |
| `Testimonial` | `isSample: boolean`, + `month?: string` |
| New `Session` | `{ user: { id, name, email?, phone?, role } \| null }` |
| New `AdminOrderSummary`, `TodaySummary`, `ContactMessage`, `Review` | admin screens; see `contracts/openapi.yaml` |
