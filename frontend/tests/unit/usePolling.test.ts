// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePolling } from "@/hooks/usePolling";

/** Lets pending microtasks (the mocked fetcher's promise, then the resulting state update) settle. */
const flush = () =>
  act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(document, "hidden", { value: false, configurable: true });
});

describe("usePolling", () => {
  it("fetches immediately, then again every 15 s", async () => {
    const fetcher = vi.fn().mockResolvedValue("ok");
    renderHook(() => usePolling({ fetcher }));
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(1);

    await act(() => vi.advanceTimersByTimeAsync(15_000));
    expect(fetcher).toHaveBeenCalledTimes(2);
    await act(() => vi.advanceTimersByTimeAsync(15_000));
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it("pauses while the tab is hidden and resumes on visibilitychange", async () => {
    const fetcher = vi.fn().mockResolvedValue("ok");
    renderHook(() => usePolling({ fetcher }));
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    await act(() => vi.advanceTimersByTimeAsync(60_000));
    expect(fetcher).toHaveBeenCalledTimes(1); // no new calls while hidden

    Object.defineProperty(document, "hidden", { value: false, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("refetches when the window regains focus", async () => {
    const fetcher = vi.fn().mockResolvedValue("ok");
    renderHook(() => usePolling({ fetcher }));
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event("focus"));
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("backs off to 60 s after 3 consecutive failures, and recovers on success", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => usePolling({ fetcher }));
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(1); // failure 1

    await act(() => vi.advanceTimersByTimeAsync(15_000));
    expect(fetcher).toHaveBeenCalledTimes(2); // failure 2
    await act(() => vi.advanceTimersByTimeAsync(15_000));
    expect(fetcher).toHaveBeenCalledTimes(3); // failure 3 -> now backing off
    expect(result.current.error).toBeInstanceOf(Error);

    await act(() => vi.advanceTimersByTimeAsync(15_000));
    expect(fetcher).toHaveBeenCalledTimes(3); // still waiting for the fuller 60 s backoff
    await act(() => vi.advanceTimersByTimeAsync(45_000));
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it("stops polling once `done` returns true for the latest value", async () => {
    const fetcher = vi.fn().mockResolvedValue("delivered");
    renderHook(() => usePolling({ fetcher, done: (value) => value === "delivered" }));
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(1);

    await act(() => vi.advanceTimersByTimeAsync(60_000));
    expect(fetcher).toHaveBeenCalledTimes(1); // no further polling after the done value arrived
  });

  it("never fetches when disabled, and shows initialData immediately", async () => {
    const fetcher = vi.fn().mockResolvedValue("ok");
    const { result } = renderHook(() => usePolling({ fetcher, enabled: false, initialData: "seed" }));

    expect(result.current.data).toBe("seed");
    await act(() => vi.advanceTimersByTimeAsync(60_000));
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("stops calling the fetcher after unmount", async () => {
    const fetcher = vi.fn().mockResolvedValue("ok");
    const { unmount } = renderHook(() => usePolling({ fetcher }));
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(1);

    unmount();
    await act(() => vi.advanceTimersByTimeAsync(60_000));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
