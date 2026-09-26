import type { SiteInfo } from "@/lib/types";

/**
 * Brand facts shown across the site.
 * LAUNCH BLOCKER: `phone`, `email` and social `href`s are owner placeholders
 * (spec Assumptions) — replace with real details before going live.
 */
export const site: SiteInfo = {
  name: "Karachi Burger & Grill",
  tagline: "Karachi ka asli zaiqa",
  announcement: "Free delivery on orders over Rs 1,500 · Open daily 12 noon – 3 AM",
  address: "Burns Road, Saddar, Karachi",
  hours: "Open daily 12 noon – 3 AM",
  phone: "+92 300 0000000",
  email: "hello@karachiburgergrill.pk",
  story:
    "Charcoal-grilled burgers, crispy fried chicken and Burns Road BBQ — made fresh, halal and served hot till 3 AM.",
  nav: [
    { label: "Home", href: "/" },
    { label: "Menu", href: "/menu" },
    { label: "Combos", href: "/menu?category=combos" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  footer: {
    quickLinks: [
      { label: "Home", href: "/" },
      { label: "Menu", href: "/menu" },
      { label: "Combos", href: "/menu?category=combos" },
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
    support: [
      { label: "FAQ", href: "/coming-soon" },
      { label: "Track Order", href: "/coming-soon" },
      { label: "Privacy Policy", href: "/coming-soon" },
      { label: "Terms & Conditions", href: "/coming-soon" },
    ],
  },
  socials: [
    { network: "instagram", label: "Instagram", href: "https://instagram.com/" },
    { network: "facebook", label: "Facebook", href: "https://facebook.com/" },
    { network: "tiktok", label: "TikTok", href: "https://tiktok.com/" },
    { network: "whatsapp", label: "WhatsApp", href: "https://wa.me/" },
  ],
};
