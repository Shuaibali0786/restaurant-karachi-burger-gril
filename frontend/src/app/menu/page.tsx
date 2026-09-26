import type { Metadata } from "next";
import { Suspense } from "react";
import { Bike, Clock3, ShieldCheck } from "lucide-react";
import { getCategories, getMenuItems } from "@/lib/api";
import { PageHero } from "@/components/ui/PageHero";
import { MenuBrowser } from "@/components/menu/MenuBrowser";
import { MenuGrid } from "@/components/menu/MenuGrid";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Burgers, fried chicken, wraps, sandwiches, Burns Road BBQ, bowls, sides and drinks — all halal, made fresh when you order. Prices in PKR.",
};

const facts = [
  { Icon: ShieldCheck, label: "100% Halal" },
  { Icon: Clock3, label: "Open daily 12 noon – 3 AM" },
  { Icon: Bike, label: "Free delivery over Rs 1,500" },
];

export default async function MenuPage() {
  const [items, categories] = await Promise.all([getMenuItems({ sort: "popular" }), getCategories()]);

  return (
    <>
      <PageHero
        eyebrow="Karachi ka asli zaiqa"
        title="Our Menu"
        intro="Burgers, fried chicken, wraps and Burns Road BBQ — made fresh when you order."
      >
        <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-sand-300">
          {facts.map(({ Icon, label }) => (
            <li key={label} className="flex items-center gap-2">
              <Icon aria-hidden="true" className="size-4 text-flame-400" />
              {label}
            </li>
          ))}
        </ul>
      </PageHero>

      {/* Filters read the URL, so they sit in Suspense; the fallback is the full menu for no-JS/SEO. */}
      <Suspense
        fallback={
          <div className="container-page py-10">
            <MenuGrid items={items} categories={categories} grouped />
          </div>
        }
      >
        <MenuBrowser items={items} categories={categories} />
      </Suspense>
    </>
  );
}
