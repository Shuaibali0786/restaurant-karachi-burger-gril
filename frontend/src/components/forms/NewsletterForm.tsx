"use client";

import { useId, useState, type FormEvent } from "react";
import { CircleAlert, Loader2, PartyPopper, Send } from "lucide-react";

// Deliberately tiny: this form is on every page, so it avoids the form/validation
// libraries and loads the API only when someone actually subscribes.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Footer "Get deals first" signup (UI only this phase — nothing is sent). */
export function NewsletterForm() {
  const uid = useId();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = email.trim();
    if (!EMAIL.test(value)) {
      setError("Enter a valid email address");
      return;
    }
    setError(null);
    setStatus("sending");
    const { subscribeNewsletter } = await import("@/lib/api");
    await subscribeNewsletter(value);
    setStatus("done");
  };

  if (status === "done") {
    return (
      <p role="status" className="flex items-center gap-2 font-bold text-flame-400">
        <PartyPopper aria-hidden="true" className="size-5" /> You&apos;re on the list!
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="flex gap-2">
        <label htmlFor={`${uid}-email`} className="sr-only">
          Email address
        </label>
        <input
          id={`${uid}-email`}
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError(null);
          }}
          placeholder="you@example.com"
          autoComplete="email"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${uid}-error` : undefined}
          className="min-h-11 min-w-0 flex-1 rounded-full border border-charcoal-600 bg-charcoal-950 px-4 text-sm text-cream-50 placeholder:text-sand-300/70 focus:border-ember-500 focus:outline-none aria-invalid:border-ember-500"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="flex min-h-11 items-center gap-2 rounded-full bg-ember-500 px-4 text-sm font-bold text-charcoal-950 transition hover:bg-flame-400 disabled:cursor-wait"
        >
          {status === "sending" ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Send aria-hidden="true" className="size-4" />}
          <span className="hidden sm:inline">Subscribe</span>
          <span className="sr-only sm:hidden">Subscribe</span>
        </button>
      </div>
      {error && (
        <p id={`${uid}-error`} className="mt-2 flex items-center gap-1 text-sm font-semibold text-flame-400">
          <CircleAlert aria-hidden="true" className="size-4" /> {error}
        </p>
      )}
    </form>
  );
}
