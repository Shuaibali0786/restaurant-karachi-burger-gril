import type { Metadata } from "next";
import { loadForPage } from "@/lib/server-data";
import { getMenuItems, getPromos } from "@/lib/api";
import { buildCardMap } from "@/components/menu/cardMap";
import { PageHero } from "@/components/ui/PageHero";
import { FavouritesView } from "@/components/menu/FavouritesView";

export const metadata: Metadata = {
  title: "Favourites",
  description: "Your saved favourites from Karachi Burger & Grill.",
  robots: { index: false },
};

export default async function FavouritesPage() {
  const [items, promos] = await loadForPage(() => Promise.all([getMenuItems(), getPromos()]));

  return (
    <>
      <PageHero eyebrow="Saved for later" title="Your favourites" intro="Everything you've hearted, ready to order again." />
      <div className="bg-cream-50">
        <div className="container-page py-10 sm:py-14">
          <FavouritesView items={items} cards={buildCardMap(items, promos)} />
        </div>
      </div>
    </>
  );
}
