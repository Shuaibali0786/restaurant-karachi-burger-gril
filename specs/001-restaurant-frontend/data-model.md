# Phase 1 Data Model: Karachi Burger & Grill — Frontend

**Date**: 2026-09-26 | **Spec**: [spec.md](./spec.md)

All money values are **integer rupees** (PKR, no decimals). All IDs/slugs are lowercase
kebab-case strings. These types live in `frontend/src/lib/types.ts` and are the contract the
Phase 2 backend must satisfy (see `contracts/openapi.yaml`).

## Catalogue entities (read-only, served by `lib/api.ts`)

### Category

| Field | Type | Rules |
|-------|------|-------|
| `id` | `CategorySlug` | one of `burgers`, `wraps`, `fried-chicken`, `sandwiches`, `bbq`, `bowls`, `sides-drinks`, `combos` |
| `name` | string | display name, e.g. "Fried Chicken" |
| `image` | string | `/images/<file>.jpg` used for the round chip |
| `imageAlt` | string | required, non-empty |
| `order` | number | 1–8, unique |
| `optionGroup` | `OptionGroup` | shared by all items in the category |
| `addons` | `Addon[]` | may be empty |

Chip photos: burgers → zinger-burger, wraps → chicken-wrap, fried-chicken → fried-chicken,
sandwiches → club-sandwich, bbq → chicken-tikka, bowls → rice-bowl, sides-drinks → loaded-fries,
combos → grand-combo.

### OptionGroup / Option

| Field | Type | Rules |
|-------|------|-------|
| `OptionGroup.label` | string | "Choose an option" |
| `OptionGroup.required` | `true` | always required; no default selected |
| `OptionGroup.options` | `Option[]` | 1–3 entries |
| `Option.id` | string | e.g. `single`, `double`, `meal`, `regular`, `large`, `family-pack` |
| `Option.label` | string | e.g. "Double" |
| `Option.priceDelta` | number | ≥ 0 |

Category-level deltas come from the spec's Menu Catalogue. **Fried Chicken and BBQ deltas vary per
item**, so `MenuItem.optionOverrides` supplies them (see below).

### Addon

| Field | Type | Rules |
|-------|------|-------|
| `id` | string | e.g. `extra-cheese` |
| `label` | string | e.g. "Extra cheese" |
| `price` | number | > 0 |

### MenuItem

| Field | Type | Rules |
|-------|------|-------|
| `slug` | string | unique; derived from name, e.g. `burns-road-zinger`, `crispy-bucket` |
| `name` | string | as in catalogue, e.g. "Crispy Bucket (6 pcs)" |
| `category` | `CategorySlug` | FK → Category |
| `basePrice` | number | > 0 |
| `image` | string | `/images/<file>.jpg`; file must exist |
| `imageAlt` | string | descriptive, non-empty |
| `description` | string | one line, ≤ 120 chars |
| `tag` | `'bestseller' \| 'hot' \| 'new' \| 'veg' \| null` | |
| `rating` | number | 4.5–4.9, one decimal; no review count |
| `popularity` | number | rank 1..33 for "Popular" sort (bestsellers first, then hot) |
| `optionOverrides` | `Record<optionId, priceDelta>` \| undefined | only Fried Chicken & BBQ |
| `featured` | `('most-loved' \| 'chef-special')[]` | home-page placement |

**Derived** (in `lib/api.ts`, not stored): `options` = category options with overrides applied;
`addons` = category addons.

### Promo

| Field | Type | Rules |
|-------|------|-------|
| `id` | string | `burger-combo`, `wings-wednesday` |
| `title` | string | |
| `kind` | `'price' \| 'weekday-percent'` | |
| `itemSlug` | string | FK → MenuItem (`grand-combo`, `fire-wings`) |
| `price`, `wasPrice` | number | `kind = 'price'` only (1490 / 1830) |
| `weekday` | 0–6 | `kind = 'weekday-percent'`; 3 = Wednesday (PKT) |
| `percent` | number | 1–100 (20) |
| `image` | string | banner photo |

