"use client";

import { Fragment, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { Category, CategorySlug } from "@/lib/types";
import { cn } from "@/lib/cn";
import { SectionHeading } from "@/components/ui/SectionHeading";

interface MostLovedProps {
  /** Slugs shown under "All" (most loved, by popularity). */
  featured: string[];
  /** Each category tab's top slugs (prepared on the server). */
  byCategory: Partial<Record<CategorySlug, string[]>>;
  categories: Category[];
  /** Server-rendered product cards keyed by slug (see buildCardMap). */
  cards: Record<string, ReactNode>;
}

type TabId = "all" | CategorySlug;

const ALL_LIMIT = 10;

export function MostLoved({ featured, byCategory, categories, cards }: MostLovedProps) {
  const [active, setActive] = useState<TabId>("all");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const baseId = useId();

  const tabs: { id: TabId; label: string }[] = [
    { id: "all", label: "All" },
    ...categories.map((category) => ({ id: category.id, label: category.name })),
  ];

  const visible =
    active === "all"
      ? featured.slice(0, ALL_LIMIT)
      : (byCategory[active] ?? []);

  // Arrow-key navigation between tabs (WAI-ARIA tabs pattern, automatic activation).
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = tabs.length - 1;
    const next =
      event.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (next === null) return;
    event.preventDefault();
    const tab = tabs[next];
    if (tab) setActive(tab.id);
    tabRefs.current[next]?.focus();
  };

  return (
    <section aria-labelledby={`${baseId}-title`} className="defer-paint bg-cream-100/70 py-16 sm:py-20">
      <div className="reveal-on-scroll container-page">
        <SectionHeading
          id={`${baseId}-title`}
          eyebrow="Our signature"
          title="Most Loved Items"
          link={{ label: "View full menu", href: "/menu" }}
        />

        <div
          role="tablist"
          aria-label="Filter most loved items by category"
          className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
        >
          {tabs.map((tab, index) => {
            const selected = tab.id === active;
            return (
              <button
                key={tab.id}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(tab.id)}
                onKeyDown={(event) => onKeyDown(event, index)}
                className={cn(
                  "min-h-11 shrink-0 rounded-full px-5 text-sm font-bold whitespace-nowrap transition",
                  selected
                    ? "bg-flame-400 text-charcoal-950 shadow-[0_8px_20px_-10px_rgb(255_176_32/0.9)]"
                    : "bg-white text-ink-900 ring-1 ring-cream-200 hover:ring-ember-500",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`${baseId}-panel`}
          aria-labelledby={`${baseId}-tab-${active}`}
          className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        >
          {visible.map((slug) => (
            <Fragment key={slug}>{cards[slug]}</Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
