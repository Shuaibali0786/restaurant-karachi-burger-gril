# Feature Specification: Karachi Burger & Grill — Customer Website (Frontend Phase)

**Feature Branch**: `001-restaurant-frontend`
**Created**: 2026-09-26
**Status**: Draft
**Input**: User description: "Build the complete FRONTEND of the "Karachi Burger & Grill" restaurant
website (tagline: "Karachi ka asli zaiqa") … home, menu, item detail, cart, checkout, confirmation,
favourites, login, signup, about, contact, 404, with the full menu and prices supplied."
(Full verbatim input is recorded in the Prompt History Record for this spec.)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse the menu and customise an item into the cart (Priority: P1)

A hungry customer lands on the site, browses the menu (from the home page or the full menu page),
taps an item, picks a size/variant, optionally adds extras and a note, chooses a quantity, and adds
it to the cart. The item is never added without this customisation step.

**Why this priority**: This is the core value of a restaurant ordering site; without it nothing
else matters.

**Independent Test**: Open the menu, tap any item, confirm the detail view opens, choose an option
and add-ons, set quantity 2, press "Add to cart", and confirm the cart count and cart contents
reflect exactly that configuration and price.

**Acceptance Scenarios**:

1. **Given** the menu is displayed, **When** the customer taps a product card or its "Add +"
   button, **Then** the item detail view opens (centred dialog with photo left and options right
   on wide screens; bottom sheet on phones) and the cart is unchanged.
2. **Given** the item detail view is open and no required option is chosen, **When** the customer
   looks at the add button, **Then** it is disabled and a hint says "Choose an option to continue".
3. **Given** a burger at Rs 690 with "Double" (+300) and "Extra cheese" (+100) selected and
   quantity 2, **When** the customer views the add button, **Then** it reads
   "Rs 2,180 | Add to cart →".
4. **Given** the customer presses the enabled add button, **When** the item is added, **Then** the
   detail view closes, an image of the item flies to the cart icon, the cart badge bounces and
   shows the new total quantity.
5. **Given** a customer opens a shared item link (e.g. `/menu/burns-road-zinger`), **When** the
   page loads, **Then** the same detail content and ordering controls are shown as a full page.
6. **Given** the special-instructions field, **When** the customer types, **Then** a live counter
   shows characters used out of 500 and input stops at 500.
7. **Given** the quantity stepper is at 1, **When** the customer views it, **Then** the minus
   control is shown as a trash icon; pressing it closes the detail view without adding anything.

---

### User Story 2 - Review cart and place a Cash-on-Delivery order (Priority: P1)

The customer reviews the cart (slide-in drawer or full cart page), adjusts quantities or removes
lines, proceeds to checkout, enters delivery details, chooses Cash on Delivery, and places the
order. They see a confirmation with an order number and a status tracker.

**Why this priority**: Completes the ordering journey; together with Story 1 it forms the MVP.

**Independent Test**: With items in the cart, go to checkout, submit empty (see errors), fill valid
details, place the order, and confirm an order number and tracker appear and the cart is emptied.

**Acceptance Scenarios**:

1. **Given** items in the cart, **When** the customer opens the cart, **Then** each line shows
   item name, chosen option, add-ons, note, unit price, quantity stepper, line total and a remove
   control, plus subtotal, delivery fee and total.
2. **Given** a subtotal of Rs 1,190, **When** the cart is shown, **Then** delivery is Rs 150, total
   is Rs 1,340, and a nudge says "Add Rs 310 more for free delivery".
3. **Given** a subtotal of Rs 1,500 or more, **When** the cart is shown, **Then** delivery shows
   "Free".
4. **Given** the customer refreshes the page or returns later on the same device, **When** the
   site loads, **Then** the cart contents are preserved.
5. **Given** the checkout form, **When** the customer submits with missing or invalid fields,
   **Then** the order is not placed, each invalid field shows an inline message, and focus moves to
   the first invalid field.
6. **Given** valid details and Cash on Delivery selected, **When** the customer presses "Place
   order", **Then** a confirmation page shows an order number (format `KBG-` + 6 digits), the order
   summary, delivery address, and a tracker with stages Confirmed → Preparing → On the way →
   Delivered; the cart is emptied.
