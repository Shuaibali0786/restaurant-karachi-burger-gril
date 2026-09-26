"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Banknote, CalendarClock, ChevronDown, CircleAlert, CreditCard, Smartphone, Zap } from "lucide-react";
import type { CartLine, DeliveryAreaOption, Order } from "@/lib/types";
import { ApiError } from "@/lib/api-error";
import { placeOrder } from "@/lib/api";
import { formatPktTime, isOpenNow, scheduleSlots } from "@/lib/time";
import { checkoutSchema, pkMobile, type CheckoutFormInput, type CheckoutFormValues } from "@/lib/validation";
import { useNow } from "@/hooks/useNow";
import { ChoiceCard } from "@/components/forms/ChoiceCard";
import { describedBy, Field, FormSection, inputClass } from "@/components/forms/Field";

export const CHECKOUT_FORM_ID = "checkout-form";

const comingSoon = (
  <span className="rounded-full bg-cream-100 px-2.5 py-0.5 text-xs font-bold text-ink-600 ring-1 ring-cream-200">Coming soon</span>
);

// Payment providers are shown as plain text names only (no logos) — owner-requested options.
const laterPayments = [
  { id: "card", title: "Credit / Debit card", Icon: CreditCard },
  { id: "jazzcash", title: "JazzCash", Icon: Smartphone },
  { id: "easypaisa", title: "Easypaisa", Icon: Smartphone },
];

/** Shows a valid mobile number the familiar way: 0300-1234567. */
function tidyPhone(value: string): string {
  const parsed = pkMobile.safeParse(value);
  return parsed.success ? `0${parsed.data.slice(3, 6)}-${parsed.data.slice(6)}` : value;
}

interface CheckoutFormProps {
  areas: DeliveryAreaOption[];
  lines: CartLine[];
  onPlaced: (order: Order) => void;
  onSubmittingChange: (submitting: boolean) => void;
}