Only `weekday-percent` promos change prices. The "Burger Combo" banner price equals the Grand
Combo base price, so it is display-only.

### Testimonial (sample)

| Field | Type | Rules |
|-------|------|-------|
| `id` | string | |
| `name` | string | first name + initial, e.g. "Ayesha K." |
| `area` | string | Karachi area |
| `quote` | string | ≤ 180 chars |
| `rating` | 1–5 | |
| `isSample` | `true` | UI must render the "Sample reviews" label while any item is sample |

### DeliveryArea

`'saddar' | 'clifton' | 'dha' | 'pechs' | 'gulshan' | 'north-nazimabad'` with display names.

## Client-state entities (persisted on device)

### CartLine

| Field | Type | Rules |
|-------|------|-------|
| `key` | string | `slug|optionId|addonIds(sorted, comma)|note(trimmed)` — identity for merging |
| `itemSlug` | string | must resolve to a MenuItem, else line is dropped on load |
| `optionId` | string | must exist in item's options |
| `addonIds` | string[] | each must exist in item's addons; sorted |
| `note` | string | ≤ 500 chars, trimmed |
| `quantity` | number | integer 1–20 |
| `addedAt` | ISO string | |

Prices are **never stored** in the cart; they are recomputed from the catalogue on render so
stale prices and tampering are impossible.

**Transitions**: `add(config)` → merge by `key` (qty capped at 20) or append ·
`setQuantity(key, n)` → `n < 1` removes line · `remove(key)` · `clear()` (after order placed).

### CartTotals (derived, `lib/pricing.ts`)

`subtotal` = Σ(unit × qty) before promos · `discount` = Σ promo discount ·
`delivery` = `subtotal − discount ≥ 1500 ? 0 : 150` · `total` = subtotal − discount + delivery ·
`freeDeliveryRemaining` = max(0, 1500 − (subtotal − discount)).

Unit price = `basePrice + option.priceDelta + Σ addon.price`; Wings Wednesday discount per unit =
`round(unit × 0.20)` when PKT weekday is Wednesday and `itemSlug = fire-wings`.

### Favourites

`slugs: string[]` (unique). Toggle adds/removes; unknown slugs dropped on load.

### Order

| Field | Type | Rules |
|-------|------|-------|
| `id` | string | `KBG-` + 6 digits, unique within device store |
| `customer.name` | string | 2–60 chars |
| `customer.phone` | string | normalised `+923XXXXXXXXX` |
| `delivery.area` | DeliveryArea | |
| `delivery.address` | string | 10–200 chars |
| `delivery.notes` | string | ≤ 200 chars, optional |
| `payment` | `'cod'` | `'card'` exists in type but is disabled in UI |
| `lines` | `OrderLine[]` | snapshot: name, option label, addon labels, note, qty, unit, line total |
| `totals` | CartTotals | snapshot at placement |
| `placedAt` | ISO string | |
| `status` | derived | see state machine |

Order lines **do** snapshot prices (an order is a historical record).

**Status state machine** (derived from elapsed time since `placedAt` in this phase):

```text
confirmed ──(20s)──▶ preparing ──(60s)──▶ on-the-way ──(120s)──▶ delivered
```

No backwards transitions; `delivered` is terminal. Phase 2 replaces derivation with server status.

## Form schemas (Zod, `lib/validation.ts`)

| Form | Fields and rules |
|------|------------------|
| Checkout | name 2–60 · phone PK mobile (see research R6) · area enum · address 10–200 · notes ≤ 200 optional · payment literal `cod` |
| Contact | name 2–60 · phone PK mobile **or** email (at least one) · message 10–1000 |
| Login | email valid · password ≥ 8 |
| Signup | name 2–60 · email · phone PK mobile · password ≥ 8 · confirmPassword equals password |
| Newsletter | email valid |
| Item detail | optionId required · addonIds ⊆ item addons · note ≤ 500 · quantity 1–20 |