7. **Given** the payment section, **When** the customer views "Card", **Then** it is visibly
   disabled and labelled "Coming soon".
8. **Given** an empty cart, **When** the customer visits checkout, **Then** they see an empty-cart
   message with a "Browse menu" button instead of the form.

---

### User Story 3 - First impression: home page that sells the brand (Priority: P2)

A first-time visitor lands on the home page and immediately understands who the restaurant is,
what it serves, delivery promises and current deals, and can jump straight into ordering.

**Why this priority**: Drives trust and conversion, but ordering (P1) must work first.

**Independent Test**: Load the home page at phone and desktop widths and verify every section
listed in FR-010 to FR-022 is present, uses real content and photos, and every call-to-action
leads to the right place.

**Acceptance Scenarios**:

1. **Given** a visitor on the home page, **When** it loads, **Then** they see the announcement
   bar, navbar, hero with headline, subline, two buttons, hero photo, floating badges and stats
   card, without scrolling on a 1280px-wide screen.
2. **Given** the visitor taps a category chip, **When** it is activated, **Then** they are taken
   to the menu filtered to that category.
3. **Given** the "Most Loved Items" section, **When** the visitor switches a category tab, **Then**
   the product cards update to that category without a page reload.
4. **Given** the Wings Wednesday banner, **When** it is displayed, **Then** it shows a live
   countdown (hours:minutes:seconds) to the next midnight in Pakistan time (PKT, UTC+5),
   regardless of the visitor's own time zone.
5. **Given** the testimonials section, **When** it is displayed, **Then** it carries a visible
   "Sample reviews" label.

---

### User Story 4 - Find something specific fast (Priority: P2)

A customer who knows what they want searches or filters and sorts the menu.

**Why this priority**: Speeds up repeat orders; the full menu has 33 items.

**Independent Test**: On the menu page, search "tikka", then filter "BBQ", then sort "Price: high
to low", and verify results and order.

**Acceptance Scenarios**:

1. **Given** the menu page, **When** the customer types "tikka", **Then** only items whose name,
   description or category contains "tikka" (case-insensitive) are shown.
2. **Given** a search with no matches, **When** results are empty, **Then** a friendly message
   and a "Clear filters" button are shown.
3. **Given** a category filter and a sort choice, **When** both are applied, **Then** results
   respect both, and the choices are reflected in the page address so the view can be shared.
4. **Given** the navbar search, **When** the customer submits a term, **Then** they land on the
   menu page with that search applied.

---

### User Story 5 - Save favourites (Priority: P3)

A customer taps the heart on items they love and later views them on the Favourites page.

**Why this priority**: Nice retention feature; not required to order.

**Independent Test**: Heart two items, open Favourites, see both; un-heart one and see it removed.

**Acceptance Scenarios**:

1. **Given** a product card, **When** the heart is tapped, **Then** it toggles filled/unfilled,
   with an accessible label ("Add to favourites" / "Remove from favourites"), and persists on the
   device.
2. **Given** no favourites, **When** the Favourites page opens, **Then** an empty state with a
   "Browse menu" button is shown.

---

### User Story 6 - Learn about and contact the restaurant (Priority: P3)

A customer reads the brand story, finds the address and opening hours, and sends a message.

**Why this priority**: Builds trust; secondary to ordering.

**Independent Test**: Visit About and Contact, submit the contact form with valid data, see a
success message.

**Acceptance Scenarios**:

1. **Given** the Contact page, **When** the customer submits a valid form (name, phone or email,
   message), **Then** a success message is shown (no message is actually sent in this phase).
2. **Given** invalid contact input, **When** submitted, **Then** inline errors are shown.

---

### User Story 7 - Account screens (UI only) (Priority: P3)

A customer opens Login or Signup and sees polished, validated forms; submitting shows a clear
notice that accounts are coming soon.

**Why this priority**: Sets up the future backend phase; no real accounts now.

**Independent Test**: Submit each form empty (errors shown), then valid (notice shown, no account
created).

**Acceptance Scenarios**:

