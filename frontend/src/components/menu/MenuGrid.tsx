import { Fragment, type ReactNode } from "react";
import { SearchX } from "lucide-react";
import type { Category, MenuItemView } from "@/lib/types";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ui/EmptyState";

const grid = "grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

interface MenuGridProps {
  /** Already filtered and sorted. */
  items: MenuItemView[];
  categories: Category[];
  /** Server-rendered product cards keyed by slug (see buildCardMap). */
  cards: Record<string, ReactNode>;
  /** Unfiltered view: show sections per category, like a delivery app. */
  grouped: boolean;
  summary?: string;
  onClear?: () => void;
}

export function MenuGrid({ items, categories, cards, grouped, summary, onClear }: MenuGridProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<SearchX aria-hidden="true" className="size-9" />}
        title="No matches"
        text={summary ? `Nothing on the menu matches ${summary}. Try a different word or category.` : undefined}
        action={
          onClear && (
            <button
              type="button"
              onClick={onClear}
              className="min-h-11 rounded-full bg-charcoal-950 px-6 font-bold text-cream-50 transition hover:bg-charcoal-800"
            >
              Clear filters
            </button>
          )
        }
      />
    );
  }

  if (grouped) {
    return (
      <div className="space-y-14">
        {categories.map((category, index) => {
          const inCategory = items.filter((item) => item.category === category.id);
          if (inCategory.length === 0) return null;
          return (
            <section key={category.id} aria-labelledby={`menu-${category.id}`} className={cn("reveal-on-scroll scroll-mt-48", index > 0 && "defer-paint")}>
              <h2 id={`menu-${category.id}`} className="font-display mb-5 flex items-baseline gap-3 text-4xl font-black text-ink-900">
                {category.name}
                <span className="text-base font-bold text-ink-600">{inCategory.length}</span>
              </h2>
              <div className={grid}>
                {inCategory.map((item) => (
                  <Fragment key={item.slug}>{cards[item.slug]}</Fragment>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="font-bold text-ink-900" aria-live="polite">
          {items.length} {items.length === 1 ? "item" : "items"}
          {summary && <span className="font-medium text-ink-600"> for {summary}</span>}
        </p>
        {onClear && (
          <button type="button" onClick={onClear} className="min-h-11 font-bold text-ember-700 underline-offset-4 hover:underline">
            Clear filters
          </button>
        )}
      </div>
      <div className={grid}>
        {items.map((item) => (
          <Fragment key={item.slug}>{cards[item.slug]}</Fragment>
        ))}
      </div>
    </div>
  );
}
