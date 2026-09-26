import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ChoiceCardProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> & {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  /** Right-aligned extra, e.g. a "Coming soon" pill. */
  aside?: ReactNode;
};

/** A large, tappable radio option (delivery time, payment method…). */
export function ChoiceCard({ title, description, icon, aside, disabled, className, ...input }: ChoiceCardProps) {
  return (
    <label
      className={cn(
        "flex min-h-16 items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-cream-200 transition",
        "has-checked:ring-2 has-checked:ring-ember-500 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-flame-400",
        disabled ? "cursor-not-allowed bg-cream-100/60 opacity-70" : "cursor-pointer hover:ring-ember-500",
        className,
      )}
    >
      <input type="radio" disabled={disabled} className="peer sr-only" {...input} />
      <span
        aria-hidden="true"
        className="flex size-5 shrink-0 items-center justify-center rounded-full ring-2 ring-cream-200 peer-checked:bg-ember-500 peer-checked:ring-ember-500 peer-checked:[&>span]:opacity-100"
      >
        <span className="size-2 rounded-full bg-white opacity-0" />
      </span>
      {icon && <span className="text-ember-700">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-ink-900">{title}</span>
        {description && <span className="block text-sm text-ink-600">{description}</span>}
      </span>
      {aside}
    </label>
  );
}