1. **Given** the login form with valid email and password, **When** submitted, **Then** a notice
   says "Accounts are coming soon — you can order as a guest" with a link to the menu.

---

### Edge Cases

- Unknown item link (`/menu/does-not-exist`) or any unknown page shows the custom branded 404 with
  links to Home and Menu.
- Stored cart data that is corrupted or references an item no longer on the menu is discarded
  silently for that line; the rest of the cart loads.
- Adding an item whose option, add-ons and note exactly match an existing cart line increases that
  line's quantity instead of creating a duplicate line.
- Quantity per line is limited to 1–20; the plus control disables at 20.
- Reducing a cart line's quantity below 1 (trash icon) removes the line.
- Visiting outside opening hours (3 AM – 12 noon PKT): a small "We're closed right now — orders
  open at 12 noon" notice appears in the cart and checkout; ordering is still allowed in this
  demo phase.
- Countdown crossing midnight PKT switches between "Ends in" and "Starts in" without a page
  reload.
- Fire Wings added to the cart on a Wednesday but checked out after midnight PKT: the discount is
  removed, totals update, and a short notice explains "Wings Wednesday has ended".
- Browser storage unavailable (private mode / blocked): cart and favourites still work for the
  session and the site does not crash.
- Phone number in formats `03001234567`, `0300-1234567`, `+923001234567` are accepted and
  normalised; landlines and other formats are rejected with a helpful message.
- Very long special instructions are capped at 500 characters, including when pasted.
- Motion-sensitive users (reduced-motion preference) see no fly-to-cart, particles, or floating
  badges; content is fully visible.

## Requirements *(mandatory)*

### Functional Requirements

**Global layout**

- **FR-001**: Every page MUST show the announcement bar text
  "Free delivery on orders over Rs 1,500 · Open daily 12 noon – 3 AM".
- **FR-002**: Every page MUST show a sticky navbar with: logo (flame/coal mark, "KARACHI" large,
  "BURGER & GRILL" beneath) linking to Home; links Home, Menu, Combos (menu filtered to Combo),
  About, Contact; a search control; a login icon; a cart icon with total item count; and an
  "Order Now" button to the menu. The navbar MUST be transparent over the hero and become solid
  once the page is scrolled.
- **FR-003**: On narrow screens the nav links MUST collapse into a hamburger menu that opens a
  full-height panel, is keyboard operable, and closes on Esc or link selection.
- **FR-004**: Every page MUST show the footer with logo and tagline, quick links, support links
  (FAQ, Track Order, Privacy, Terms), contact block (Burns Road, Saddar, Karachi; hours; phone and
  email), newsletter signup (validates email, shows success message, sends nothing), and social
  icons with accessible names. Support links without pages in this phase MUST lead to a simple
  "coming soon" state rather than a broken link.
- **FR-005**: All prices MUST display in the format `Rs 1,190`.

**Home page**

- **FR-010**: Hero MUST show headline with handwritten accent "It's not just food — it's
  Karachi's fire!", subline "Fresh ingredients. Bold flavours. Unforgettable taste.", buttons
  "Order Online" (→ menu) and "View Menu" (→ menu), the Grand Combo photo with warm glow and
  drifting ember particles, floating badges ("25–30 min delivery", "4.9 rating", a hand-drawn
  arrow with "Freshly made"), and a stats card "50K+ happy customers".
- **FR-011**: Features strip MUST show four features: Fresh Ingredients, 100% Halal, 30 Min
  Delivery, Easy Online Ordering, each with an icon and one-line description.
- **FR-012**: Categories section MUST show 8 circular photo chips (Burgers, Wraps, Fried Chicken,
  Sandwiches, BBQ, Bowls, Sides & Drinks, Combos) that link to the menu filtered by category.
- **FR-013**: "Most Loved Items" MUST show category tabs ("All" plus categories) and product
  cards, plus a "View full menu" link.
- **FR-014**: A product card MUST show photo, optional tag (Bestseller, Hot, New, Veg), heart
  favourite toggle, name, one-line description, star rating (value only, no review count), price
  ("from Rs X" base price) and an "Add +" button that opens the item detail view.
