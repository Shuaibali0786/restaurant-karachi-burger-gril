"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useId } from "react";
import { CloudAlert, X } from "lucide-react";
import { useCatalog } from "@/hooks/useCatalog";
import { useModalDialog } from "@/hooks/useModalDialog";
import { useSheetDrag } from "@/hooks/useSheetDrag";
import { closeItem, ITEM_PARAM, restoreItemOpenerFocus } from "@/stores/ui";
import { EmptyState } from "@/components/ui/EmptyState";
import { ItemDetail } from "@/components/menu/ItemDetail";

/**
 * The item detail modal, driven by `?item=<slug>` in the URL: centred two-column
 * dialog on desktop, bottom sheet on phones. Native <dialog> gives focus
 * containment and Esc; the back button closes it like a real app.
 */
export function ItemModal() {
  const { items, error, retry } = useCatalog();
  const slug = useSearchParams().get(ITEM_PARAM);
  const item = slug && items ? (items.find((candidate) => candidate.slug === slug) ?? null) : null;
  const showError = slug !== null && error;
  const titleId = useId();

  const onDialogClosed = useCallback(() => {
    closeItem();
    restoreItemOpenerFocus();
  }, []);

  const { ref, close, onBackdropClick } = useModalDialog(item !== null || showError, onDialogClosed);
  const sheetDrag = useSheetDrag(ref, close);

  // overflow-clip (not hidden): focusing a field must never scroll the dialog box
  // itself — only the inner content scrolls, keeping the order bar pinned.
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClick={onBackdropClick}
      className="fixed inset-x-0 top-auto bottom-0 m-0 w-full max-w-none overflow-clip rounded-t-[1.75rem] bg-cream-50 p-0 shadow-2xl backdrop:bg-charcoal-950/70 backdrop:backdrop-blur-sm open:animate-sheet-up md:inset-0 md:m-auto md:h-fit md:w-[min(60rem,calc(100vw-3rem))] md:rounded-card md:open:animate-reveal-up"
    >
      {(item || showError) && (
        <div className="relative">
          {/* Grab strip: drag the sheet down to close it on phones (the ✕ button is the accessible way). */}
          <div aria-hidden="true" className="absolute inset-x-16 top-0 z-20 flex h-10 cursor-grab touch-none justify-center pt-2.5 md:hidden" {...sheetDrag}>
            <span className="h-1.5 w-12 rounded-full bg-white/80 shadow" />
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute top-3 right-3 z-20 flex size-11 items-center justify-center rounded-full bg-white/95 text-ink-900 shadow-card transition hover:bg-white hover:text-ember-700"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
          {item ? (
            <ItemDetail key={item.slug} item={item} variant="modal" titleId={titleId} onClose={close} />
          ) : (
            <div className="px-5 py-10">
              <EmptyState
                icon={<CloudAlert aria-hidden="true" className="size-9" />}
                title="We're having trouble loading the menu"
                text="Please check your connection and try again."
                action={
                  <button
                    type="button"
                    onClick={retry}
                    className="min-h-11 rounded-full bg-charcoal-950 px-6 font-bold text-cream-50 transition hover:bg-charcoal-800"
                  >
                    Retry
                  </button>
                }
              />
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}
