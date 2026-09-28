"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import { reorder } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import { useCart } from "@/stores/cart";
import { useUi } from "@/stores/ui";
import { buttonClasses } from "@/components/ui/Button";

/** Adds a past order's still-orderable lines to the cart (priced fresh by the server at checkout)
 * and says which items had to be left out. */
export function OrderAgainButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const add = useCart((state) => state.add);
  const showToast = useUi((state) => state.showToast);
  const openCart = useUi((state) => state.openCart);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const onClick = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const { lines, skipped } = await reorder(orderId);
      lines.forEach((line) => add(line));
      if (lines.length === 0) {
        setNotice(`Sorry, none of these items are available right now (${skipped.join(", ")}).`);
        return;
      }
      showToast(
        skipped.length > 0
          ? `Added to your cart. Not available right now: ${skipped.join(", ")}`
          : "Added your order to the cart",
      );
      openCart();
      router.refresh();
    } catch (error) {
      setNotice(error instanceof ApiError ? error.message : "Couldn't reorder. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button type="button" onClick={() => void onClick()} disabled={busy} className={buttonClasses("secondary", "md", "text-ink-900")}>
        {busy ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <RotateCcw aria-hidden="true" className="size-4" />}
        Order again
      </button>
      {notice && (
        <p role="alert" className="mt-2 text-sm font-semibold text-ember-700">
          {notice}
        </p>
      )}
    </div>
  );
}
