/**
 * Transport for `lib/api.ts` (specs/002-restaurant-backend/contracts/frontend-api.md).
 *
 * - Browser: relative `/api/v1`. Next.js forwards `/api/*` to the backend (see next.config.ts), so the
 *   session cookie stays first-party on this site (ADR-0002).
 * - Server (Server Components, build): the backend URL directly, with ISR caching for public menu reads.
 */
import { ApiError, type ApiErrorCode } from "@/lib/api-error";

const TIMEOUT_MS = 10_000;
const SERVER_REVALIDATE_SECONDS = 60;

const NETWORK_MESSAGE = "We couldn't reach the kitchen. Check your connection and try again.";
const INTERNAL_MESSAGE = "Something went wrong on our side. Please try again.";

export function apiBase(): string {
  if (typeof window !== "undefined") return "/api/v1";
  const backend = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");
  return `${backend}/api/v1`;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  /** Cache a public GET on the server (ISR). Ignored in the browser. */
  cacheable?: boolean;
  signal?: AbortSignal;
}

interface ErrorEnvelope {
  error?: { code?: string; message?: string; fields?: Record<string, string>; details?: Record<string, unknown> };
}

function buildUrl(path: string, query: RequestOptions["query"]): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return `${apiBase()}${path}${qs ? `?${qs}` : ""}`;
}

async function toApiError(response: Response): Promise<ApiError> {
  if (response.status >= 500) return new ApiError("INTERNAL", INTERNAL_MESSAGE);
  let envelope: ErrorEnvelope = {};
  try {
    envelope = (await response.json()) as ErrorEnvelope;
  } catch {
    // Not JSON: fall through to a generic error.
  }
  const error = envelope.error;
  if (!error?.code) return new ApiError("INTERNAL", INTERNAL_MESSAGE);
  return new ApiError(error.code as ApiErrorCode, error.message ?? INTERNAL_MESSAGE, error.fields, error.details);
}

/** Calls the backend and returns the parsed JSON body (`undefined` for 204). Throws `ApiError`. */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", query, body, headers, cacheable = false, signal } = options;
  const isServer = typeof window === "undefined";

  const init: RequestInit & { next?: { revalidate: number; tags: string[] } } = {
    method,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
    signal: signal ?? AbortSignal.timeout(TIMEOUT_MS),
  };
  if (isServer && cacheable && method === "GET") {
    init.next = { revalidate: SERVER_REVALIDATE_SECONDS, tags: ["menu"] };
  } else {
    init.cache = "no-store";
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), init);
  } catch {
    throw new ApiError("NETWORK", NETWORK_MESSAGE);
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("INTERNAL", INTERNAL_MESSAGE);
  }
}
