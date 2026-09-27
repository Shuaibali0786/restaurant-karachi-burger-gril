"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { AdminMenuItem } from "@/lib/types";
import { getAdminMenuItems, updateMenuItem } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import { cn } from "@/lib/cn";

function categoryLabel(slug: string) {
  return slug.replace(/-/g, " ");
}

function PriceInput({ item, onSaved }: { item: AdminMenuItem; onSaved: (item: AdminMenuItem) => void }) {
  const [value, setValue] = useState(String(item.basePrice));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Adjust the field during render (not an effect) when a save from elsewhere changes the price.
  const [lastPrice, setLastPrice] = useState(item.basePrice);
  if (item.basePrice !== lastPrice) {
    setLastPrice(item.basePrice);
    setValue(String(item.basePrice));
  }

  const commit = async () => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed === item.basePrice) {
      setValue(String(item.basePrice));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onSaved(await updateMenuItem(item.slug, { basePrice: Math.round(parsed) }));
    } catch (err) {
      setValue(String(item.basePrice));
      setError(err instanceof ApiError ? err.message : "Couldn't save the price.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <span className="text-ink-600">Rs</span>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        value={value}
        disabled={busy}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        aria-label={`Price for ${item.name}`}
        className="min-h-11 w-24 rounded-xl border-0 bg-cream-50 px-3 text-right text-sm font-bold text-ink-900 ring-1 ring-cream-200 focus:ring-2 focus:ring-ember-500 focus:outline-none"
      />
      {busy && <Loader2 aria-hidden="true" className="size-4 animate-spin text-ember-700" />}
      {error && <span className="text-xs font-semibold text-ember-700">{error}</span>}
    </div>
  );
}

function Toggle({ label, active, tone, onToggle }: { label: string; active: boolean; tone: "on" | "warn"; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={cn(
        "min-h-9 rounded-full px-3 text-xs font-bold whitespace-nowrap ring-1 transition",
        active
          ? tone === "warn"
            ? "bg-ember-700/10 text-ember-700 ring-ember-700/30"
            : "bg-ember-500 text-charcoal-950 ring-ember-500"
          : "bg-cream-100 text-ink-600 ring-cream-200",
      )}
    >
      {label}
    </button>
  );
}

/** Price, sold-out and hidden controls for every item, including ones hidden from customers —
 * `available: false` hides an item from the customer menu entirely, distinct from sold out. */
export function MenuTable() {
  const [items, setItems] = useState<AdminMenuItem[] | null>(null);
  const [busySlug, setBusySlug] = useState<string | null>(null);

  useEffect(() => {
    void getAdminMenuItems().then(setItems);
  }, []);

  if (!items) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Loader2 aria-hidden="true" className="size-6 animate-spin text-ember-700" />
      </div>
    );
  }

  const patch = async (slug: string, changes: Partial<{ available: boolean; soldOut: boolean }>) => {
    setBusySlug(slug);
    try {
      const updated = await updateMenuItem(slug, changes);
      setItems((prev) => prev!.map((item) => (item.slug === slug ? updated : item)));
    } finally {
      setBusySlug(null);
    }
  };

  const byCategory = new Map<string, AdminMenuItem[]>();
  for (const item of items) {
    byCategory.set(item.category, [...(byCategory.get(item.category) ?? []), item]);
  }

  return (
    <div className="space-y-6">
      {[...byCategory.entries()].map(([category, categoryItems]) => (
        <section key={category}>
          <h2 className="mb-2 text-sm font-bold tracking-wide text-ink-600 uppercase">{categoryLabel(category)}</h2>
          <ul className="space-y-2">
            {categoryItems.map((item) => (
              <li
                key={item.slug}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 rounded-card bg-white p-3 shadow-card ring-1 ring-cream-200",
                  !item.available && "opacity-60",
                )}
              >
                <span className="min-w-32 font-bold text-ink-900">{item.name}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <PriceInput item={item} onSaved={(updated) => setItems((prev) => prev!.map((i) => (i.slug === updated.slug ? updated : i)))} />
                  <Toggle
                    label={item.soldOut ? "Sold out" : "Available"}
                    active={item.soldOut}
                    tone="warn"
                    onToggle={() => void patch(item.slug, { soldOut: !item.soldOut })}
                  />
                  <Toggle
                    label={item.available ? "Visible" : "Hidden"}
                    active={!item.available}
                    tone="warn"
                    onToggle={() => void patch(item.slug, { available: !item.available })}
                  />
                  {busySlug === item.slug && <Loader2 aria-hidden="true" className="size-4 animate-spin text-ember-700" />}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
