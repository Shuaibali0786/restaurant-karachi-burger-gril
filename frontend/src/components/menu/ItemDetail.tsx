"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { ArrowRight, Check, CircleAlert } from "lucide-react";
import type { MenuItemView } from "@/lib/types";
import { MAX_NOTE_LENGTH } from "@/lib/cart";
import { cn } from "@/lib/cn";
import { formatRs } from "@/lib/format";
import { lineTotal, unitPrice } from "@/lib/pricing";
import { useCart } from "@/stores/cart";
import { useUi } from "@/stores/ui";
import { Badge } from "@/components/ui/Badge";
import { QuantityStepper } from "@/components/ui/QuantityStepper";

interface ItemDetailProps {
  item: MenuItemView;
  variant: "modal" | "page";
  /** Modal: called after adding or when the customer removes the item (trash at quantity 1). */
  onClose?: () => void;
  /** Id for the item name heading, used by the modal's aria-labelledby. */
  titleId?: string;
}

const pill = "rounded-full px-2.5 py-0.5 text-xs font-bold";

/**
 * Customise-then-add view (Constitution III): required option, optional add-ons,
 * special instructions, quantity, live price. The only place items enter the cart.
 */
export function ItemDetail({ item, variant, onClose, titleId }: ItemDetailProps) {
  const router = useRouter();
  const addToCart = useCart((state) => state.add);
  const showToast = useUi((state) => state.showToast);

  const [optionId, setOptionId] = useState<string | null>(null);
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showOptionError, setShowOptionError] = useState(false);

  const optionsRef = useRef<HTMLFieldSetElement>(null);
  const uid = useId();
  const headingId = titleId ?? `${uid}-title`;
  const isModal = variant === "modal";

  const total = lineTotal(unitPrice(item, optionId, addonIds), quantity);
  const ready = optionId !== null;
  const TitleTag = isModal ? "h2" : "h1";

  const toggleAddon = (id: string) =>
    setAddonIds((current) => (current.includes(id) ? current.filter((a) => a !== id) : [...current, id]));

  const reset = () => {
    setOptionId(null);
    setAddonIds([]);
    setNote("");
    setQuantity(1);
    setShowOptionError(false);
  };

  const cancel = () => (isModal ? onClose?.() : router.push("/menu"));

  const handleAdd = () => {
    if (!optionId) {
      // Blocked until an option is chosen: point the customer at what's missing.
      setShowOptionError(true);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      optionsRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      optionsRef.current?.querySelector("input")?.focus({ preventScroll: true });
      return;
    }
    addToCart({ itemSlug: item.slug, optionId, addonIds, note, quantity });
    showToast(`Added ${quantity} × ${item.name} to your cart`);
    if (isModal) onClose?.();
    else reset();
  };

  return (
    <div
      className={cn(
        isModal
          ? "max-h-[92dvh] overflow-y-auto overscroll-contain md:grid md:h-[min(42rem,88vh)] md:max-h-none md:grid-cols-[1fr_1.1fr] md:overflow-hidden"
          : "grid gap-8 lg:grid-cols-2 lg:gap-12",
      )}
    >
      {/* Photo */}
      <div
        className={cn(
          "relative overflow-hidden bg-charcoal-950",
          isModal ? "aspect-[4/3] md:aspect-auto md:h-full" : "aspect-square rounded-card shadow-card lg:sticky lg:top-28 lg:self-start",
        )}
      >
        <Image
          src={item.image}
          alt={item.imageAlt}
          fill
          preload={!isModal}
          sizes={isModal ? "(min-width: 768px) 28rem, 100vw" : "(min-width: 1024px) 45vw, 100vw"}
          className="object-cover"
        />
        {item.tag && <Badge tag={item.tag} className="absolute top-4 left-4" />}
      </div>

      {/* Details */}
      <div className={cn("flex flex-col", isModal && "md:min-h-0 md:overflow-y-auto md:overscroll-contain")}>
        <div className={cn("space-y-7", isModal ? "px-5 pt-5 pb-4 sm:px-7 sm:pt-7" : "")}>
          <header className={cn(isModal && "md:pr-12")}>
            <TitleTag id={headingId} className={cn("font-display font-black text-ink-900", isModal ? "text-4xl" : "text-5xl sm:text-6xl")}>
              {item.name}
            </TitleTag>
            <p className="mt-2 leading-relaxed text-ink-600">{item.description}</p>
            <p className="mt-3 text-xl font-black text-ink-900">
              {formatRs(item.basePrice)}
              {item.options.some((o) => o.priceDelta > 0) && <span className="ml-2 text-sm font-semibold text-ink-600">base price</span>}
            </p>
          </header>

          {/* Required option */}
          <fieldset
            ref={optionsRef}
            aria-describedby={`${uid}-option-hint`}
            className={cn(
              "scroll-mt-24 rounded-2xl p-4 ring-1 transition",
              showOptionError && !ready ? "bg-ember-500/5 ring-2 ring-ember-600" : "bg-cream-100/60 ring-cream-200",
            )}
          >
            <legend className="sr-only">Choose an option (required)</legend>
            <div aria-hidden="true" className="flex items-center justify-between gap-2">
              <p className="text-lg font-extrabold text-ink-900">Choose an option</p>
              {ready ? (
                <span className={cn(pill, "inline-flex items-center gap-1 bg-charcoal-950 text-cream-50")}>
                  <Check className="size-3.5" /> Selected
                </span>
              ) : (
                <span className={cn(pill, showOptionError ? "bg-ember-700 text-cream-50" : "bg-flame-400 text-charcoal-950")}>
                  Required
                </span>
              )}
            </div>
            <p id={`${uid}-option-hint`} className={cn("mt-0.5 text-sm", showOptionError && !ready ? "font-bold text-ember-700" : "text-ink-600")}>
              {showOptionError && !ready ? (
                <span role="alert" className="inline-flex items-center gap-1">
                  <CircleAlert aria-hidden="true" className="size-4" /> Please choose an option to continue
                </span>
              ) : (
                "Select 1"
              )}
            </p>
            <div className="mt-3 space-y-2">
              {item.options.map((option) => (
                <label
                  key={option.id}
                  className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl bg-white px-4 ring-1 ring-cream-200 transition hover:ring-ember-500 has-checked:ring-2 has-checked:ring-ember-500 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-flame-400"
                >
                  <input
                    type="radio"
                    name={`${uid}-option`}
                    value={option.id}
                    checked={optionId === option.id}
                    onChange={() => setOptionId(option.id)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="flex size-5 shrink-0 items-center justify-center rounded-full ring-2 ring-cream-200 peer-checked:bg-ember-500 peer-checked:ring-ember-500 peer-checked:[&>span]:opacity-100"
                  >
                    <span className="size-2 rounded-full bg-white opacity-0" />
                  </span>
                  <span className="flex-1 font-bold text-ink-900">{option.label}</span>
                  <span className="text-sm font-semibold text-ink-600">
                    {option.priceDelta > 0 ? `+ ${formatRs(option.priceDelta)}` : "Included"}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Optional add-ons */}
          {item.addons.length > 0 && (
            <fieldset>
              <legend className="sr-only">Make it extra (optional)</legend>
              <div aria-hidden="true" className="flex items-center justify-between gap-2">
                <p className="text-lg font-extrabold text-ink-900">Make it extra</p>
                <span className={cn(pill, "bg-cream-100 text-ink-600 ring-1 ring-cream-200")}>Optional</span>
              </div>
              <div className="mt-3 space-y-2">
                {item.addons.map((addon) => (
                  <label
                    key={addon.id}
                    className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl bg-white px-4 ring-1 ring-cream-200 transition hover:ring-ember-500 has-checked:ring-2 has-checked:ring-ember-500 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-flame-400"
                  >
                    <input
                      type="checkbox"
                      checked={addonIds.includes(addon.id)}
                      onChange={() => toggleAddon(addon.id)}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className="flex size-5 shrink-0 items-center justify-center rounded-md text-white ring-2 ring-cream-200 peer-checked:bg-ember-500 peer-checked:ring-ember-500 peer-checked:[&>svg]:opacity-100"
                    >
                      <Check className="size-3.5 opacity-0" strokeWidth={3.5} />
                    </span>
                    <span className="flex-1 font-bold text-ink-900">{addon.label}</span>
                    <span className="text-sm font-semibold text-ink-600">+ {formatRs(addon.price)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {/* Special instructions */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <label htmlFor={`${uid}-note`} className="text-lg font-extrabold text-ink-900">
                Special instructions
              </label>
              <span className={cn(pill, "bg-cream-100 text-ink-600 ring-1 ring-cream-200")}>Optional</span>
            </div>
            <textarea
              id={`${uid}-note`}
              value={note}
              onChange={(event) => setNote(event.target.value.slice(0, MAX_NOTE_LENGTH))}
              maxLength={MAX_NOTE_LENGTH}
              rows={3}
              placeholder="e.g. No onions, extra spicy, sauce on the side"
              aria-describedby={`${uid}-note-count`}
              className="mt-3 w-full resize-none rounded-xl border-0 bg-white p-4 text-ink-900 ring-1 ring-cream-200 placeholder:text-ink-600/70 focus:ring-2 focus:ring-ember-500 focus:outline-none"
            />
            <p id={`${uid}-note-count`} className="mt-1 text-right text-xs font-semibold text-ink-600 tabular-nums">
              {note.length}/{MAX_NOTE_LENGTH}
            </p>
          </div>
        </div>

        {/* Sticky order bar */}
        <div
          className={cn(
            "sticky bottom-0 z-10 mt-auto border-t border-cream-200 bg-cream-50/95 backdrop-blur",
            isModal ? "px-4 py-4 sm:px-7" : "-mx-4 mt-8 px-4 py-4 sm:mx-0 sm:rounded-card sm:px-5 lg:static lg:border-0 lg:bg-transparent lg:px-0",
          )}
        >
          {!ready && (
            <p className="mb-2 text-center text-xs font-semibold text-ink-600" aria-hidden="true">
              Choose an option to continue
            </p>
          )}
          <div className="flex items-center gap-2 sm:gap-3">
            <QuantityStepper value={quantity} onChange={setQuantity} onRemove={cancel} itemName={item.name} />
            <button
              type="button"
              onClick={handleAdd}
              aria-disabled={!ready}
              aria-label={ready ? `Add to cart, ${formatRs(total)}` : `Add to cart, ${formatRs(total)}. Choose an option first`}
              className={cn(
                "flex min-h-12 min-w-0 flex-1 items-center justify-between gap-2 rounded-full px-3.5 text-sm font-extrabold whitespace-nowrap transition sm:gap-3 sm:px-5 sm:text-base",
                ready
                  ? "bg-ember-500 text-charcoal-950 shadow-[0_10px_30px_-10px_rgb(255_90_31/0.9)] hover:bg-flame-400"
                  : "cursor-not-allowed bg-cream-200 text-ink-600",
              )}
            >
              <span className="tabular-nums">{formatRs(total)}</span>
              <span aria-hidden="true" className="h-5 w-px bg-current opacity-30 max-[400px]:hidden" />
              <span className="flex items-center gap-1.5">
                Add to cart <ArrowRight aria-hidden="true" className="size-4 max-[400px]:hidden" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
