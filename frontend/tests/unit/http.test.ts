import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import { apiBase, request } from "@/lib/http";

function respond(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("http.request", () => {
  it("maps an error envelope to ApiError with fields and details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        respond(409, {
          error: { code: "ITEM_SOLD_OUT", message: "Fire Wings is sold out.", fields: { "lines.0": "sold out" }, details: { items: ["fire-wings"] } },
        }),
      ),
    );
    const error = await request("/orders", { method: "POST", body: {} }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    const apiError = error as ApiError;
    expect(apiError.code).toBe("ITEM_SOLD_OUT");
    expect(apiError.message).toBe("Fire Wings is sold out.");
    expect(apiError.fields).toEqual({ "lines.0": "sold out" });
    expect(apiError.details).toEqual({ items: ["fire-wings"] });
  });

  it("turns a network failure into NETWORK", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(request("/menu-items")).rejects.toMatchObject({ code: "NETWORK" });
  });

  it("turns a timeout into NETWORK", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("timed out", "TimeoutError")));
    await expect(request("/menu-items")).rejects.toMatchObject({ code: "NETWORK" });
  });

  it("treats any 5xx as INTERNAL without leaking the body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respond(502, { error: { code: "NOT_FOUND", message: "leaky detail" } })));
    const error = (await request("/menu-items").catch((e: unknown) => e)) as ApiError;
    expect(error.code).toBe("INTERNAL");
    expect(error.message).not.toContain("leaky");
  });

  it("falls back to INTERNAL for a non-JSON error body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>oops</html>", { status: 404 })));
    await expect(request("/menu-items")).rejects.toMatchObject({ code: "INTERNAL" });
  });

  it("returns undefined for 204 and parsed JSON otherwise", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response(null, { status: 204 })).mockResolvedValueOnce(respond(200, [1, 2])));
    await expect(request("/auth/logout", { method: "POST" })).resolves.toBeUndefined();
    await expect(request<number[]>("/x")).resolves.toEqual([1, 2]);
  });

  it("sends JSON, credentials, query params and extra headers, and skips empty query values", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(respond(200, {})));
    vi.stubGlobal("fetch", fetchMock);
    await request("/menu-items", { query: { category: "burgers", search: "", sort: undefined }, headers: { "Idempotency-Key": "k" } });
    await request("/orders", { method: "POST", body: { a: 1 } });

    const [firstUrl, firstInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(firstUrl).toMatch(/\/api\/v1\/menu-items\?category=burgers$/);
    expect(firstInit.credentials).toBe("include");
    expect((firstInit.headers as Record<string, string>)["Idempotency-Key"]).toBe("k");

    const [, secondInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(secondInit.body).toBe('{"a":1}');
    expect((secondInit.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });

  it("uses the backend URL on the server and caches public reads for 60 s", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.test/");
    expect(apiBase()).toBe("https://api.example.test/api/v1");

    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(respond(200, [])));
    vi.stubGlobal("fetch", fetchMock);
    await request("/categories", { cacheable: true });
    await request("/orders/KBG-10001");
    const [, cached] = fetchMock.mock.calls[0] as [string, { next?: { revalidate: number; tags: string[] }; cache?: string }];
    const [, uncached] = fetchMock.mock.calls[1] as [string, { next?: unknown; cache?: string }];
    expect(cached.next).toEqual({ revalidate: 60, tags: ["menu"] });
    expect(uncached.cache).toBe("no-store");
  });
});