- **FR-015**: Two promo banners side by side (stacked on phones): "Burger Combo — Rs 1,490 (was
  Rs 1,830)" opening the Grand Combo detail view, and "Wings Wednesday — 20% off wings" opening
  Fire Wings, with the countdown described in Story 3.
- **FR-015a**: Wings Wednesday: on Wednesdays in Pakistan time (00:00–23:59 PKT), 20% MUST be
  taken off Fire Wings automatically — on the unit price including chosen option and add-ons,
  rounded to the nearest Rs 1. On Wednesdays the banner counts down to midnight PKT ("Ends in");
  on other days it counts down to the start of the next Wednesday ("Starts in"). While active,
  Fire Wings shows the original price struck through next to the discounted price on its card and
  detail view, and the cart shows a "Wings Wednesday −Rs X" line.
- **FR-016**: Chef's Specials bento grid MUST feature Grill Mix Platter (large tile), Grand Combo,
  and Loaded Fire Fries, each opening its detail view.
- **FR-017**: About teaser MUST show the about-chef, about-restaurant and about-street photos, a
  short brand story, and an "Our Story" button to the About page.
- **FR-018**: Testimonials MUST be visibly labelled "Sample reviews".
- **FR-019**: Final call-to-action band "Taste the fire" over the fire background photo with an
  "Order Now" button.

**Menu and item detail**

- **FR-020**: The menu page MUST list all 33 items in a responsive grid with category filter
  (All + 8 categories), text search, and sort (Popular, Price: low to high, Price: high to low).
  Filter, search and sort MUST be reflected in the page address.
- **FR-021**: Selecting a card or "Add +" MUST open the item detail view and MUST NOT change the
  cart.
- **FR-022**: Each item MUST have a shareable page at `/menu/<slug>` with the same content as the
  detail view.
- **FR-023**: The detail view MUST show photo, name, description, live price, a required "Choose
  an option" group (single choice, none preselected, with price differences shown), a "Make it
  extra" add-on group (multi-select with prices; hidden if the item has no add-ons), a special
  instructions field (500-character limit with counter), a quantity stepper (1–20; trash icon at
  1), and a button "Rs X | Add to cart →" where X = (base + option + add-ons) × quantity.
- **FR-024**: The detail dialog MUST keep keyboard focus inside while open, close on Esc, backdrop
  click or close button, and return focus to the element that opened it.

**Cart**

- **FR-030**: The cart MUST be available as a slide-in drawer (from the cart icon) and as a full
  page at `/cart`, with identical content and controls.
- **FR-031**: Delivery fee is Rs 150; it is Rs 0 ("Free") when subtotal is Rs 1,500 or more.
- **FR-032**: Cart contents MUST persist on the device across refreshes and visits.
- **FR-033**: Empty cart MUST show an empty state with a "Browse menu" button.

**Checkout and confirmation**

- **FR-040**: Checkout MUST collect: full name (required, 2–60 chars), Pakistani mobile number
  (required, `03XXXXXXXXX` or `+923XXXXXXXXX`), delivery area (required; one of Saddar, Clifton,
  DHA, PECHS, Gulshan, North Nazimabad), full address (required, 10–200 chars), delivery notes
  (optional, max 200 chars), and payment method (Cash on Delivery selectable; Card disabled with
  "Coming soon").
- **FR-041**: Checkout MUST show an order summary (lines, subtotal, delivery, total).
- **FR-042**: Placing an order MUST validate all fields, then show the confirmation page with an
  order number, summary, address, estimated delivery "25–30 min", and the four-stage tracker; the
  cart is then emptied. The confirmation MUST remain viewable after refresh on the same device.
- **FR-043**: The tracker MUST be clearly marked as a demo ("Live tracking coming soon") and
  advance automatically through stages on a short timed schedule.

**Other pages**

- **FR-050**: Favourites page lists hearted items (persisted on device) with empty state.
- **FR-051**: Login and Signup pages provide validated forms (email, password ≥ 8 chars; signup
  adds name, phone, confirm password) and show a "coming soon — order as guest" notice on valid
  submit. No account is created and no credentials are stored.
