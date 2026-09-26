"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { MAX_QUANTITY } from "@/lib/cart";
import { cn } from "@/lib/cn";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  /** When given, the minus button becomes a trash icon at 1 and calls this. */
  onRemove?: () => void;
  max?: number;
  /** Used in accessible labels, e.g. "Decrease quantity of Burns Road Zinger". */
  itemName: string;
  size?: "md" | "lg";
  className?: string;
}

export function QuantityStepper({ value, onChange, onRemove, max = MAX_QUANTITY, itemName, size = "md", className }: QuantityStepperProps) {
  const atMin = value <= 1;
  const showTrash = atMin && onRemove !== undefined;
  const button = cn(
    "flex items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40",
    size === "lg" ? "size-12" : "size-11",
  );

  return (
    <div className={cn("inline-flex items-center gap-1 rounded-full bg-cream-100 p-1 ring-1 ring-cream-200", className)}>
      <button
        type="button"
        onClick={() => (showTrash ? onRemove() : onChange(value - 1))}
        disabled={atMin && !showTrash}
        aria-label={showTrash ? `Remove ${itemName}` : `Decrease quantity of ${itemName}`}
        className={cn(button, showTrash ? "text-ember-700 hover:bg-ember-500/10" : "text-ink-900 hover:bg-white")}
      >
        {showTrash ? <Trash2 aria-hidden="true" className="size-5" /> : <Minus aria-hidden="true" className="size-5" />}
      </button>
      <output aria-live="polite" aria-label={`Quantity ${value}`} className="min-w-8 text-center text-lg font-extrabold text-ink-900 tabular-nums">
        {value}
      </output>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={`Increase quantity of ${itemName}`}
        className={cn(button, "bg-charcoal-950 text-cream-50 hover:bg-ember-600")}
      >
        <Plus aria-hidden="true" className="size-5" />
      </button>
    </div>
  );
}
