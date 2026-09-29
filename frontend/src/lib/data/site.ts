import type { SiteInfo } from "@/lib/types";

/**
 * Brand facts shown across the site.
 * Portfolio demo: no phone or social links are shown; `email` is a demo address.
 */
export const site: SiteInfo = {
  name: "Karachi Burger & Grill",
  tagline: "Karachi ka asli zaiqa",
  announcement: "Free delivery on orders over Rs 1,500 · Open daily 12 noon – 3 AM",
  demoNotice: "Portfolio demo — orders are not actually delivered.",
  address: "Burns Road, Saddar, Karachi",
  hours: "Open daily 12 noon – 3 AM",
  email: "hello@karachiburgergrill.pk",
  story:
    "Charcoal-grilled burgers, crispy fried chicken and Burns Road BBQ — made fresh, halal and served hot till 3 AM.",
  nav: [
    { label: "Home", href: "/" },
    { label: "Menu", href: "/menu" },
    { label: "Combos", href: "/combos" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  footer: {
    quickLinks: [
      { label: "Home", href: "/" },
      { label: "Menu", href: "/menu" },
      { label: "Combos", href: "/combos" },
      { label: "Favourites", href: "/favourites" },
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
    support: [
      { label: "FAQ", href: "/faq" },
      { label: "Track Order", href: "/track" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms & Conditions", href: "/terms" },
    ],
  },
};
