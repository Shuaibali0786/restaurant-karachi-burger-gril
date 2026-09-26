import type { Metadata } from "next";
import { getMenuItems } from "@/lib/api";
import { PageHero } from "@/components/ui/PageHero";
import { FavouritesView } from "@/components/menu/FavouritesView";

export const metadata: Metadata = {
  title: "Favourites",
  description: "Your saved favourites from Karachi Burger & Grill.",
  robots: { index: false },
};

export default async function FavouritesPage() {
  const items = await getMenuItems();

  return (
    <>
      <PageHero eyebrow="Saved for later" title="Your favourites" intro="Everything you've hearted, ready to order again." />
      <div className="bg-cream-50">
        <div className="container-page py-10 sm:py-14">
          <FavouritesView items={items} />
        </div>
      </div>
    </>
  );
}
