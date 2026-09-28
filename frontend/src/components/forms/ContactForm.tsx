"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { CheckCircle2, CircleAlert, Loader2, Send } from "lucide-react";
import type { z } from "zod";
import { sendContactMessage } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import { contactSchema } from "@/lib/validation";
import { buttonClasses } from "@/components/ui/Button";
import { describedBy, Field, inputClass } from "@/components/forms/Field";

type ContactValues = z.input<typeof contactSchema>;

export function ContactForm() {
  const uid = useId();
  const id = (name: keyof ContactValues) => `${uid}-${name}`;
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    mode: "onTouched",
    defaultValues: { name: "", phone: "", email: "", message: "" },
  });

  const onSubmit = async (values: ContactValues) => {
    setFormError(null);
    try {
      await sendContactMessage(values);
      reset();
      setSent(true);
    } catch (error) {
      setFormError(
        error instanceof ApiError && (error.code === "RATE_LIMITED" || error.code === "VALIDATION_FAILED")
          ? error.message
          : "We couldn't send your message. Please try again, or call us.",
      );
    }
  };

  if (sent) {
    return (
      <div role="status" className="rounded-card bg-white p-8 text-center shadow-card ring-1 ring-cream-200">
        <CheckCircle2 aria-hidden="true" className="mx-auto size-14 text-ember-700" />
        <h2 className="font-display mt-3 text-3xl font-black text-ink-900">Thanks! We&apos;ll get back to you soon.</h2>
        <p className="mt-2 text-ink-600">Our team usually replies within a day. For an order that&apos;s on its way, please call us.</p>
        <button type="button" onClick={() => setSent(false)} className="mt-5 min-h-11 font-bold text-ember-700 underline-offset-4 hover:underline">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 rounded-card bg-white p-5 shadow-card ring-1 ring-cream-200 sm:p-7">
      <h2 className="font-display text-3xl font-black text-ink-900">Send us a message</h2>
      <p className="-mt-2 text-sm text-ink-600">Feedback, catering or an event? Leave a phone number or email and we&apos;ll reply.</p>
      {formError && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-ember-500/10 p-4 font-semibold text-ember-700 ring-1 ring-ember-500/30">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          {formError}
        </p>
      )}

      <Field id={id("name")} label="Your name" error={errors.name?.message}>
        <input
          id={id("name")}
          autoComplete="name"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={describedBy(id("name"), { error: errors.name })}
          className={`${inputClass} min-h-12`}
          {...register("name")}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={id("phone")} label="Mobile number" hint="Phone or email — at least one" error={errors.phone?.message}>
          <input
            id={id("phone")}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="03XX-XXXXXXX"
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={describedBy(id("phone"), { hint: true, error: errors.phone })}
            className={`${inputClass} min-h-12`}
            {...register("phone")}
          />
        </Field>
        <Field id={id("email")} label="Email" optional error={errors.email?.message}>
          <input
            id={id("email")}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy(id("email"), { error: errors.email })}
            className={`${inputClass} min-h-12`}
            {...register("email")}
          />
        </Field>
      </div>
      <Field id={id("message")} label="Message" error={errors.message?.message}>
        <textarea
          id={id("message")}
          rows={5}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={describedBy(id("message"), { error: errors.message })}
          className={`${inputClass} resize-y py-3`}
          {...register("message")}
        />
      </Field>
      <button type="submit" disabled={isSubmitting} className={buttonClasses("primary", "lg", "w-full sm:w-auto disabled:cursor-wait")}>
        {isSubmitting ? <Loader2 aria-hidden="true" className="size-5 animate-spin" /> : <Send aria-hidden="true" className="size-5" />}
        Send message
      </button>
    </form>
  );
}
