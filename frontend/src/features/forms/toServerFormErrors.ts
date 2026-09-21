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
};

export function toServerFormErrors(error: unknown): ServerFormErrors {
  if (!isApiError(error)) {
    return { message: "Something went wrong. Please try again.", fields: {} };
  }

  const fields = { ...error.fieldErrors };
  const field = CODE_TO_FIELD[error.code];
  if (field) {
    fields[field] = error.message;
  }

  return { message: Object.keys(fields).length > 0 ? null : error.message, fields };
}
