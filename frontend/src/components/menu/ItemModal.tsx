"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useId } from "react";
import { X } from "lucide-react";
import type { MenuItemView } from "@/lib/types";
import { useModalDialog } from "@/hooks/useModalDialog";
import { closeItem, ITEM_PARAM, restoreItemOpenerFocus } from "@/stores/ui";
import { ItemDetail } from "@/components/menu/ItemDetail";

/**
 * The item detail modal, driven by `?item=<slug>` in the URL: centred two-column
 * dialog on desktop, bottom sheet on phones. Native <dialog> gives focus
 * containment and Esc; the back button closes it like a real app.
 */
export function ItemModal({ items }: { items: MenuItemView[] }) {
  const slug = useSearchParams().get(ITEM_PARAM);
  const item = slug ? (items.find((candidate) => candidate.slug === slug) ?? null) : null;
  const titleId = useId();

  const onDialogClosed = useCallback(() => {
    closeItem();
    restoreItemOpenerFocus();
  }, []);

  const { ref, onBackdropClick } = useModalDialog(item !== null, onDialogClosed);
  const close = () => ref.current?.close();

  // overflow-clip (not hidden): focusing a field must never scroll the dialog box
  // itself — only the inner content scrolls, keeping the order bar pinned.
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClick={onBackdropClick}
      className="fixed inset-x-0 top-auto bottom-0 m-0 w-full max-w-none overflow-clip rounded-t-[1.75rem] bg-cream-50 p-0 shadow-2xl backdrop:bg-charcoal-950/70 backdrop:backdrop-blur-sm open:animate-sheet-up md:inset-0 md:m-auto md:h-fit md:w-[min(60rem,calc(100vw-3rem))] md:rounded-card md:open:animate-reveal-up"
    >
      {item && (
        <div className="relative">
          {/* Drag handle (visual cue that this is a bottom sheet on phones) */}
          <span aria-hidden="true" className="absolute top-2.5 left-1/2 z-20 h-1.5 w-12 -translate-x-1/2 rounded-full bg-white/80 md:hidden" />
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute top-3 right-3 z-20 flex size-11 items-center justify-center rounded-full bg-white/95 text-ink-900 shadow-card transition hover:bg-white hover:text-ember-700"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
          <ItemDetail key={item.slug} item={item} variant="modal" titleId={titleId} onClose={close} />
        </div>
      )}
    </dialog>
  );
}
