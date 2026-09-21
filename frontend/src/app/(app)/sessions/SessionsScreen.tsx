"use client";

import { useState } from "react";

import { Button } from "@/components/atoms/Button";
import { Alert } from "@/components/molecules/Alert";
import { CardSkeleton } from "@/components/molecules/CardSkeleton";
import { EmptyState } from "@/components/molecules/EmptyState";
import { PaginationControls } from "@/components/molecules/PaginationControls";
import { ConfirmDialog } from "@/components/organisms/ConfirmDialog";
import { PageHeader } from "@/components/organisms/PageHeader";
import { SessionCard } from "@/components/organisms/SessionCard";
import { SessionFilters } from "@/components/organisms/SessionFilters";
import { bookingErrorMessage } from "@/features/reservations/bookingMessages";
import { useBookSessionMutation, useCancelReservationMutation } from "@/features/reservations/reservationsApi";
import { useListLanguagesQuery, useListSessionsQuery } from "@/features/sessions/sessionsApi";
import { useSessionFilters } from "@/features/sessions/useSessionFilters";
import { formatSessionDate, timezoneCity } from "@/lib/format";
import type { TestSession } from "@/types/api";

interface Notice {
  tone: "success" | "error";
  message: string;
}

function describe(session: TestSession): string {
  return `${session.language}, ${formatSessionDate(session.date)} at ${session.time}`;
}

export function SessionsScreen() {
  const { filters, setPage, setFilters } = useSessionFilters();
  const sessions = useListSessionsQuery({
    page: filters.page,
    language: filters.language,
    availableOnly: filters.availableOnly,
  });
  const { data: languages } = useListLanguagesQuery();
  const [bookSession] = useBookSessionMutation();
  const [cancelReservation, cancellation] = useCancelReservationMutation();

  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [sessionToCancel, setSessionToCancel] = useState<TestSession | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  async function book(session: TestSession) {
    setNotice(null);
    setPendingSessionId(session.id);
    const result = await bookSession(session.id);
    setPendingSessionId(null);

    setNotice(
      result.error
        ? { tone: "error", message: bookingErrorMessage(result.error) }
        : { tone: "success", message: `Your seat is booked: ${describe(session)}.` },
    );
  }

  async function confirmCancellation() {
    const session = sessionToCancel;
    const reservationId = session?.myReservationId;
    if (!session || !reservationId) {
      return;
    }

    const result = await cancelReservation({ reservationId, sessionId: session.id });
    setSessionToCancel(null);

    setNotice(
      result.error
        ? { tone: "error", message: bookingErrorMessage(result.error) }
        : { tone: "success", message: `Your booking for ${describe(session)} has been cancelled.` },
    );
  }

  const data = sessions.data;
  const hasFilters = filters.language !== null || filters.availableOnly;
  const timezone = data?.items[0]?.timezone;

  return (
    <>
      <PageHeader
        title="Test sessions"
        description={`Browse upcoming sessions and book your seat.${timezone ? ` Times are in ${timezoneCity(timezone)} time.` : ""}`}
      />

      <div className="space-y-6">
        <SessionFilters
          languages={languages?.items ?? []}
          language={filters.language}
          availableOnly={filters.availableOnly}
          onChange={setFilters}
        />

        {notice && (
          <Alert tone={notice.tone} onDismiss={() => setNotice(null)}>
            {notice.message}
          </Alert>
        )}

        {sessions.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <p role="status" className="sr-only">
              Loading sessions…
            </p>
            {Array.from({ length: 6 }, (_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : sessions.isError || !data ? (
          <Alert tone="error" title="The sessions could not be loaded.">
            <Button variant="secondary" size="sm" className="mt-2" onClick={() => void sessions.refetch()}>
              Try again
            </Button>
          </Alert>
        ) : data.items.length === 0 ? (
          filters.page > 1 ? (
            <EmptyState
              title="This page is empty"
              description="The catalogue has changed since this page was opened."
              action={<Button onClick={() => setPage(1)}>Back to the first page</Button>}
            />
          ) : (
            <EmptyState
              title={hasFilters ? "No session matches your filters" : "No upcoming session"}
              description={hasFilters ? "Try another language or include full sessions." : "New sessions are published regularly."}
              action={
                hasFilters && (
                  <Button variant="secondary" onClick={() => setFilters({ language: null, availableOnly: false })}>
                    Clear filters
                  </Button>
                )
              }
            />
          )
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy={sessions.isFetching}>
              {data.items.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  isPending={pendingSessionId === session.id}
                  onBook={(selected) => void book(selected)}
                  onCancel={setSessionToCancel}
                />
              ))}
            </div>
            <PaginationControls
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onPageChange={setPage}
              disabled={sessions.isFetching}
            />
          </>
        )}
      </div>

      <ConfirmDialog
        open={sessionToCancel !== null}
        title="Cancel this booking?"
        description={sessionToCancel && `Your seat for ${describe(sessionToCancel)} will be released.`}
        confirmLabel="Cancel my booking"
        isConfirming={cancellation.isLoading}
        onConfirm={() => void confirmCancellation()}
        onCancel={() => setSessionToCancel(null)}
      />
    </>
  );
}
