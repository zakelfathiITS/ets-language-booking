"use client";

import { CalendarPlus, Ticket } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { useApiErrors } from "@/features/i18n/useApiErrors";
import { useCancelReservationMutation, useListReservationsQuery } from "@/features/reservations/reservationsApi";
import { useSessionLabel } from "@/features/sessions/useSessionLabel";
import type { Reservation } from "@/types/api";

interface Notice {
  tone: "success" | "error";
  message: string;
}

export function ReservationsScreen() {
  const t = useTranslations("reservations");
  const tc = useTranslations("common");
  const describe = useSessionLabel();
  const { messageOf } = useApiErrors();
  const reservations = useListReservationsQuery();
  const [cancelReservation, cancellation] = useCancelReservationMutation();
  const [reservationToCancel, setReservationToCancel] = useState<Reservation | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  async function confirmCancellation() {
    const reservation = reservationToCancel;
    if (!reservation) {
      return;
    }

    const result = await cancelReservation({ reservationId: reservation.id, sessionId: reservation.session.id });
    setReservationToCancel(null);

    setNotice(
      result.error
        ? { tone: "error", message: messageOf(result.error) }
        : { tone: "success", message: t("cancelled", { session: describe(reservation.session) }) },
    );
  }

  const items = reservations.data?.items ?? [];
  const upcoming = items.filter((reservation) => !reservation.session.hasStarted);
  const past = items.filter((reservation) => reservation.session.hasStarted);

  const renderList = (list: Reservation[]) => (
    <div className="space-y-3 *:motion-safe:animate-rise">
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
        title={t("title")}
        description={t("description")}
        actions={
          <ButtonLink href="/sessions">
            <CalendarPlus aria-hidden="true" className="h-4 w-4" />
            {t("bookSession")}
          </ButtonLink>
        }
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
              {t("loading")}
            </p>
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : reservations.isError ? (
          <Alert tone="error" title={t("loadError")}>
            <Button variant="secondary" size="sm" className="mt-2" onClick={() => void reservations.refetch()}>
              {tc("tryAgain")}
            </Button>
          </Alert>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            action={<ButtonLink href="/sessions">{t("browseSessions")}</ButtonLink>}
          />
        ) : (
          <>
            <section aria-labelledby="upcoming-reservations" className="space-y-4">
              <Heading level={2}>
                <span id="upcoming-reservations">{t("upcoming", { count: upcoming.length })}</span>
              </Heading>
              {upcoming.length > 0 ? renderList(upcoming) : <p className="text-sm text-ink-muted">{t("noUpcoming")}</p>}
            </section>
            {past.length > 0 && (
              <section aria-labelledby="past-reservations" className="space-y-4 pt-2">
                <Heading level={2}>
                  <span id="past-reservations">{t("past", { count: past.length })}</span>
                </Heading>
                {renderList(past)}
              </section>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={reservationToCancel !== null}
        title={t("cancelDialog.title")}
        description={reservationToCancel && t("cancelDialog.description", { session: describe(reservationToCancel.session) })}
        confirmLabel={t("cancelDialog.confirm")}
        isConfirming={cancellation.isLoading}
        onConfirm={() => void confirmCancellation()}
        onCancel={() => setReservationToCancel(null)}
      />
    </>
  );
}
