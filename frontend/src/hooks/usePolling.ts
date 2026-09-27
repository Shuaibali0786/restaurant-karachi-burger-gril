"use client";

import { useEffect, useRef, useState } from "react";

interface UsePollingOptions<T> {
  /** Fetches the latest value. Throwing counts as a failed attempt (research R11). */
  fetcher: () => Promise<T>;
  /** How often to poll while everything is going well. Default 15 s. */
  intervalMs?: number;
  /** How often to poll after several failures in a row. Default 60 s. */
  backoffMs?: number;
  /** Failures in a row before switching to `backoffMs`. Default 3. */
  maxErrorsBeforeBackoff?: number;
  /** Stop polling once this returns true for the latest value (e.g. a delivered order). */
  done?: (value: T) => boolean;
  /** Set to false to stop polling entirely (e.g. no id to poll for yet). Default true. */
  enabled?: boolean;
  /** Shown immediately, before the first fetch resolves, to avoid a loading flash. */
  initialData?: T | null;
}

interface UsePollingResult<T> {
  data: T | null;
  error: unknown;
}

/**
 * Polls `fetcher` on an interval (research R11): pauses while the tab is hidden, refetches
 * immediately when it becomes visible or the window regains focus, backs off after repeated
 * failures, and stops once `done` says so. Used by the order tracker (every 15 s, stops at
 * Delivered/Cancelled) and, later, the admin orders board.
 */
export function usePolling<T>({
  fetcher,
  intervalMs = 15_000,
  backoffMs = 60_000,
  maxErrorsBeforeBackoff = 3,
  done,
  enabled = true,
  initialData = null,
}: UsePollingOptions<T>): UsePollingResult<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [error, setError] = useState<unknown>(null);

  // Refs so the effect below doesn't need to restart every render just because a caller passed a
  // new inline function; only `enabled`/interval settings restart the polling loop. Kept in sync
  // after each render (not during it) so a stale closure is never called on the next tick.
  const fetcherRef = useRef(fetcher);
  const doneRef = useRef(done);
  useEffect(() => {
    fetcherRef.current = fetcher;
    doneRef.current = done;
  });

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let stopped = false;
    let errorStreak = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const clear = () => {
      if (timer) clearTimeout(timer);
      timer = null;
    };

    const tick = async () => {
      if (cancelled || stopped || document.hidden) return; // paused while the tab is hidden
      try {
        const value = await fetcherRef.current();
        if (cancelled) return;
        errorStreak = 0;
        setData(value);
        setError(null);
        if (doneRef.current?.(value)) {
          stopped = true;
          return;
        }
        clear();
        timer = setTimeout(() => void tick(), intervalMs);
      } catch (err) {
        if (cancelled) return;
        errorStreak += 1;
        setError(err);
        clear();
        timer = setTimeout(() => void tick(), errorStreak >= maxErrorsBeforeBackoff ? backoffMs : intervalMs);
      }
    };

    const onVisible = () => {
      if (!document.hidden && !stopped) {
        clear();
        void tick();
      }
    };

    void tick();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      cancelled = true;
      clear();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [enabled, intervalMs, backoffMs, maxErrorsBeforeBackoff]);

  return { data, error };
}
