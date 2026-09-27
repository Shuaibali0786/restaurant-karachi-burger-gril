"use client";

import { useEffect, useState } from "react";
import { BellRing, Volume2 } from "lucide-react";
import { playChime, unlockChime } from "@/lib/chime";

interface NewOrderAlertProps {
  /** How many new orders have arrived since the admin last looked. */
  count: number;
}

/**
 * "Enable sound" once (autoplay rules), then a chime plays whenever a new order lands while this
 * board is open, alongside an `aria-live` announcement and a badge in the browser tab title.
 */
export function NewOrderAlert({ count }: NewOrderAlertProps) {
  const [soundOn, setSoundOn] = useState(false);
  const announcement = count > 0 ? `${count} new ${count === 1 ? "order" : "orders"}` : "";

  useEffect(() => {
    if (count > 0 && soundOn) playChime();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fires once per count change, not per soundOn toggle
  }, [count]);

  useEffect(() => {
    const original = document.title;
    document.title = count > 0 ? `(${count}) New orders · Admin` : original.replace(/^\(\d+\) /, "");
    return () => {
      document.title = original.replace(/^\(\d+\) /, "");
    };
  }, [count]);

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {!soundOn && (
        <button
          type="button"
          onClick={() => {
            unlockChime();
            setSoundOn(true);
          }}
          className="flex min-h-11 items-center gap-1.5 rounded-full bg-cream-100 px-4 text-sm font-bold text-ink-900 ring-1 ring-cream-200 transition hover:ring-ember-500"
        >
          <Volume2 aria-hidden="true" className="size-4" /> Enable sound for new orders
        </button>
      )}
      {soundOn && count > 0 && (
        <span className="flex min-h-11 items-center gap-1.5 rounded-full bg-ember-500/10 px-4 text-sm font-bold text-ember-700 ring-1 ring-ember-500/30">
          <BellRing aria-hidden="true" className="size-4" /> {count} new
        </span>
      )}
    </>
  );
}
