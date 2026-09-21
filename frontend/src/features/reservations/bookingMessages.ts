import { isApiError } from "@/services/http/apiError";

/** Friendlier wording for the conflicts a booking or a cancellation can meet. */
const MESSAGES: Record<string, string> = {
  session_full: "Sorry, this session has just filled up. Seats have been refreshed.",
  already_reserved: "You already hold a reservation for this session.",
  session_already_started: "This session has already started: its bookings can no longer change.",
  session_not_found: "This session no longer exists.",
  reservation_not_found: "This reservation no longer exists.",
};

export function bookingErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return MESSAGES[error.code] ?? error.message;
  }

  return "Something went wrong. Please try again.";
}
