"use client";

import { useState } from "react";

import { Button } from "@/components/atoms/Button";
import { ButtonLink } from "@/components/atoms/ButtonLink";
import { Heading } from "@/components/atoms/Heading";
import { Alert } from "@/components/molecules/Alert";
import { CardSkeleton } from "@/components/molecules/CardSkeleton";
import { EmptyState } from "@/components/molecules/EmptyState";
import { ConfirmDialog } from "@/components/organisms/ConfirmDialog";
import { PageHeader } from "@/components/organisms/PageHeader";
import { ReservationCard } from "@/components/organisms/ReservationCard";
import { bookingErrorMessage } from "@/features/reservations/bookingMessages";
import { useCancelReservationMutation, useListReservationsQuery } from "@/features/reservations/reservationsApi";
import { formatSessionDate } from "@/lib/format";
import type { Reservation } from "@/types/api";

interface Notice {
  tone: "success" | "error";
  message: string;
}

function describe({ session }: Reservation): string {
  return `${session.language}, ${formatSessionDate(session.date)} at ${session.time}`;
}

export function ReservationsScreen() {
  const reservations = useListReservationsQuery();
  const [cancelReservation, cancellation] = useCancelReservationMutation();
  const [reservationToCancel, setReservationToCancel] = useState<Reservation | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  async function confirmCancellation() {
    if (!reservationToCancel) {
      return;
    }

    const reservation = reservationToCancel;
    const result = await cancelReservation({ reservationId: reservation.id, sessionId: reservation.session.id });
    setReservationToCancel(null);

    setNotice(
      result.error
        ? { tone: "error", message: bookingErrorMessage(result.error) }
        : { tone: "success", message: `Your reservation for ${describe(reservation)} has been cancelled.` },
    );
  }

  const items = reservations.data?.items ?? [];
  const upcoming = items.filter((reservation) => !reservation.session.hasStarted);
  const past = items.filter((reservation) => reservation.session.hasStarted);

  const renderList = (list: Reservation[]) => (
    <div className="space-y-3">
      {list.map((reservation) => (
        <ReservationCard
          key={reservation.id}
          reservation={reservation}
          isPending={cancellation.isLoading && reservationToCancel?.id === reservation.id}
          onCancel={setReservationToCancel}
        />
      ))}
    </div>
  );

  return (
    <>
      <PageHeader
        title="My reservations"
        description="Your booked language test sessions."
        actions={<ButtonLink href="/sessions">Book a session</ButtonLink>}
      />

      <div className="space-y-6">
        {notice && (
          <Alert tone={notice.tone} onDismiss={() => setNotice(null)}>
            {notice.message}
          </Alert>
        )}

        {reservations.isLoading ? (
          <div className="space-y-3">
            <p role="status" className="sr-only">
              Loading your reservations…
            </p>
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : reservations.isError ? (
          <Alert tone="error" title="Your reservations could not be loaded.">
            <Button variant="secondary" size="sm" className="mt-2" onClick={() => void reservations.refetch()}>
              Try again
            </Button>
          </Alert>
        ) : items.length === 0 ? (
          <EmptyState
            title="No reservation yet"
            description="Book a seat in one of the upcoming language test sessions."
            action={<ButtonLink href="/sessions">Browse sessions</ButtonLink>}
          />
        ) : (
          <>
            <section aria-labelledby="upcoming-reservations" className="space-y-3">
              <Heading level={2}>
                <span id="upcoming-reservations">Upcoming ({upcoming.length})</span>
              </Heading>
              {upcoming.length > 0 ? (
                renderList(upcoming)
              ) : (
                <p className="text-sm text-neutral-600">No upcoming session.</p>
              )}
            </section>
            {past.length > 0 && (
              <section aria-labelledby="past-reservations" className="space-y-3">
                <Heading level={2}>
                  <span id="past-reservations">Past ({past.length})</span>
                </Heading>
                {renderList(past)}
              </section>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={reservationToCancel !== null}
        title="Cancel this reservation?"
        description={reservationToCancel && `Your seat for ${describe(reservationToCancel)} will be released.`}
        confirmLabel="Cancel my reservation"
        isConfirming={cancellation.isLoading}
        onConfirm={() => void confirmCancellation()}
        onCancel={() => setReservationToCancel(null)}
      />
    </>
  );
}
