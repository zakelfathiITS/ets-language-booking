import { CalendarX2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { formatLongDate, sessionDateParts } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locales";
import type { Reservation } from "@/types/api";

import { Badge } from "../atoms/Badge";
import { Button } from "../atoms/Button";
import { DateTile } from "../atoms/DateTile";
import { Heading } from "../atoms/Heading";
import { SessionDetails } from "../molecules/SessionDetails";

export interface ReservationCardProps {
  reservation: Reservation;
  onCancel: (reservation: Reservation) => void;
  isPending?: boolean;
}

export function ReservationCard({ reservation, onCancel, isPending = false }: ReservationCardProps) {
  const t = useTranslations("reservations");
  const locale = useLocale() as Locale;
  const { session } = reservation;
  const headingId = `reservation-${reservation.id}`;

  return (
    <article
      aria-labelledby={headingId}
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card transition-shadow hover:shadow-raised sm:flex-row sm:items-center",
        session.hasStarted && "bg-surface/60",
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center">
        <DateTile {...sessionDateParts(session.date, locale)} muted={session.hasStarted} />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Heading level={3}>
              <span id={headingId}>{session.language}</span>
            </Heading>
            {session.hasStarted ? <Badge>{t("pastBadge")}</Badge> : <Badge tone="success">{t("confirmed")}</Badge>}
          </div>
          <SessionDetails date={session.date} time={session.time} location={session.location} layout="inline" />
          <p className="text-xs text-ink-subtle">{t("bookedOn", { date: formatLongDate(reservation.reservedAt, locale) })}</p>
        </div>
      </div>
      {reservation.canBeCancelled && (
        <Button variant="secondary" isLoading={isPending} onClick={() => onCancel(reservation)} className="sm:self-center">
          {!isPending && <CalendarX2 aria-hidden="true" className="h-4 w-4" />}
          {t("cancel")}
        </Button>
      )}
    </article>
  );
}