- **FR-052**: About page tells the brand story (Burns Road origins, grill craft, halal
  ingredients) using the about photos.
- **FR-053**: Contact page provides a validated form, address, phone, email, and opening hours
  table (daily 12:00 PM – 3:00 AM).
- **FR-054**: A custom branded 404 page with links to Home and Menu.

**Content and brand**

- **FR-060**: All item content MUST match the Menu Catalogue below (names, base prices, photos,
  categories, options, add-ons, descriptions).
- **FR-061**: Only the project's own photos may be used; no other brands' names or logos may
  appear anywhere.
- **FR-062**: All data (menu, categories, promos, testimonials, areas) MUST come through a single
  data access layer so it can later be served by the backend without changing screens.

### Menu Catalogue

Option groups (required, choose one) and add-ons (optional, choose any) per category:

| Category | Options | Add-ons |
|----------|---------|---------|
| Burgers | Single (+0) / Double (+300) / Meal (+350) | Extra cheese 100, Jalapeños 50, Extra patty 300, Chipotle sauce 50 |
| Wraps | Regular (+0) / Large (+150) / Meal (+300) | Extra cheese 100, Jalapeños 50 |
| Fried Chicken | Regular (+0) / Double / Family Pack — per-item prices below | Extra dip 80, Coleslaw 150 |
| Sandwiches | Regular (+0) / Large (+250) / Meal (+300) | Extra cheese 100, Fries on the side 150 |
| BBQ | Single (+0) / Double / Family Pack — per-item prices below | Extra naan 60, Raita 80 |
| Bowls | Regular (+0) / Large (+200) | Extra chicken 250, Avocado 200 |
| Sides & Drinks | Regular (+0) / Large (+120) | none |
| Combos | Regular (+0, only option) | none |

Fried Chicken and BBQ size pricing (Double = +90% of base, Family Pack = +220% of base, rounded
to the nearest Rs 10; owner decision 2026-09-26):

| Item | Base | Double (+) | Family Pack (+) | Double total | Family total |
|------|------|------------|-----------------|--------------|--------------|
| Crispy Bucket (6 pcs) | 1490 | 1340 | 3280 | 2830 | 4770 |
| Fire Wings (8 pcs) | 890 | 800 | 1960 | 1690 | 2850 |
| Golden Nuggets (10 pcs) | 590 | 530 | 1300 | 1120 | 1890 |
| Crunchy Tenders (5 pcs) | 790 | 710 | 1740 | 1500 | 2530 |
| Grill Mix Platter | 2290 | 2060 | 5040 | 4350 | 7330 |
| Charcoal Chicken Tikka | 790 | 710 | 1740 | 1500 | 2530 |
| Smoky BBQ Leg | 650 | 590 | 1430 | 1240 | 2080 |

Items (base price in Rs, photo file, tag, description):

**Burgers**

| Item | Rs | Photo | Tag | Description |
|------|----|-------|-----|-------------|
| Burns Road Zinger | 690 | zinger-burger | Bestseller | Shatter-crisp spicy chicken fillet, garlic mayo and crunchy lettuce in a toasted sesame bun. |
| Smoky Smash Beef | 890 | smash-burger | Hot | Two lacy-edged smashed beef patties, melted cheddar and our smoky house sauce. |
| Double Trouble Cheese | 1190 | double-cheese-burger | Bestseller | Double beef, double cheese, double the drip — for serious hunger only. |
| Tandoori Grill Burger | 790 | grilled-chicken-burger | — | Charcoal-grilled tandoori chicken thigh with mint raita slaw and pickled onions. |
| Midnight Mushroom Melt | 950 | mushroom-burger | New | Juicy beef patty under sautéed garlic mushrooms and a blanket of Swiss cheese. |

**Wraps**

| Item | Rs | Photo | Tag | Description |
|------|----|-------|-----|-------------|
| Spicy Chicken Wrap | 650 | chicken-wrap | Hot | Fiery grilled chicken, crunchy veggies and chipotle mayo rolled tight in a warm tortilla. |
| Saddar Shawarma | 450 | shawarma | Bestseller | Slow-roasted chicken shawarma with garlic toum and pickles, Saddar street-style. |
| Bahadurabad Paratha Roll | 390 | paratha-roll | — | Flaky desi paratha wrapped around spicy chicken boti, onions and green chutney. |
| Falafel Fire Wrap | 550 | falafel-wrap | Veg | Crispy herb falafel, tahini, fresh salad and a kick of red chilli sauce. |

