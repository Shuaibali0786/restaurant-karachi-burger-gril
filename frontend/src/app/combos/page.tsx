import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Plus, Utensils } from "lucide-react";
import { getCategories, getMenuItem, getMenuItems, getPromos } from "@/lib/api";
import { formatRs } from "@/lib/format";
import { buttonClasses } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PromoBanners } from "@/components/home/PromoBanners";
import { OpenItemButton } from "@/components/menu/OpenItemButton";
import { ProductCard } from "@/components/menu/ProductCard";

export const metadata: Metadata = {
  title: "Combos & deals",
  description: "The Grand Combo, Burger Combo savings, Wings Wednesday and meal upgrades at Karachi Burger & Grill.",
};

export default async function CombosPage() {
  const [combo, promos, items, categories] = await Promise.all([
    getMenuItem("grand-combo"),
    getPromos(),
    getMenuItems({ sort: "popular" }),
    getCategories(),
  ]);
  if (!combo) notFound();

  // Categories whose items can be upgraded to a meal, with that upgrade's price.
  const mealCategories = categories
    .map((category) => {
      const inCategory = items.filter((item) => item.category === category.id);
      const meal = inCategory[0]?.options.find((option) => option.id === "meal");
      return meal ? { category, meal, items: inCategory } : null;
    })
    .filter((entry) => entry !== null);

  return (
    <>
      <PageHero eyebrow="More food, better value" title="Combos & Deals" intro="Our signature combo, this week's deals, and meal upgrades on your favourite burgers, wraps and sandwiches." />

      {/* Signature combo */}
      <section aria-labelledby="grand-combo-title" className="bg-cream-50 pt-14">
        <div className="container-page">
          <article className="grid overflow-hidden rounded-card bg-charcoal-950 text-cream-50 shadow-card lg:grid-cols-2">
            <div className="relative aspect-[3/2] lg:aspect-auto">
              <Image src={combo.image} alt={combo.imageAlt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </div>
            <div className="flex flex-col justify-center p-7 sm:p-10">
              {combo.tag && <Badge tag={combo.tag} className="self-start" />}
              <p className="font-script mt-4 text-2xl text-flame-400">Our signature</p>
              <h2 id="grand-combo-title" className="font-display text-5xl leading-none font-black sm:text-6xl">
                {combo.name}
              </h2>
              <p className="mt-3 max-w-md text-lg text-sand-300">{combo.description}</p>
              <p className="mt-5 text-3xl font-black text-flame-400">{formatRs(combo.basePrice)}</p>
              <OpenItemButton slug={combo.slug} className={buttonClasses("primary", "lg", "mt-6 self-start")}>
                Add Grand Combo <Plus aria-hidden="true" className="size-5" strokeWidth={3} />
              </OpenItemButton>
            </div>
          </article>
        </div>
      </section>

      <PromoBanners promos={promos} />

      {/* Meal upgrades */}
      <section aria-labelledby="meals-title" className="bg-cream-100/70 py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading id="meals-title" eyebrow="Hungrier?" title="Make it a meal" />
          <p className="-mt-4 mb-10 max-w-2xl text-ink-600">
            Pick <strong className="text-ink-900">Meal</strong> when you choose your option on any of these and we&apos;ll add{" "}
            <strong className="text-ink-900">Masala Fries + a Chilled Cola</strong>. The upgrade price is shown below and in the item view.
          </p>
          <div className="space-y-12">
            {mealCategories.map(({ category, meal, items: inCategory }) => (
              <section key={category.id} aria-labelledby={`meal-${category.id}`}>
                <h3 id={`meal-${category.id}`} className="font-display mb-5 flex flex-wrap items-center gap-3 text-3xl font-black text-ink-900">
                  {category.name}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-charcoal-950 px-3 py-1 font-sans text-sm font-bold tracking-normal text-flame-400 normal-case">
                    <Utensils aria-hidden="true" className="size-4" /> Meal + {formatRs(meal.priceDelta)}
                  </span>
                  {meal.includes && <span className="font-sans text-sm font-semibold tracking-normal text-ink-600 normal-case">{meal.includes}</span>}
                </h3>
                <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {inCategory.map((item) => (
                    <ProductCard key={item.slug} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
