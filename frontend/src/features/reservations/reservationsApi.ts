import { baseApi } from "@/services/http/baseApi";
import type { Collection, Reservation } from "@/types/api";

export interface CancelReservationArgs {
  reservationId: string;
  sessionId: string;
}

/**
 * Booking and cancelling change seat counts: the affected session, the
 * catalogue and the reservation list are refetched, on success and on
 * conflicts alike (a 409 means what is displayed is out of date).
 */
function affectedBy(sessionId: string) {
  return [
    { type: "Session" as const, id: sessionId },
    { type: "Session" as const, id: "LIST" },
    { type: "Reservation" as const, id: "LIST" },
  ];
}

const reservationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listReservations: build.query<Collection<Reservation>, void>({
      query: () => ({ url: "/api/reservations" }),
      providesTags: [{ type: "Reservation", id: "LIST" }],
    }),
    bookSession: build.mutation<Reservation, string>({
      query: (sessionId) => ({ url: "/api/reservations", method: "POST", data: { sessionId } }),
      invalidatesTags: (_result, _error, sessionId) => affectedBy(sessionId),
    }),
    cancelReservation: build.mutation<void, CancelReservationArgs>({
      query: ({ reservationId }) => ({ url: `/api/reservations/${reservationId}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, { sessionId }) => affectedBy(sessionId),
    }),
  }),
});

export const { useListReservationsQuery, useBookSessionMutation, useCancelReservationMutation } = reservationsApi;
