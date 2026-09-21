import { formatLongDate } from "@/lib/format";
import type { Reservation } from "@/types/api";

import { Badge } from "../atoms/Badge";
import { Button } from "../atoms/Button";
import { Heading } from "../atoms/Heading";
import { SessionDetails } from "../molecules/SessionDetails";

export interface ReservationCardProps {
  reservation: Reservation;
  onCancel: (reservation: Reservation) => void;
  isPending?: boolean;
}

export function ReservationCard({ reservation, onCancel, isPending = false }: ReservationCardProps) {
  const { session } = reservation;
  const headingId = `reservation-${reservation.id}`;

  return (
    <article
      aria-labelledby={headingId}
      className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Heading level={3}>
            <span id={headingId}>{session.language}</span>
          </Heading>
          {session.hasStarted ? <Badge>Past</Badge> : <Badge tone="success">Confirmed</Badge>}
        </div>
        <SessionDetails date={session.date} time={session.time} location={session.location} />
        <p className="text-xs text-neutral-500">Booked on {formatLongDate(reservation.reservedAt)}</p>
      </div>
      {reservation.canBeCancelled && (
        <Button variant="secondary" isLoading={isPending} onClick={() => onCancel(reservation)} className="sm:self-center">
          Cancel
        </Button>
      )}
    </article>
  );
}
