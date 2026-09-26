import type { Metadata } from "next";
import { getCategories, getFeaturedItems, getMenuItems, getPromos, getTestimonials } from "@/lib/api";
import { AboutTeaser } from "@/components/home/AboutTeaser";
import { Categories } from "@/components/home/Categories";
import { ChefSpecials } from "@/components/home/ChefSpecials";
import { Features } from "@/components/home/Features";
import { FinalCta } from "@/components/home/FinalCta";
import { Hero } from "@/components/home/Hero";
import { MostLoved } from "@/components/home/MostLoved";
import { PromoBanners } from "@/components/home/PromoBanners";
import { Testimonials } from "@/components/home/Testimonials";

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

  return (
    <>
      <Hero />
      <div className="bg-cream-50">
        <Features />
        <Categories categories={categories} />
      </div>
      <MostLoved featured={featured} items={items} categories={categories} />
      <PromoBanners promos={promos} />
      <ChefSpecials items={specials} />
      <AboutTeaser />
      <Testimonials testimonials={testimonials} />
      <FinalCta />
    </>
  );
}