**Fried Chicken**

| Item | Rs | Photo | Tag | Description |
|------|----|-------|-----|-------------|
| Crispy Bucket (6 pcs) | 1490 | fried-chicken | Bestseller | Six pieces of golden, extra-crunchy fried chicken marinated overnight in Karachi spices. |
| Fire Wings (8 pcs) | 890 | chicken-wings | Hot | Eight wings tossed in our blazing hot sauce — keep a drink close. |
| Golden Nuggets (10 pcs) | 590 | nuggets | — | Ten bite-sized, tender chicken nuggets with your choice of dip. |
| Crunchy Tenders (5 pcs) | 790 | tenders | — | Five hand-breaded chicken tenders, crisp outside and juicy within. |

**Sandwiches**

| Item | Rs | Photo | Tag | Description |
|------|----|-------|-----|-------------|
| Classic Club | 690 | club-sandwich | — | Triple-decker toast stacked with chicken, egg, cheese and fresh veggies. |
| Cheesy Grill Sandwich | 590 | grilled-sandwich | — | Pressed golden and oozing with melted cheese and spiced chicken. |
| Steak House Sandwich | 1090 | steak-sandwich | New | Tender grilled beef strips, caramelised onions and pepper sauce on a toasted roll. |
| Sea View Sub | 850 | sub-sandwich | — | A loaded sub with grilled chicken, cheese, olives and our signature sub sauce. |

**BBQ**

| Item | Rs | Photo | Tag | Description |
|------|----|-------|-----|-------------|
| Grill Mix Platter | 2290 | grill-platter | Bestseller | A sharing feast of tikka, kebabs and BBQ leg straight off the coals, with naan and chutney. |
| Charcoal Chicken Tikka | 790 | chicken-tikka | Hot | Burns Road-style chicken tikka, smoky, charred and bursting with masala. |
| Smoky BBQ Leg | 650 | bbq-chicken-leg | — | A whole chicken leg slow-grilled over charcoal and basted in tangy BBQ masala. |

**Bowls**

| Item | Rs | Photo | Tag | Description |
|------|----|-------|-----|-------------|
| Garden Fresh Bowl | 590 | salad-bowl | Veg | Crisp greens, cucumber, cherry tomatoes and sweetcorn with lemon-herb dressing. |
| Tikka Rice Bowl | 850 | rice-bowl | Bestseller | Fragrant rice topped with charcoal chicken tikka, salad and garlic sauce. |
| Grilled Caesar | 790 | caesar-salad | — | Grilled chicken over romaine with parmesan, crunchy croutons and creamy Caesar dressing. |
| Power Quinoa Bowl | 990 | quinoa-bowl | New | Protein-packed quinoa, grilled chicken, avocado and roasted veggies. |

**Sides & Drinks**

| Item | Rs | Photo | Tag | Description |
|------|----|-------|-----|-------------|
| Masala Fries | 290 | fries | — | Golden fries dusted with our secret Karachi masala. |
| Loaded Fire Fries | 590 | loaded-fries | Hot | Fries drowned in cheese sauce, spicy chicken, jalapeños and fire mayo. |
| Crispy Onion Rings | 390 | onion-rings | — | Thick-cut onion rings in a light, crunchy batter. |
| Mozzarella Sticks | 690 | mozzarella-sticks | — | Golden-fried mozzarella with a long, stretchy cheese pull and marinara dip. |
| Chocolate Thick Shake | 550 | milkshake | — | A thick, creamy chocolate shake topped with whipped cream. |
| Chilled Cola | 150 | cold-drink | — | An ice-cold fizzy cola to cool the fire. |
| Mint Margarita | 350 | mint-margarita | Bestseller | Karachi's favourite frozen mint and lemon cooler. |
| Iced Caramel Coffee | 490 | iced-coffee | — | Smooth cold coffee swirled with caramel over ice. |

