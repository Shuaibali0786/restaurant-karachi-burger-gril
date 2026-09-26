import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

/** Shared text-input styling; add `aria-invalid` and the error ring comes for free. */
export const inputClass =
  "w-full rounded-xl border-0 bg-white px-4 text-ink-900 ring-1 ring-cream-200 placeholder:text-ink-600/70 focus:ring-2 focus:ring-ember-500 focus:outline-none aria-invalid:ring-2 aria-invalid:ring-ember-600 disabled:bg-cream-100";

/** ids for aria-describedby, pointing at the hint and/or error under a field. */
export function describedBy(id: string, { hint, error }: { hint?: unknown; error?: unknown }) {
  return [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
}

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}

/** Label + control + hint + inline error, wired for screen readers. */
export function Field({ id, label, error, hint, optional, className, children }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-bold text-ink-900">
        {label}
        {optional && <span className="text-xs font-semibold text-ink-600">Optional</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1 text-sm font-semibold text-ember-700">
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

export function FormSection({ step, title, children, className }: { step: number; title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-card bg-white p-5 shadow-card ring-1 ring-cream-200 sm:p-6", className)}>
      <h2 className="mb-5 flex items-center gap-3 text-xl font-extrabold text-ink-900">
        <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-charcoal-950 text-sm font-black text-flame-400">
          {step}
        </span>
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
