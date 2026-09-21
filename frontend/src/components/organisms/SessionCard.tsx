import { useTranslations } from "next-intl";

import type { TestSession } from "@/types/api";

import { Badge } from "../atoms/Badge";
import { Button } from "../atoms/Button";
import { Heading } from "../atoms/Heading";
import { SeatIndicator } from "../molecules/SeatIndicator";
import { SessionDetails } from "../molecules/SessionDetails";

const FEW_SEATS = 3;

export interface SessionCardProps {
  session: TestSession;
  onBook: (session: TestSession) => void;
  onCancel: (session: TestSession) => void;
  isPending?: boolean;
}

/**
 * One session and the single action that makes sense for it: book, cancel
 * one's booking, or nothing when the session is full or has started.
 */
export function SessionCard({ session, onBook, onCancel, isPending = false }: SessionCardProps) {
  const t = useTranslations("sessions");
  const headingId = `session-${session.id}`;
  const isBooked = session.myReservationId !== null;

  return (
    <article
      aria-labelledby={headingId}
      className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <Heading level={2}>
          <span id={headingId}>{session.language}</span>
        </Heading>
        {session.hasStarted ? (
          <Badge>{t("badge.started")}</Badge>
        ) : isBooked ? (
          <Badge tone="success">{t("badge.booked")}</Badge>
        ) : session.isFull ? (
          <Badge tone="danger">{t("badge.full")}</Badge>
        ) : (
          session.seatsAvailable <= FEW_SEATS && <Badge tone="warning">{t("badge.fewSeats")}</Badge>
        )}
      </div>

      <SessionDetails date={session.date} time={session.time} location={session.location} />
      <SeatIndicator seatsAvailable={session.seatsAvailable} capacity={session.capacity} />

      <div className="mt-auto">
        {session.hasStarted ? (
          <Button variant="secondary" fullWidth disabled>
            {t("action.closed")}
          </Button>
        ) : isBooked ? (
          <Button variant="secondary" fullWidth isLoading={isPending} onClick={() => onCancel(session)}>
            {t("action.cancel")}
          </Button>
        ) : session.isFull ? (
          <Button variant="secondary" fullWidth disabled>
            {t("action.full")}
          </Button>
        ) : (
          <Button fullWidth isLoading={isPending} onClick={() => onBook(session)}>
            {t("action.book")}
          </Button>
        )}
      </div>
    </article>
  );
}
