"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { CircleAlert, Loader2, PartyPopper, Send } from "lucide-react";
import type { z } from "zod";
import { subscribeNewsletter } from "@/lib/api";
import { newsletterSchema } from "@/lib/validation";

type NewsletterValues = z.input<typeof newsletterSchema>;

/** Footer "Get deals first" signup (UI only this phase — nothing is sent). */
export function NewsletterForm() {
  const uid = useId();
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterValues>({ resolver: zodResolver(newsletterSchema), defaultValues: { email: "" } });

  if (done) {
    return (
      <p role="status" className="flex items-center gap-2 font-bold text-flame-400">
        <PartyPopper aria-hidden="true" className="size-5" /> You&apos;re on the list!
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(async ({ email }) => {
        await subscribeNewsletter(email);
        setDone(true);
      })}
      noValidate
    >
      <div className="flex gap-2">
        <label htmlFor={`${uid}-email`} className="sr-only">
          Email address
        </label>
        <input
          id={`${uid}-email`}
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? `${uid}-error` : undefined}
          className="min-h-11 min-w-0 flex-1 rounded-full border border-charcoal-600 bg-charcoal-950 px-4 text-sm text-cream-50 placeholder:text-sand-300/70 focus:border-ember-500 focus:outline-none aria-invalid:border-ember-500"
          {...register("email")}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex min-h-11 items-center gap-2 rounded-full bg-ember-500 px-4 text-sm font-bold text-charcoal-950 transition hover:bg-flame-400 disabled:cursor-wait"
        >
          {isSubmitting ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Send aria-hidden="true" className="size-4" />}
          <span className="hidden sm:inline">Subscribe</span>
          <span className="sr-only sm:hidden">Subscribe</span>
        </button>
      </div>
      {errors.email && (
        <p id={`${uid}-error`} className="mt-2 flex items-center gap-1 text-sm font-semibold text-flame-400">
          <CircleAlert aria-hidden="true" className="size-4" /> {errors.email.message}
        </p>
      )}
    </form>
  );
}
