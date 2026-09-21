import { isAxiosError } from "axios";

import type { Problem } from "@/types/api";

/**
 * Error shape handed to the UI, whatever went wrong: an API Problem Details
 * document, a network failure or an unexpected answer.
 */
export interface ApiError {
  /** HTTP status, or 0 when the server could not be reached. */
  status: number;
  /** Stable code from the API (e.g. "session_full"), or a client-side one. */
  code: string;
  message: string;
  /** Field-level validation messages, keyed by field name. */
  fieldErrors: Record<string, string>;
}

function isProblem(data: unknown): data is Problem {
  return typeof data === "object" && data !== null && "code" in data && "detail" in data;
}

export function toApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    if (!error.response) {
      return {
        status: 0,
        code: "network_error",
        message: "The server cannot be reached. Check your connection and try again.",
        fieldErrors: {},
      };
    }

    const { status, data } = error.response;
    if (isProblem(data)) {
      const fieldErrors: Record<string, string> = {};
      for (const violation of data.violations ?? []) {
        // Keep the first message of each field: one clear hint at a time.
        fieldErrors[violation.field] ??= violation.message;
      }

      return { status, code: data.code, message: data.detail, fieldErrors };
    }

    return { status, code: "http_error", message: `Unexpected server answer (${status}).`, fieldErrors: {} };
  }

  return { status: 0, code: "unknown_error", message: "Something went wrong. Please try again.", fieldErrors: {} };
}

export function isApiError(value: unknown): value is ApiError {
  return typeof value === "object" && value !== null && "code" in value && "fieldErrors" in value;
}