**Combos**

| Item | Rs | Photo | Tag | Description |
|------|----|-------|-----|-------------|
| Grand Combo | 1490 | grand-combo | Bestseller | Our signature burger, masala fries and a chilled drink — the full Karachi feast. |

"Popular" sort order: Bestseller items first (in catalogue order), then Hot, then the rest.
Item ratings shown on cards range 4.5–4.9 (values only, no review counts).

### Key Entities

- **Category**: name, slug, photo, display order (8 categories).
- **Menu Item**: name, slug, category, base price, photo, alt text, description, tag, rating,
  popularity rank, option group, add-on list.
- **Option**: label, price difference; exactly one required per item.
- **Add-on**: label, price; zero or more per item.
- **Cart Line**: menu item, chosen option, chosen add-ons, note, quantity, unit price, line total.
- **Cart**: lines, subtotal, delivery fee, total.
- **Order**: order number, customer name, phone, area, address, notes, payment method, lines,
  totals, placed time, tracker stage.
- **Promo**: title, price/was-price or discount, target item, countdown flag.
- **Testimonial (sample)**: name, area, quote, rating, "sample" flag.
- **Delivery Area**: name (6 areas).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can go from landing on the home page to a placed Cash on
  Delivery order in under 2 minutes.
- **SC-002**: 100% of add-to-cart actions pass through the item detail step; no screen adds an item
  directly.
- **SC-003**: Every price shown on every screen equals base + option + add-ons × quantity and
  appears in `Rs 1,190` format (verified on all 33 items).
- **SC-004**: All pages display without horizontal scrolling, clipped text or overlapping elements
  at 360, 768, 1280 and 1920 pixel widths.
- **SC-005**: Every interactive feature (navigation, filters, item detail, cart, checkout, forms)
  can be completed using only a keyboard, with a visible focus indicator at every step.
- **SC-006**: Automated audits score 90 or higher for performance and accessibility on the home
  and menu pages on a mobile profile.
- **SC-007**: Cart and favourites survive a page refresh 100% of the time on the same device.
- **SC-008**: Zero instances of placeholder text, other brands' names/logos, or unlabelled
  reviews across all pages.
- **SC-009**: The main hero content is visible within 2.5 seconds on a typical mobile connection.

## Assumptions

- The "Burger Combo — Rs 1,490 (was Rs 1,830)" promo refers to the Grand Combo item.
- "Free delivery over Rs 1,500" is applied at a subtotal of Rs 1,500 or more.
- Items with a required option have no option preselected (constitution Principle III).
- "4.9 rating" and "50K+ happy customers" in the hero are owner-confirmed brand figures
  (2026-09-26) and will be replaced by backend data later; item ratings are shown as values only.
- Add-ons for Wraps, Fried Chicken, Sandwiches, BBQ and Bowls were proposed by the assistant and
  approved by the owner on 2026-09-26.

## Clarifications

### Session 2026-09-26

- Q: How much do Double and Family Pack add for Fried Chicken and BBQ? → A: Double +90%, Family
  Pack +220% of base, rounded to nearest Rs 10 (table in Menu Catalogue).
- Q: Is the Wings Wednesday 20% discount actually applied? → A: Yes, automatically on Fire Wings
  on Wednesdays PKT only; other days the banner counts down to next Wednesday (FR-015a).
- Q: Extras for non-burger categories? → A: Use the assistant's suggested lists (Menu Catalogue).
- Q: Are "4.9 rating" and "50K+ happy customers" real? → A: Keep as owner-supplied brand figures.
- Phone and email in the footer/contact use clearly formatted placeholder values
  (e.g. `+92 3XX XXXXXXX`, `hello@…`) until the owner provides real ones.
- Order confirmation and tracking are simulated on the device; no order reaches the restaurant in
  this phase.
- Login, signup, newsletter, contact form and payment are UI-only.

## Out of Scope

- Real accounts, authentication, payment processing, order submission to the kitchen, email/SMS,
  admin panel, real reviews, live tracking — all deferred to the backend phase.
- Multiple branches, scheduled orders, coupon codes, loyalty points.
- Urdu language version.
