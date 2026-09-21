"use client";

import { useTranslations } from "next-intl";
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
import { useApiErrors } from "@/features/i18n/useApiErrors";
import { useBookSessionMutation, useCancelReservationMutation } from "@/features/reservations/reservationsApi";
import { useListLanguagesQuery, useListSessionsQuery } from "@/features/sessions/sessionsApi";
import { useSessionFilters } from "@/features/sessions/useSessionFilters";
import { useSessionLabel } from "@/features/sessions/useSessionLabel";
import { timezoneCity } from "@/lib/format";
import type { TestSession } from "@/types/api";

interface Notice {
  tone: "success" | "error";
  message: string;
}

export function SessionsScreen() {
  const t = useTranslations("sessions");
  const tc = useTranslations("common");
  const describe = useSessionLabel();
  const { messageOf } = useApiErrors();
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
        ? { tone: "error", message: messageOf(result.error) }
        : { tone: "success", message: t("booked", { session: describe(session) }) },
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
        ? { tone: "error", message: messageOf(result.error) }
        : { tone: "success", message: t("cancelled", { session: describe(session) }) },
    );
  }

  const data = sessions.data;
  const hasFilters = filters.language !== null || filters.availableOnly;
  const timezone = data?.items[0]?.timezone;

  return (
    <>
      <PageHeader
        title={t("title")}
        description={`${t("description")}${timezone ? ` ${t("timezoneNote", { city: timezoneCity(timezone) })}` : ""}`}
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
              {t("loading")}
            </p>
            {Array.from({ length: 6 }, (_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : sessions.isError || !data ? (
          <Alert tone="error" title={t("loadError")}>
            <Button variant="secondary" size="sm" className="mt-2" onClick={() => void sessions.refetch()}>
              {tc("tryAgain")}
            </Button>
          </Alert>
        ) : data.items.length === 0 ? (
          filters.page > 1 ? (
            <EmptyState
              title={t("empty.pageTitle")}
              description={t("empty.pageDescription")}
              action={<Button onClick={() => setPage(1)}>{t("empty.firstPage")}</Button>}
            />
          ) : (
            <EmptyState
              title={hasFilters ? t("empty.filteredTitle") : t("empty.title")}
              description={hasFilters ? t("empty.filteredDescription") : t("empty.description")}
              action={
                hasFilters && (
                  <Button variant="secondary" onClick={() => setFilters({ language: null, availableOnly: false })}>
                    {t("empty.clearFilters")}
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
        title={t("cancelDialog.title")}
        description={sessionToCancel && t("cancelDialog.description", { session: describe(sessionToCancel) })}
        confirmLabel={t("cancelDialog.confirm")}
        isConfirming={cancellation.isLoading}
        onConfirm={() => void confirmCancellation()}
        onCancel={() => setSessionToCancel(null)}
      />
    </>
  );
}
