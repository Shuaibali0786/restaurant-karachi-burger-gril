"use client";

import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";
import { useUi } from "@/stores/ui";

const VISIBLE_MS = 3000;

/** Small confirmation toast (e.g. "Added to cart"), announced politely to screen readers. */
export function Toaster() {
  const toast = useUi((state) => state.toast);
  const dismiss = useUi((state) => state.dismissToast);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(dismiss, VISIBLE_MS);
    return () => window.clearTimeout(id);
  }, [toast, dismiss]);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4">
      {toast && (
        <div
          key={toast.id}
          className="pointer-events-auto flex animate-reveal-up items-center gap-3 rounded-full bg-charcoal-950 py-2.5 pr-2 pl-4 text-sm font-bold text-cream-50 shadow-[0_18px_40px_-12px_rgb(0_0_0/0.6)] ring-1 ring-charcoal-700"
        >
          <CheckCircle2 aria-hidden="true" className="size-5 shrink-0 text-flame-400" />
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="flex size-9 items-center justify-center rounded-full text-sand-300 hover:bg-charcoal-800 hover:text-cream-50"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
