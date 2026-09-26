import type { Metadata } from "next";
import { getCategories, getFeaturedItems, getMenuItems } from "@/lib/api";
import { Categories } from "@/components/home/Categories";
import { Features } from "@/components/home/Features";
import { Hero } from "@/components/home/Hero";
import { MostLoved } from "@/components/home/MostLoved";

export const metadata: Metadata = {
  title: { absolute: "Karachi Burger & Grill · Karachi ka asli zaiqa" },
};

export default async function HomePage() {
  const [categories, featured, items] = await Promise.all([
    getCategories(),
    getFeaturedItems("most-loved"),
    getMenuItems({ sort: "popular" }),
  ]);

  return (
    <>
      <Hero />
      <div className="bg-cream-50">
        <Features />
        <Categories categories={categories} />
      </div>
      <MostLoved featured={featured} items={items} categories={categories} />
    </>
  );
}
