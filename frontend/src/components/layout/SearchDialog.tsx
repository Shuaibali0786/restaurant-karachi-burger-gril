"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import { useModalDialog } from "@/hooks/useModalDialog";

const suggestions = ["Zinger", "Wings", "Tikka", "Shawarma", "Loaded fries"];

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const { ref, close, onBackdropClick } = useModalDialog(open, onClose);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  // Runs after the dialog's showModal(), so typing can start immediately.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const search = (value: string) => {
    const query = value.trim();
    close();
    router.push(query ? `/menu?q=${encodeURIComponent(query)}` : "/menu");
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    search(term);
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClick={onBackdropClick}
      className="m-0 mx-auto mt-[12vh] w-[min(40rem,calc(100vw-2rem))] max-w-none rounded-card bg-transparent p-0 backdrop:bg-charcoal-950/70 backdrop:backdrop-blur-sm open:animate-reveal-up"
    >
      <div className="rounded-card bg-cream-50 p-5 shadow-card sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 id={titleId} className="font-display text-2xl font-extrabold text-ink-900">
            Search the menu
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close search"
            className="flex size-11 items-center justify-center rounded-full text-ink-600 hover:bg-cream-100 hover:text-ink-900"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <form role="search" onSubmit={onSubmit} className="flex gap-2">
          <label htmlFor={`${titleId}-input`} className="sr-only">
            Search food
          </label>
          <div className="relative flex-1">
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-600" />
            <input
              ref={inputRef}
              id={`${titleId}-input`}
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Burgers, wings, tikka…"
              autoComplete="off"
              maxLength={60}
              className="min-h-12 w-full rounded-full border-2 border-cream-200 bg-white pr-4 pl-12 text-ink-900 placeholder:text-ink-600 focus:border-ember-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            aria-label="Search"
            className="flex min-h-12 min-w-12 items-center justify-center rounded-full bg-ember-500 text-charcoal-950 transition hover:bg-flame-400"
          >
            <ArrowRight aria-hidden="true" className="size-5" />
          </button>
        </form>

        <p className="mt-5 mb-2 text-sm font-semibold text-ink-600">Popular right now</p>
        <ul className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onClick={() => search(suggestion)}
                className="min-h-11 rounded-full bg-cream-100 px-4 text-sm font-semibold text-ink-900 transition hover:bg-flame-400"
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  );
}
