import type { Metadata } from "next";
import { getCategories, getFeaturedItems, getMenuItems, getPromos, getTestimonials } from "@/lib/api";
import { AboutTeaser } from "@/components/home/AboutTeaser";
import { Categories } from "@/components/home/Categories";
import { ChefSpecials } from "@/components/home/ChefSpecials";
import { Features } from "@/components/home/Features";
import { FinalCta } from "@/components/home/FinalCta";
import { Hero } from "@/components/home/Hero";
import { MostLoved } from "@/components/home/MostLoved";
import { buildCardMap } from "@/components/menu/cardMap";
import { PromoBanners } from "@/components/home/PromoBanners";
import { Testimonials } from "@/components/home/Testimonials";
import { siteUrl } from "@/lib/site-url";

/** Restaurant structured data for search engines (placeholder phone deliberately omitted). */
function restaurantJsonLd() {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "Karachi Burger & Grill",
    slogan: "Karachi ka asli zaiqa",
    url,
    image: `${url}/images/grand-combo.jpg`,
    servesCuisine: ["Burgers", "Fried chicken", "Pakistani BBQ"],
    priceRange: "Rs 150 – Rs 2,290",
    address: { "@type": "PostalAddress", streetAddress: "Burns Road", addressLocality: "Karachi", addressRegion: "Sindh", addressCountry: "PK" },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "12:00",
      closes: "03:00",
    },
    hasMenu: `${url}/menu`,
    acceptsReservations: false,
  };
}

export const metadata: Metadata = {
  title: { absolute: "Karachi Burger & Grill · Karachi ka asli zaiqa" },
};

export default async function HomePage() {
  const [categories, featured, items, specials, promos, testimonials] = await Promise.all([
    getCategories(),
    getFeaturedItems("most-loved"),
    getMenuItems({ sort: "popular" }),
    getFeaturedItems("chef-special"),
    getPromos(),
    getTestimonials(),
  ]);

  // Most Loved tabs: "All" shows the 10 favourites; each category tab its top 3.
  const featuredSlugs = featured.slice(0, 10).map((item) => item.slug);
  const topByCategory = Object.fromEntries(
    categories.map((category) => [
      category.id,
      items.filter((item) => item.category === category.id).slice(0, 3).map((item) => item.slug),
    ]),
  );
  // Top 3 per tab keeps the page light; render each card once, on the server.
  const shown = new Set([...featuredSlugs, ...Object.values(topByCategory).flat()]);
  const cards = buildCardMap(items.filter((item) => shown.has(item.slug)), promos);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd()) }} />
      <Hero />
      <div className="bg-cream-50">
        <Features />
        <Categories categories={categories} />
      </div>
      <MostLoved featured={featuredSlugs} byCategory={topByCategory} categories={categories} cards={cards} />
      <PromoBanners promos={promos} />
      <ChefSpecials items={specials} />
      <AboutTeaser />
      <Testimonials testimonials={testimonials} />
      <FinalCta />
    </>
  );
}
