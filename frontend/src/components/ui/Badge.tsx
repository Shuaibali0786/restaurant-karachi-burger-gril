import { ChefHat, Flame, Leaf, Sparkles, Trophy } from "lucide-react";
import type { ItemTag } from "@/lib/types";
import { cn } from "@/lib/cn";

const styles: Record<ItemTag, { label: string; className: string; Icon: typeof Flame }> = {
  bestseller: { label: "Bestseller", className: "bg-ember-500 text-charcoal-950", Icon: Trophy },
  "chef-pick": { label: "Chef's Pick", className: "bg-ember-700 text-cream-50", Icon: ChefHat },
  hot: { label: "Hot", className: "bg-charcoal-950 text-flame-400", Icon: Flame },
  new: { label: "New", className: "bg-flame-400 text-charcoal-950", Icon: Sparkles },
  veg: { label: "Veg", className: "bg-cream-50 text-ink-900 ring-1 ring-cream-200", Icon: Leaf },
};

export function Badge({ tag, className }: { tag: ItemTag; className?: string }) {
  const { label, className: tone, Icon } = styles[tag];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tracking-wide uppercase",
        tone,
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  );
}
