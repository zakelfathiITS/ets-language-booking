import type { ServerFormErrors } from "@/lib/validation/serverErrors";
import { isApiError } from "@/services/http/apiError";

/**
 * Error codes that concern a single field although the API reports them
 * without a violation list (e.g. a 409 conflict).
 */
const CODE_TO_FIELD: Record<string, string> = {
  email_already_in_use: "email",
  invalid_email: "email",
  invalid_name: "name",
  session_in_past: "date",
  invalid_language: "language",
  invalid_location: "location",
  invalid_capacity: "capacity",
  capacity_below_reserved_seats: "capacity",
};

/** Turns an error code into a message in the current language (null if unknown). */
export type ErrorCodeTranslator = (code: string) => string | null;

/**
 * Violation messages are already localised by the API (Accept-Language);
 * errors identified by a code are translated here, the API text being the fallback.
 */
export function toServerFormErrors(error: unknown, translate: ErrorCodeTranslator): ServerFormErrors {
  if (!isApiError(error)) {
    return { message: translate("generic"), fields: {} };
  }

  const fields = { ...error.fieldErrors };
  const message = translate(error.code) ?? error.message;
  const field = CODE_TO_FIELD[error.code];
  if (field) {
    fields[field] = message;
  }

  return { message: Object.keys(fields).length > 0 ? null : message, fields };
}
