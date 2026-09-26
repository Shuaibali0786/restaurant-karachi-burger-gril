"use client";

import { useCallback, useEffect, useRef, type MouseEvent } from "react";

/**
 * Drives a native <dialog> as a modal: `showModal()` gives focus containment,
 * Esc to close and an inert background; this hook adds body scroll lock,
 * backdrop-click closing and keeps React state in sync via `onClose`.
 */
export function useModalDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    const handleClose = () => {
      document.documentElement.style.overflow = "";
      onCloseRef.current();
    };
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, []);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Never leave the page scroll-locked if the dialog unmounts while open.
  useEffect(() => () => void (document.documentElement.style.overflow = ""), []);

  /**
   * Closes the dialog and releases the scroll lock synchronously — the native
   * "close" event fires a task later, too late for a link navigation to scroll
   * the next page to the top.
   */
  const close = useCallback(() => {
    document.documentElement.style.overflow = "";
    ref.current?.close();
  }, []);

  const onBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) close();
  };

  return { ref, close, onBackdropClick };
}
