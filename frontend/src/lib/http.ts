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

// While Next.js builds the site the backend may be asleep (a free Render service takes about a minute
// to wake). So during the build only: wait longer and try a few times, and once the backend has
// clearly not answered, stop waiting for it on every remaining page (see lib/server-data.ts).
const BUILDING = process.env.NEXT_PHASE === "phase-production-build";
const BUILD_TIMEOUT_MS = 25_000;
const BUILD_ATTEMPTS = 3;
let backendUnreachableDuringBuild = false;

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
    signal: signal ?? AbortSignal.timeout(isServer && BUILDING ? BUILD_TIMEOUT_MS : TIMEOUT_MS),
  };
  if (isServer && cacheable && method === "GET") {
    init.next = { revalidate: SERVER_REVALIDATE_SECONDS, tags: ["menu"] };
  } else {
    init.cache = "no-store";
  }

  const buildRetries = isServer && BUILDING && method === "GET";
  if (buildRetries && backendUnreachableDuringBuild) throw new ApiError("NETWORK", NETWORK_MESSAGE);

  let response: Response | undefined;
  for (let attempt = 1; attempt <= (buildRetries ? BUILD_ATTEMPTS : 1); attempt++) {
    try {
      // A fresh timeout for every attempt (an AbortSignal cannot be reused once it has fired).
      response = await fetch(buildUrl(path, query), attempt === 1 ? init : { ...init, signal: AbortSignal.timeout(BUILD_TIMEOUT_MS) });
    } catch {
      response = undefined;
    }
    // A waking Render service answers with a 5xx before it is ready; only the build keeps trying.
    if (response && !(buildRetries && response.status >= 500)) break;
  }
  if (!response) {
    if (buildRetries) backendUnreachableDuringBuild = true;
    throw new ApiError("NETWORK", NETWORK_MESSAGE);
  }
  if (buildRetries && response.status >= 500) backendUnreachableDuringBuild = true;

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("INTERNAL", INTERNAL_MESSAGE);
  }
}
