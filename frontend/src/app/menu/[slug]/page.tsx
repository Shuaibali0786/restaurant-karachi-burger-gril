import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, PackageX } from "lucide-react";
import { getCategories, getMenuItem, getMenuItems, getMenuSlugs, getPromos } from "@/lib/api";
import { formatRs } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";
import { ItemDetail } from "@/components/menu/ItemDetail";
import { ProductCard } from "@/components/menu/ProductCard";
import { dealFor } from "@/components/menu/cardMap";

interface ItemPageProps {
  params: Promise<{ slug: string }>;
}

// Prerendered for every slug known at build time; a slug added since the last build (or a build
// that could not reach the API, see getMenuSlugs) still renders on first request.
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getMenuSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ItemPageProps): Promise<Metadata> {
  const item = await getMenuItem((await params).slug);
  if (!item) return {};
  const description = `${item.description} From ${formatRs(item.basePrice)} at Karachi Burger & Grill.`;
  return {
    title: item.name,
    description,
    openGraph: {
      title: `${item.name} · Karachi Burger & Grill`,
      description,
      images: [{ url: item.image, alt: item.imageAlt }],
    },
  };
}

export default async function ItemPage({ params }: ItemPageProps) {
  const { slug } = await params;
  const item = await getMenuItem(slug);
  if (!item) notFound();

  const [categories, sameCategory, promos] = await Promise.all([
    getCategories(),
    item.available ? getMenuItems({ category: item.category }) : Promise.resolve([]),
    getPromos(),
  ]);
  const category = categories.find((c) => c.id === item.category);
  const related = sameCategory.filter((other) => other.slug !== item.slug).slice(0, 4);

  return (
    <div className="bg-cream-50">
      <div className="container-page pt-6 pb-16 sm:pt-8">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1 text-sm font-semibold text-ink-600">
            <li>
              <Link href="/menu" className="inline-flex min-h-11 items-center hover:text-ember-700">
                Menu
              </Link>
            </li>
            <ChevronRight aria-hidden="true" className="size-4" />
            {category && item.available && (
              <>
                <li>
                  <Link href={`/menu?category=${category.id}`} className="inline-flex min-h-11 items-center hover:text-ember-700">
                    {category.name}
                  </Link>
                </li>
                <ChevronRight aria-hidden="true" className="size-4" />
              </>
            )}
            <li aria-current="page" className="text-ink-900">
              {item.name}
            </li>
          </ol>
        </nav>

        {!item.available ? (
          <EmptyState
            icon={<PackageX aria-hidden="true" className="size-9" />}
            title="This item isn't available right now"
            text="It may come back on the menu later. Take a look at what's on offer today instead."
            action={
              <Link
                href="/menu"
                className="inline-flex min-h-11 items-center rounded-full bg-charcoal-950 px-6 font-bold text-cream-50 transition hover:bg-charcoal-800"
              >
                Back to the menu
              </Link>
            }
          />
        ) : (
          <ItemDetail item={item} variant="page" />
        )}

        {related.length > 0 && (
          <section aria-labelledby="related-title" className="mt-20">
            <h2 id="related-title" className="font-display mb-6 text-4xl font-black text-ink-900">
              You may also like
            </h2>
            <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-4">
              {related.map((other) => (
                <ProductCard key={other.slug} item={other} deal={dealFor(other.slug, promos)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
