"use client";

import { useRef, type PointerEvent, type RefObject } from "react";

const DISMISS_PX = 110;

/**
 * Drag-down-to-dismiss for a bottom sheet (native-app gesture). Attach the
 * returned handlers to a grab handle. Uses the `translate` property so it
 * never fights the sheet's `transform` slide-in animation.
 */
export function useSheetDrag(sheetRef: RefObject<HTMLElement | null>, onDismiss: () => void) {
  const startY = useRef<number | null>(null);
  const offset = useRef(0);

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    startY.current = event.clientY;
    offset.current = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
    if (sheetRef.current) sheetRef.current.style.transition = "none";
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (startY.current === null || !sheetRef.current) return;
    offset.current = Math.max(0, event.clientY - startY.current);
    sheetRef.current.style.translate = `0 ${offset.current}px`;
  };

  const end = () => {
    const sheet = sheetRef.current;
    if (startY.current === null || !sheet) return;
    startY.current = null;
    if (offset.current > DISMISS_PX) {
      onDismiss();
      // Reset once closed so the next open starts from the resting position.
      window.setTimeout(() => {
        sheet.style.translate = "";
        sheet.style.transition = "";
      }, 50);
    } else {
      sheet.style.transition = "translate 200ms cubic-bezier(0.22, 1, 0.36, 1)";
      sheet.style.translate = "";
    }
  };

  return { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end };
}
