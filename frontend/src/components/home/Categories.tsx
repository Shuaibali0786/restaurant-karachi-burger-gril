import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/lib/types";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Categories({ categories }: { categories: Category[] }) {
  return (
    <section aria-labelledby="categories-title" className="pt-16 pb-6 sm:pt-20">
      <div className="reveal-on-scroll container-page">
        <SectionHeading id="categories-title" eyebrow="Craving something?" title="Explore the menu" align="center" />
        <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-8">
          {categories.map((category) => (
            <li key={category.id} className="shrink-0 snap-start">
              <Link
                href={`/menu?category=${category.id}`}
                className="group flex w-24 flex-col items-center gap-3 rounded-2xl p-1 text-center sm:w-auto"
              >
                <span className="relative size-24 overflow-hidden rounded-full shadow-card ring-4 ring-white transition duration-300 group-hover:-translate-y-1 group-hover:ring-ember-500 group-hover:shadow-glow sm:size-28">
                  <Image
                    src={category.image}
                    alt=""
                    fill
                    sizes="112px"
                    className="object-cover transition duration-500 group-hover:scale-110"
                  />
                </span>
                <span className="text-sm leading-tight font-extrabold text-ink-900 group-hover:text-ember-700">
                  {category.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
