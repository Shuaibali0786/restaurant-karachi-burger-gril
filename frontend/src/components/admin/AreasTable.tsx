"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { AdminArea } from "@/lib/types";
import { getAdminAreas, updateArea } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import { cn } from "@/lib/cn";

function FeeInput({ area, onSaved }: { area: AdminArea; onSaved: (area: AdminArea) => void }) {
  const [value, setValue] = useState(String(area.fee));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Adjust the field during render (not an effect) when a save from elsewhere changes the fee.
  const [lastFee, setLastFee] = useState(area.fee);
  if (area.fee !== lastFee) {
    setLastFee(area.fee);
    setValue(String(area.fee));
  }

  const commit = async () => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed === area.fee) {
      setValue(String(area.fee));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onSaved(await updateArea(area.id, { fee: Math.round(parsed) }));
    } catch (err) {
      setValue(String(area.fee));
      setError(err instanceof ApiError ? err.message : "Couldn't save the fee.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <span className="text-ink-600">Rs</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        disabled={busy}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        aria-label={`Delivery fee for ${area.name}`}
        className="min-h-11 w-24 rounded-xl border-0 bg-cream-50 px-3 text-right text-sm font-bold text-ink-900 ring-1 ring-cream-200 focus:ring-2 focus:ring-ember-500 focus:outline-none"
      />
      {busy && <Loader2 aria-hidden="true" className="size-4 animate-spin text-ember-700" />}
      {error && <span className="text-xs font-semibold text-ember-700">{error}</span>}
    </div>
  );
}

/** Delivery-area editing: fee per area and an on/off switch that stops the area appearing at checkout. */
export function AreasTable() {
  const [areas, setAreas] = useState<AdminArea[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    void getAdminAreas().then((list) => setAreas([...list].sort((a, b) => a.order - b.order)));
  }, []);

  if (!areas) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Loader2 aria-hidden="true" className="size-6 animate-spin text-ember-700" />
      </div>
    );
  }

  const toggle = async (id: string, enabled: boolean) => {
    setBusyId(id);
    try {
      const updated = await updateArea(id, { enabled });
      setAreas((prev) => prev!.map((area) => (area.id === id ? updated : area)));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ul className="space-y-2">
      {areas.map((area) => (
        <li
          key={area.id}
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 rounded-card bg-white p-3 shadow-card ring-1 ring-cream-200",
            !area.enabled && "opacity-60",
          )}
        >
          <span className="min-w-32 font-bold text-ink-900">{area.name}</span>
          <div className="flex flex-wrap items-center gap-2">
            <FeeInput area={area} onSaved={(updated) => setAreas((prev) => prev!.map((a) => (a.id === updated.id ? updated : a)))} />
            <button
              type="button"
              onClick={() => void toggle(area.id, !area.enabled)}
              aria-pressed={area.enabled}
              className={cn(
                "min-h-9 rounded-full px-3 text-xs font-bold whitespace-nowrap ring-1 transition",
                area.enabled ? "bg-ember-500 text-charcoal-950 ring-ember-500" : "bg-cream-100 text-ink-600 ring-cream-200",
              )}
            >
              {area.enabled ? "On" : "Off"}
            </button>
            {busyId === area.id && <Loader2 aria-hidden="true" className="size-4 animate-spin text-ember-700" />}
          </div>
        </li>
      ))}
    </ul>
  );
}
