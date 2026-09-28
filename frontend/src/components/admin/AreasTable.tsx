"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { AdminArea } from "@/lib/types";
import { createArea, deleteArea, getAdminAreas, updateArea } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import { cn } from "@/lib/cn";

function FeeInput({
  area,
  onSaved,
}: {
  area: AdminArea;
  onSaved: (area: AdminArea) => void;
}) {
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
      setError(
        err instanceof ApiError ? err.message : "Couldn't save the fee.",
      );
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
      {busy && (
        <Loader2
          aria-hidden="true"
          className="size-4 animate-spin text-ember-700"
        />
      )}
      {error && (
        <span className="text-xs font-semibold text-ember-700">{error}</span>
      )}
    </div>
  );
}

const fieldClass =
  "min-h-11 rounded-xl border-0 bg-cream-50 px-3 text-sm font-bold text-ink-900 ring-1 ring-cream-200 focus:ring-2 focus:ring-ember-500 focus:outline-none";

/** Delivery areas: add a new one (name + fee), edit each fee, switch an area on/off at checkout, and
 * remove one that has never had an order (otherwise the server says to switch it off instead). */
export function AreasTable() {
  const [areas, setAreas] = useState<AdminArea[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newFee, setNewFee] = useState("150");
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void getAdminAreas().then((list) =>
      setAreas([...list].sort((a, b) => a.order - b.order)),
    );
  }, []);

  if (!areas) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Loader2
          aria-hidden="true"
          className="size-6 animate-spin text-ember-700"
        />
      </div>
    );
  }

  const toggle = async (id: string, enabled: boolean) => {
    setBusyId(id);
    try {
      const updated = await updateArea(id, { enabled });
      setAreas((prev) =>
        prev!.map((area) => (area.id === id ? updated : area)),
      );
    } finally {
      setBusyId(null);
    }
  };

  const add = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fee = Number(newFee);
    if (
      newName.trim().length < 2 ||
      !Number.isInteger(fee) ||
      fee < 0 ||
      fee > 2000
    ) {
      setMessage(
        "Enter an area name and a whole-rupee fee between 0 and 2000.",
      );
      return;
    }
    setAdding(true);
    setMessage(null);
    try {
      const created = await createArea({ name: newName.trim(), fee });
      setAreas((prev) => [...prev!, created]);
      setNewName("");
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? error.message
          : "Could not add the area. Please try again.",
      );
    } finally {
      setAdding(false);
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    setMessage(null);
    try {
      await deleteArea(id);
      setAreas((prev) => prev!.filter((area) => area.id !== id));
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? error.message
          : "Could not remove the area. Please try again.",
      );
    } finally {
      setBusyId(null);
      setConfirmingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={(event) => void add(event)}
        className="flex flex-wrap items-end gap-2 rounded-card bg-white p-3 shadow-card ring-1 ring-cream-200"
      >
        <label className="flex min-w-40 flex-1 flex-col gap-1 text-sm font-bold text-ink-900">
          New area name
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            maxLength={40}
            className={fieldClass}
            placeholder="e.g. Malir"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold text-ink-900">
          Fee (Rs)
          <input
            value={newFee}
            onChange={(event) => setNewFee(event.target.value)}
            type="number"
            inputMode="numeric"
            min={0}
            max={2000}
            className={cn(fieldClass, "w-28 text-right")}
          />
        </label>
        <button
          type="submit"
          disabled={adding}
          className="flex min-h-11 items-center gap-1.5 rounded-full bg-ember-500 px-4 text-sm font-bold text-charcoal-950 transition hover:bg-flame-400 disabled:cursor-wait"
        >
          {adding ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Plus aria-hidden="true" className="size-4" />
          )}
          Add area
        </button>
      </form>
      {message && (
        <p role="alert" className="font-semibold text-ember-700">
          {message}
        </p>
      )}
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
              <FeeInput
                area={area}
                onSaved={(updated) =>
                  setAreas((prev) =>
                    prev!.map((a) => (a.id === updated.id ? updated : a)),
                  )
                }
              />
              <button
                type="button"
                onClick={() => void toggle(area.id, !area.enabled)}
                aria-pressed={area.enabled}
                className={cn(
                  "min-h-11 min-w-11 rounded-full px-3 text-xs font-bold whitespace-nowrap ring-1 transition",
                  area.enabled
                    ? "bg-ember-500 text-charcoal-950 ring-ember-500"
                    : "bg-cream-100 text-ink-600 ring-cream-200",
                )}
              >
                {area.enabled ? "On" : "Off"}
              </button>
              {confirmingId === area.id ? (
                <span className="flex min-h-11 items-center gap-2 rounded-full bg-ember-500/10 px-3 ring-1 ring-ember-500/30">
                  <span className="text-xs font-bold text-ember-700">
                    Remove {area.name}?
                  </span>
                  <button
                    type="button"
                    onClick={() => void remove(area.id)}
                    className="min-h-11 px-1 text-xs font-black text-ember-700 underline underline-offset-2"
                  >
                    Yes, remove
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    className="min-h-11 px-1 text-xs font-bold text-ink-600 underline underline-offset-2"
                  >
                    No
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingId(area.id)}
                  aria-label={`Remove ${area.name}`}
                  className="flex size-11 items-center justify-center rounded-full text-ink-600 transition hover:bg-ember-500/10 hover:text-ember-700"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </button>
              )}
              {busyId === area.id && (
                <Loader2
                  aria-hidden="true"
                  className="size-4 animate-spin text-ember-700"
                />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