export function CheckoutForm({ areas, lines, onPlaced, onSubmittingChange }: CheckoutFormProps) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const now = useNow(60_000);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitted },
  } = useForm<CheckoutFormInput, unknown, CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      landmark: "",
      notes: "",
      deliveryTime: "asap",
      scheduledFor: "",
      payment: "cod",
    },
  });

  const deliveryTime = useWatch({ control, name: "deliveryTime" });
  const openNow = now ? isOpenNow(now) : true;
  const slots = now ? scheduleSlots(now) : [];
  const errorCount = Object.keys(errors).length;

  // Closed right now: ASAP isn't possible, so steer to a scheduled slot.
  useEffect(() => {
    if (!openNow && deliveryTime === "asap") setValue("deliveryTime", "scheduled");
  }, [openNow, deliveryTime, setValue]);

  const onSubmit = async (values: CheckoutFormValues) => {
    setFormError(null);
    onSubmittingChange(true);
    try {
      const order = await placeOrder({
        customer: { name: values.name, phone: values.phone },
        delivery: { area: values.area, address: values.address, landmark: values.landmark, notes: values.notes },
        timing: values.scheduledFor ? { type: "scheduled", slot: values.scheduledFor } : { type: "asap" },
        payment: "cod",
        lines,
      });
      onPlaced(order);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Something went wrong placing your order. Please try again.");
      onSubmittingChange(false);
    }
  };

  // Register in on-screen order: RHF focuses the first invalid field in registration order.
  const nameField = register("name");
  const phoneField = register("phone");

  return (
    <form id={CHECKOUT_FORM_ID} onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {(formError || (isSubmitted && errorCount > 0)) && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-ember-500/10 p-4 font-semibold text-ember-700 ring-1 ring-ember-500/30">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          {formError ?? `Please fix ${errorCount === 1 ? "the highlighted field" : `the ${errorCount} highlighted fields`} to place your order.`}
        </p>
      )}

      <FormSection step={1} title="Your details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={id("name")} label="Full name" error={errors.name?.message}>
            <input
              id={id("name")}
              autoComplete="name"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={describedBy(id("name"), { error: errors.name })}
              className={`${inputClass} min-h-12`}
              {...nameField}
            />
          </Field>
          <Field id={id("phone")} label="Mobile number" hint="We'll call if the rider can't find you" error={errors.phone?.message}>
            <input
              id={id("phone")}
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="03XX-XXXXXXX"
              aria-invalid={errors.phone ? true : undefined}
              aria-describedby={describedBy(id("phone"), { hint: true, error: errors.phone })}
              className={`${inputClass} min-h-12`}
              {...phoneField}
              onBlur={(event) => {
                setValue("phone", tidyPhone(event.target.value));
                void phoneField.onBlur(event);
              }}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection step={2} title="Delivery address">
        <Field id={id("area")} label="Delivery area" error={errors.area?.message}>
          <div className="relative">
            <select
              id={id("area")}
              defaultValue=""
              aria-invalid={errors.area ? true : undefined}
              aria-describedby={describedBy(id("area"), { error: errors.area })}
              className={`${inputClass} min-h-12 appearance-none pr-10`}
              {...register("area")}
            >
              <option value="" disabled>
                Select your area
              </option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink-600" />
          </div>
        </Field>
        <Field id={id("address")} label="Full address" hint="House/flat number, street, block" error={errors.address?.message}>
          <textarea
            id={id("address")}
            rows={2}
            autoComplete="street-address"
            placeholder="e.g. House 12, Street 4, Block 5"
            aria-invalid={errors.address ? true : undefined}
            aria-describedby={describedBy(id("address"), { hint: true, error: errors.address })}
            className={`${inputClass} resize-none py-3`}
            {...register("address")}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={id("landmark")} label="Nearest landmark" optional error={errors.landmark?.message}>
            <input
              id={id("landmark")}
              placeholder="e.g. Near Dolmen Mall"
              aria-invalid={errors.landmark ? true : undefined}
              aria-describedby={describedBy(id("landmark"), { error: errors.landmark })}
              className={`${inputClass} min-h-12`}
              {...register("landmark")}
            />
          </Field>
          <Field id={id("notes")} label="Delivery notes" optional error={errors.notes?.message}>
            <input
              id={id("notes")}
              placeholder="e.g. Call on arrival, 2nd floor"
              aria-invalid={errors.notes ? true : undefined}
              aria-describedby={describedBy(id("notes"), { error: errors.notes })}
              className={`${inputClass} min-h-12`}
              {...register("notes")}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection step={3} title="Delivery time">
        <fieldset className="space-y-3">
          <legend className="sr-only">When should we deliver?</legend>
          <ChoiceCard
            value="asap"
            disabled={!openNow}
            icon={<Zap aria-hidden="true" className="size-5" />}
            title="As soon as possible"
            description={openNow ? "Usually 25–30 minutes" : "We're closed right now — we open at 12 noon"}
            {...register("deliveryTime")}
          />
          <ChoiceCard
            value="scheduled"
            disabled={slots.length === 0}
            icon={<CalendarClock aria-hidden="true" className="size-5" />}
            title="Schedule for later today"
            description={slots.length ? "Pick a time that suits you" : "No more slots today — we close at 3 AM"}
            {...register("deliveryTime")}
          />
        </fieldset>
        {deliveryTime === "scheduled" && slots.length > 0 && (
          <Field id={id("scheduledFor")} label="Delivery time" error={errors.scheduledFor?.message}>
            <div className="relative">
              <select
                id={id("scheduledFor")}
                aria-invalid={errors.scheduledFor ? true : undefined}
                aria-describedby={describedBy(id("scheduledFor"), { error: errors.scheduledFor })}
                className={`${inputClass} min-h-12 appearance-none pr-10`}
                {...register("scheduledFor")}
              >
                <option value="">Select a time</option>
                {slots.map((slot) => (
                  <option key={slot.toISOString()} value={slot.toISOString()}>
                    {formatPktTime(slot)}
                  </option>
                ))}
              </select>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink-600" />
            </div>
          </Field>
        )}
      </FormSection>

      <FormSection step={4} title="Payment">
        <fieldset className="space-y-3">
          <legend className="sr-only">Payment method</legend>
          <ChoiceCard
            value="cod"
            icon={<Banknote aria-hidden="true" className="size-5" />}
            title="Cash on Delivery"
            description="Pay the rider in cash when your food arrives"
            {...register("payment")}
          />
          {laterPayments.map(({ id: method, title, Icon }) => (
            <ChoiceCard
              key={method}
              name="payment-coming-soon"
              value={method}
              disabled
              icon={<Icon aria-hidden="true" className="size-5" />}
              title={title}
              aside={comingSoon}
            />
          ))}
        </fieldset>
      </FormSection>
    </form>
  );
}
