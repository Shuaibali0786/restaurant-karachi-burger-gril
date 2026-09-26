export type ApiErrorCode = "VALIDATION_FAILED" | "EMPTY_CART" | "UNKNOWN_ITEM" | "INVALID_OPTION" | "NOT_FOUND";

/** Errors thrown by `lib/api.ts`, matching the backend error codes in contracts/openapi.yaml. */
export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
