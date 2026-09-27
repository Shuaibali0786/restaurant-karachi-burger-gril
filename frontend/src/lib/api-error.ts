/** Codes returned by the backend (specs/002-restaurant-backend/contracts/openapi.yaml), plus client-only NETWORK. */
export type ApiErrorCode =
  | "VALIDATION_FAILED"
  | "EMPTY_CART"
  | "UNKNOWN_ITEM"
  | "INVALID_OPTION"
  | "ITEM_SOLD_OUT"
  | "AREA_UNAVAILABLE"
  | "RESTAURANT_CLOSED"
  | "INVALID_SLOT"
  | "IDEMPOTENCY_CONFLICT"
  | "UNAUTHENTICATED"
  | "INVALID_CREDENTIALS"
  | "FORBIDDEN"
  | "ACCOUNT_EXISTS"
  | "NOT_FOUND"
  | "INVALID_TRANSITION"
  | "REVIEW_NOT_ALLOWED"
  | "RATE_LIMITED"
  | "INTERNAL"
  /** The request never reached the server (offline, timeout, DNS). */
  | "NETWORK";

/** Errors thrown by `lib/api.ts`. `fields` maps a dotted field path to a message; `details` carries code-specific extras. */
export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly fields?: Record<string, string>,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
