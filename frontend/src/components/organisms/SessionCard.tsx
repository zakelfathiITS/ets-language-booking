import { CalendarPlus, CalendarX2 } from "lucide-react";
import { useTranslations } from "next-intl";

import type { TestSession } from "@/types/api";

import { Badge } from "../atoms/Badge";
import { Button } from "../atoms/Button";
import { Heading } from "../atoms/Heading";
import { LanguageMark } from "../atoms/LanguageMark";
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
      className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-5 shadow-card transition-[translate,box-shadow,border-color] duration-200 hover:border-line-strong hover:shadow-raised motion-safe:hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-3">
        <LanguageMark language={session.language} />
        <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-x-3 gap-y-1 pt-0.5">
          <Heading level={2} className="truncate">
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
      </div>

      <SessionDetails date={session.date} time={session.time} location={session.location} />

      <div className="mt-auto space-y-4 border-t border-line pt-4">
        <SeatIndicator seatsAvailable={session.seatsAvailable} capacity={session.capacity} />
        {session.hasStarted ? (
          <Button variant="secondary" fullWidth disabled>
            {t("action.closed")}
          </Button>
        ) : isBooked ? (
          <Button variant="secondary" fullWidth isLoading={isPending} onClick={() => onCancel(session)}>
            {!isPending && <CalendarX2 aria-hidden="true" className="h-4 w-4" />}
            {t("action.cancel")}
          </Button>
        ) : session.isFull ? (
          <Button variant="secondary" fullWidth disabled>
            {t("action.full")}
          </Button>
        ) : (
          <Button fullWidth isLoading={isPending} onClick={() => onBook(session)}>
            {!isPending && <CalendarPlus aria-hidden="true" className="h-4 w-4" />}
            {t("action.book")}
          </Button>
        )}
      </div>
    </article>
  );
}
