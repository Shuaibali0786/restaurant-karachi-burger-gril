---
id: 003
title: Specify restaurant frontend
stage: spec
date: 2026-09-26
surface: agent
model: claude-opus-5-5
feature: 001-restaurant-frontend
branch: 001-restaurant-frontend
user: Shuaibali0786
command: /sp.specify
labels: ["spec", "frontend", "menu", "cart", "checkout"]
links:
  spec: specs/001-restaurant-frontend/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/001-restaurant-frontend/spec.md
 - specs/001-restaurant-frontend/checklists/requirements.md
tests:
 - none
---

## Prompt

/sp.specify
Build the complete FRONTEND of the "Karachi Burger & Grill" restaurant website (tagline: "Karachi ka asli zaiqa"). Design reference: assets/design-reference.png — follow its layout, warmth and energy with our own brand name, logo and photos. All food photos: assets/images (38 jpg files, names below). It must look like a real Karachi restaurant brand that customers trust and order from.

PAGES
1. Home (/):
 - Top announcement bar: "Free delivery on orders over Rs 1,500 · Open daily 12 noon – 3 AM".
 - Sticky navbar: flame logo with "KARACHI" and "BURGER & GRILL", links (Home, Menu, Combos, About, Contact), search, login icon, cart icon with item count, "Order Now" button; becomes solid on scroll; hamburger menu on mobile.
 - Hero like the reference: dark warm background, big headline with a handwritten accent ("It's not just food — it's Karachi's fire!"), subline "Fresh ingredients. Bold flavours. Unforgettable taste.", buttons "Order Online" and "View Menu", hero photo grand-combo.jpg with ember particles and warm glow, floating badges (25–30 min delivery, 4.9 rating, "Freshly made" doodle arrow), stats card "50K+ happy customers".
 - Features strip: Fresh Ingredients, 100% Halal, 30 Min Delivery, Easy Online Ordering.
 - Categories: 8 round photo chips that filter the menu.
 - "Most Loved Items": category tabs + product cards (photo, tag like Bestseller/Hot, heart favourite, name, short description, star rating, price, "Add +" button) and a "View full menu" link.
 - Two promo banners side by side: "Burger Combo — Rs 1,490 (was Rs 1,830)" and "Wings Wednesday — 20% off wings" with a countdown to midnight Pakistan time.
 - Chef's specials bento: Grill Mix Platter (large), Grand Combo, Loaded Fire Fries.
 - About teaser with photos about-chef, about-restaurant, about-street and an "Our Story" button.
 - Testimonials section clearly labelled "Sample reviews".
 - Final CTA "Taste the fire" over fire-bg.jpg.
 - Rich footer: logo, quick links, support (FAQ, Track Order, Privacy, Terms), contact (Burns Road, Saddar, Karachi · hours · phone and email placeholders), newsletter signup, social icons.
2. Menu (/menu): all items, category filter, search, sort (popular, price low–high, high–low), responsive grid.
3. Item detail: clicking a card or "Add" opens a modal (desktop: photo left, options right; mobile: bottom sheet) AND there is a shareable page /menu/[slug]. It shows photo, name, description, live price, "Choose an option" (required), "Make it extra" add-ons (checkboxes with prices), special instructions textarea (500-character counter), quantity stepper (trash icon at 1), and a "Rs X | Add to cart →" button. Nothing is added to the cart without this step.
4. Cart: slide-in drawer and /cart page. Each line shows option, add-ons, note, unit price, quantity stepper and remove. Subtotal, delivery (Rs 150, free over Rs 1,500), total. Saved in localStorage.
5. Checkout (/checkout): name, Pakistani phone number, delivery area (Saddar, Clifton, DHA, PECHS, Gulshan, North Nazimabad), full address, delivery notes, payment (Cash on Delivery; Card marked "coming soon"), order summary, place-order button with validation. Then an order confirmation page with order number and a mock tracker (Confirmed → Preparing → On the way → Delivered).
6. Favourites (/favourites), Login (/login) and Signup (/signup) as UI only, About (/about), Contact (/contact with form and opening hours), and a custom 404.

MENU (name — price in Rs — image file — category):
Burgers (options Single / Double +300 / Meal +350; add-ons extra cheese 100, jalapeños 50, extra patty 300, chipotle sauce 50):
 Burns Road Zinger 690 zinger-burger · Smoky Smash Beef 890 smash-burger · Double Trouble Cheese 1190 double-cheese-burger · Tandoori Grill Burger 790 grilled-chicken-burger · Midnight Mushroom Melt 950 mushroom-burger
Wraps (Regular / Large +150 / Meal +300): Spicy Chicken Wrap 650 chicken-wrap · Saddar Shawarma 450 shawarma · Bahadurabad Paratha Roll 390 paratha-roll · Falafel Fire Wrap 550 falafel-wrap
Fried Chicken (Regular / Double / Family Pack): Crispy Bucket 6 pcs 1490 fried-chicken · Fire Wings 8 pcs 890 chicken-wings · Golden Nuggets 10 pcs 590 nuggets · Crunchy Tenders 5 pcs 790 tenders
Sandwiches (Regular / Large +250 / Meal +300): Classic Club 690 club-sandwich · Cheesy Grill Sandwich 590 grilled-sandwich · Steak House Sandwich 1090 steak-sandwich · Sea View Sub 850 sub-sandwich
BBQ (Single / Double / Family Pack): Grill Mix Platter 2290 grill-platter · Charcoal Chicken Tikka 790 chicken-tikka · Smoky BBQ Leg 650 bbq-chicken-leg
Bowls (Regular / Large +200): Garden Fresh Bowl 590 salad-bowl · Tikka Rice Bowl 850 rice-bowl · Grilled Caesar 790 caesar-salad · Power Quinoa Bowl 990 quinoa-bowl
Sides & Drinks (Regular / Large +120): Masala Fries 290 fries · Loaded Fire Fries 590 loaded-fries · Crispy Onion Rings 390 onion-rings · Mozzarella Sticks 690 mozzarella-sticks · Chocolate Thick Shake 550 milkshake · Chilled Cola 150 cold-drink · Mint Margarita 350 mint-margarita · Iced Caramel Coffee 490 iced-coffee
Combo: Grand Combo 1490 grand-combo.

Write an appetising one-line description for every item.

## Response snapshot

Created branch 001-restaurant-frontend and spec.md with 7 prioritised user stories (P1 customise-to-cart, P1 cart + COD checkout, P2 home page, P2 search/filter/sort, P3 favourites, P3 about/contact, P3 account UI), edge cases, FR-001–FR-062, a full 33-item menu catalogue with descriptions/tags, key entities, 9 success criteria, assumptions and out-of-scope. Quality checklist passes except 3 open clarifications: Q1 Fried Chicken/BBQ option prices, Q2 whether Wings Wednesday discount applies, Q3 add-ons for non-burger categories.

## Outcome

- ✅ Impact: Frontend phase specification drafted; awaiting 3 owner decisions.
- 🧪 Tests: none
- 📁 Files: spec.md, checklists/requirements.md
- 🔁 Next prompts: answer Q1–Q3, then /sp.plan
- 🧠 Reflection: Pricing gaps left open rather than invented, per constitution "no invented data".

## Evaluation notes (flywheel)

- Failure modes observed: create-new-feature.ps1 raised a parameter-binding error after creating branch and spec file
- Graders run and results (PASS/FAIL): spec quality checklist — 15/16 PASS (clarifications pending)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
