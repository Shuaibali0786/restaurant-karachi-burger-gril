"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Banknote, CalendarClock, ChevronDown, CircleAlert, CreditCard, Smartphone, Zap } from "lucide-react";
import type { CartLine, DeliveryAreaOption, MenuItemView, Order } from "@/lib/types";
import { ApiError } from "@/lib/api-error";
import { getMyOrders, placeOrder } from "@/lib/api";
import { formatPktTime, isOpenNow, scheduleSlots } from "@/lib/time";
import { checkoutSchema, pkMobile, type CheckoutFormInput, type CheckoutFormValues } from "@/lib/validation";
import { useNow } from "@/hooks/useNow";
import { useSession } from "@/stores/session";
import { ChoiceCard } from "@/components/forms/ChoiceCard";
import { describedBy, Field, FormSection, inputClass } from "@/components/forms/Field";

/** Server field paths (contracts/openapi.yaml) mapped to this form's own field names. */
const SERVER_FIELD_MAP: Partial<Record<string, keyof CheckoutFormValues>> = {
  "customer.name": "name",
  "customer.phone": "phone",
  "delivery.area": "area",
  "delivery.address": "address",
  "delivery.landmark": "landmark",
  "delivery.notes": "notes",
  "timing.slot": "scheduledFor",
};

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
  items: MenuItemView[];
  lines: CartLine[];
  onPlaced: (order: Order) => void;
  onSubmittingChange: (submitting: boolean) => void;
  /** Reports the chosen area's id as soon as the customer picks one, so the summary can price its fee. */
  onAreaChange: (areaId: string | null) => void;
}

export function CheckoutForm({ areas, items, lines, onPlaced, onSubmittingChange, onAreaChange }: CheckoutFormProps) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const now = useNow(60_000);
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  // One id per checkout attempt (this form mount), reused on every retry so a double submission —
  // a double tap, or a resubmit after a network error — can never create two orders (research R4).
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    setError,
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

  // Signed in: start from the saved name and phone, and from the last order's address. Fields the
  // customer has already typed in are never overwritten, and everything stays editable. Guests
  // (no session) see the empty form exactly as before.
  const user = useSession((state) => state.user);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    if (!getValues("name")) setValue("name", user.name);
    if (!getValues("phone") && user.phone) setValue("phone", user.phone);
    getMyOrders()
      .then((orders) => {
        const last = orders[0];
        if (!last || cancelled) return;
        if (!getValues("phone")) setValue("phone", last.customer.phone);
        if (!getValues("address") && last.delivery.address) setValue("address", last.delivery.address);
        if (!getValues("landmark") && last.delivery.landmark) setValue("landmark", last.delivery.landmark);
        if (!getValues("area") && areas.some((area) => area.id === last.delivery.area)) setValue("area", last.delivery.area);
      })
      .catch(() => undefined); // pre-filling is a convenience; never block checkout on it
    return () => {
      cancelled = true;
    };
  }, [user, areas, getValues, setValue]);

  const deliveryTime = useWatch({ control, name: "deliveryTime" });
  const areaId = useWatch({ control, name: "area" });
  const openNow = now ? isOpenNow(now) : true;
  const slots = now ? scheduleSlots(now) : [];
  const errorCount = Object.keys(errors).length;

  // Closed right now: ASAP isn't possible, so steer to a scheduled slot.
  useEffect(() => {
    if (!openNow && deliveryTime === "asap") setValue("deliveryTime", "scheduled");
  }, [openNow, deliveryTime, setValue]);

  // The order summary prices the chosen area's delivery fee (spec FR-007) as soon as it's picked.
  useEffect(() => {
    onAreaChange(areaId || null);
  }, [areaId, onAreaChange]);

  const nameOf = (slug: string) => items.find((item) => item.slug === slug)?.name ?? slug;

  const onSubmit = async (values: CheckoutFormValues) => {
    setFormError(null);
    onSubmittingChange(true);
    try {
      const order = await placeOrder(
        {
          customer: { name: values.name, phone: values.phone },
          delivery: { area: values.area, address: values.address, landmark: values.landmark, notes: values.notes },
          timing: values.scheduledFor ? { type: "scheduled", slot: values.scheduledFor } : { type: "asap" },
          payment: "cod",
          // Drop the cart's own `key` field: the server's schema forbids fields it doesn't expect.
          lines: lines.map(({ itemSlug, optionId, addonIds, note, quantity, addedAt }) => ({
            itemSlug,
            optionId,
            addonIds,
            note,
            quantity,
            addedAt,
          })),
        },
        { idempotencyKey },
      );
      onPlaced(order);
      return;
    } catch (error) {
      onSubmittingChange(false);
      if (!(error instanceof ApiError)) {
        setFormError("Something went wrong placing your order. Please try again.");
        return;
      }

      switch (error.code) {
        case "ITEM_SOLD_OUT":
        case "UNKNOWN_ITEM": {
          const names = (error.details?.items as string[] | undefined)?.map(nameOf) ?? [];
          const list = names.join(", ");
          setFormError(
            list
              ? `${list} ${names.length > 1 ? "are" : "is"} no longer available. Please remove ${names.length > 1 ? "them" : "it"} from your cart and try again.`
              : error.message,
          );
          break;
        }
        case "RESTAURANT_CLOSED": {
          const opensAt = error.details?.opensAt as string | undefined;
          setValue("deliveryTime", "scheduled");
          setFormError(
            `We're closed right now — we open at ${opensAt ? formatPktTime(new Date(opensAt)) : "12 noon"} Pakistan time. Please schedule your order for later instead.`,
          );
          break;
        }
        case "AREA_UNAVAILABLE":
          setFormError("That delivery area is no longer available. Please choose another from the list.");
          router.refresh(); // re-fetches the delivery area list from the server
          break;
        case "INVALID_SLOT":
          setFormError("That delivery time is no longer available. Please pick another time below.");
          break;
        case "VALIDATION_FAILED": {
          let mapped = false;
          for (const [path, message] of Object.entries(error.fields ?? {})) {
            const fieldName = SERVER_FIELD_MAP[path];
            if (fieldName) {
              setError(fieldName, { type: "server", message });
              mapped = true;
            }
          }
          setFormError(mapped ? "Please fix the highlighted details." : error.message);
          break;
        }
        default:
          // RATE_LIMITED, NETWORK, IDEMPOTENCY_CONFLICT, INTERNAL, ...: the backend's own wording is
          // already customer-friendly (e.g. "Too many attempts. Please wait a few minutes and try again.").
          setFormError(error.message);
      }
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
