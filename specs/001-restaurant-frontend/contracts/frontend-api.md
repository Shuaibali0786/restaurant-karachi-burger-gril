# Contract: `frontend/src/lib/api.ts`

The **only** module screens and components may use to read or write domain data
(Constitution IX). Phase 1 implements it with mock data from `src/lib/data/`; Phase 2 swaps the
bodies for `fetch` calls to the FastAPI endpoints in [`openapi.yaml`](./openapi.yaml) without
changing any signature.

Types referenced below are defined in `src/lib/types.ts` (see [data-model.md](../data-model.md)).

```ts
// Catalogue (read)
export async function getCategories(): Promise<Category[]>;             // sorted by `order`
export async function getMenuItems(query?: MenuQuery): Promise<MenuItemView[]>;
export async function getMenuItem(slug: string): Promise<MenuItemView | null>; // null → 404
export async function getMenuSlugs(): Promise<string[]>;                // for generateStaticParams
export async function getFeaturedItems(
  placement: 'most-loved' | 'chef-special',
): Promise<MenuItemView[]>;
export async function getPromos(): Promise<Promo[]>;
export async function getTestimonials(): Promise<Testimonial[]>;         // all isSample: true now
export async function getDeliveryAreas(): Promise<DeliveryAreaOption[]>;

// Orders (write/read)
export async function placeOrder(input: PlaceOrderInput): Promise<Order>;
export async function getOrder(id: string): Promise<Order | null>;

// Account (UI-only in this phase — always resolves with { status: 'coming-soon' })
export async function login(input: LoginInput): Promise<{ status: 'coming-soon' }>;
export async function signup(input: SignupInput): Promise<{ status: 'coming-soon' }>;

// Messages (UI-only in this phase — always resolves { status: 'received' }, sends nothing)
export async function sendContactMessage(input: ContactInput): Promise<{ status: 'received' }>;
export async function subscribeNewsletter(email: string): Promise<{ status: 'subscribed' }>;
```

```ts
type MenuSort = 'popular' | 'price-asc' | 'price-desc';

interface MenuQuery {
  category?: CategorySlug;   // omitted = all
  search?: string;           // case-insensitive match on name, description, category name
  sort?: MenuSort;           // default 'popular'
}

// MenuItem with options/addons resolved from its category + overrides
interface MenuItemView extends Omit<MenuItem, 'optionOverrides'> {
  options: Option[];
  addons: Addon[];
}

interface PlaceOrderInput {
  customer: { name: string; phone: string };                 // phone as typed; normalised inside
  delivery: { area: DeliveryArea; address: string; notes?: string };
  payment: 'cod';
  lines: Array<Pick<CartLine, 'itemSlug' | 'optionId' | 'addonIds' | 'note' | 'quantity'>>;
}
```

## Behaviour and errors

| Function | Success | Errors (thrown `ApiError` with `code`) |
|----------|---------|----------------------------------------|
| `getMenuItem` | item view | returns `null` for unknown slug (no throw) |
| `getMenuItems` | filtered + sorted list (possibly empty) | none |
| `placeOrder` | `Order` with `id`, price snapshots and totals computed **server-side-style** from catalogue (client-sent prices never trusted) | `VALIDATION_FAILED` (Zod issues attached), `EMPTY_CART`, `UNKNOWN_ITEM`, `INVALID_OPTION` |
| `getOrder` | `Order` | returns `null` if not found |

- All functions are async even when mock data is synchronous, so call sites are already
  backend-shaped.
- `placeOrder` is idempotent per submit: the checkout button disables while pending to prevent
  duplicate orders.
- Mock latency: none by default (keeps UI snappy and tests deterministic).
