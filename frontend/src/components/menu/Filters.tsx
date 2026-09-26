"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import type { Category, CategorySlug, MenuSort } from "@/lib/types";
import { menuSorts } from "@/lib/menu";
import { cn } from "@/lib/cn";
import type { MenuViewState } from "@/hooks/useMenuQuery";

interface FiltersProps {
  categories: Category[];
  counts: Record<CategorySlug, number>;
  total: number;
  state: MenuViewState;
  onChange: (patch: Partial<MenuViewState>) => void;
}

const SEARCH_DEBOUNCE_MS = 200;

const chip = "min-h-11 shrink-0 rounded-full px-4 text-sm font-bold whitespace-nowrap transition";

export function Filters({ categories, counts, total, state, onChange }: FiltersProps) {
  const uid = useId();
  const [term, setTerm] = useState(state.search);
  const [syncedSearch, setSyncedSearch] = useState(state.search);

  // Adopt searches that arrive from elsewhere (e.g. the navbar search) without fighting typing.
  if (state.search !== syncedSearch) {
    setSyncedSearch(state.search);
    if (state.search !== term.trim()) setTerm(state.search);
  }

  useEffect(() => {
    if (term.trim() === state.search) return;
    const id = window.setTimeout(() => onChange({ search: term }), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [term, state.search, onChange]);

  const options: { id: CategorySlug | null; label: string; count: number }[] = [
    { id: null, label: "All", count: total },
    ...categories.map((c) => ({ id: c.id, label: c.name, count: counts[c.id] ?? 0 })),
  ];

  return (
    <div className="sticky top-(--nav-h) z-30 border-b border-cream-200 bg-cream-50/95 backdrop-blur-md">
      <div className="container-page space-y-3 py-3">
        <div className="flex gap-2 sm:gap-3">
          <div className="relative flex-1">
            <label htmlFor={`${uid}-search`} className="sr-only">
              Search the menu
            </label>
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-600" />
            <input
              id={`${uid}-search`}
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search burgers, wings, tikka…"
              autoComplete="off"
              maxLength={60}
              className="min-h-12 w-full rounded-full border-0 bg-white pr-11 pl-12 text-ink-900 ring-1 ring-cream-200 placeholder:text-ink-600/80 focus:ring-2 focus:ring-ember-500 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {term && (
              <button
                type="button"
                onClick={() => setTerm("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-1 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-ink-600 hover:bg-cream-100 hover:text-ink-900"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            )}
          </div>

          <div className="relative">
            <label htmlFor={`${uid}-sort`} className="sr-only">
              Sort by
            </label>
            <select
              id={`${uid}-sort`}
              value={state.sort}
              onChange={(event) => onChange({ sort: event.target.value as MenuSort })}
              className="min-h-12 appearance-none rounded-full border-0 bg-white pr-10 pl-4 text-sm font-bold text-ink-900 ring-1 ring-cream-200 focus:ring-2 focus:ring-ember-500 focus:outline-none"
            >
              {menuSorts.map((sort) => (
                <option key={sort.value} value={sort.value}>
                  {sort.label}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink-600" />
          </div>
        </div>

        <div role="group" aria-label="Filter by category" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
          {options.map((option) => {
            const active = option.id === state.category;
            return (
              <button
                key={option.label}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ category: option.id })}
                className={cn(
                  chip,
                  active
                    ? "bg-charcoal-950 text-cream-50"
                    : "bg-white text-ink-900 ring-1 ring-cream-200 hover:ring-ember-500",
                )}
              >
                {option.label}
                <span className={cn("ml-1.5 text-xs", active ? "text-flame-400" : "text-ink-600")}>{option.count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
