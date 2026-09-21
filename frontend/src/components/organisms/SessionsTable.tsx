import { formatSessionDate } from "@/lib/format";
import type { TestSession } from "@/types/api";

import { Badge } from "../atoms/Badge";
import { Button } from "../atoms/Button";
import { ButtonLink } from "../atoms/ButtonLink";

export interface SessionsTableProps {
  sessions: TestSession[];
  editHref: (session: TestSession) => string;
  onDelete: (session: TestSession) => void;
  deletingId?: string | null;
}

function status(session: TestSession) {
  if (session.hasStarted) return <Badge>Past</Badge>;
  if (session.isFull) return <Badge tone="danger">Full</Badge>;

  return <Badge tone="success">Open</Badge>;
}

/** Back-office listing; scrolls horizontally on small screens. */
export function SessionsTable({ sessions, editHref, onDelete, deletingId = null }: SessionsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-neutral-200 text-sm">
        <caption className="sr-only">Test sessions</caption>
        <thead className="bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
          <tr>
            <th scope="col" className="px-4 py-3">Language</th>
            <th scope="col" className="px-4 py-3">Date</th>
            <th scope="col" className="px-4 py-3">Time</th>
            <th scope="col" className="px-4 py-3">Location</th>
            <th scope="col" className="px-4 py-3 text-right">Seats booked</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3 text-right">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {sessions.map((session) => (
            <tr key={session.id}>
              <th scope="row" className="whitespace-nowrap px-4 py-3 text-left font-medium text-neutral-900">
                {session.language}
              </th>
              <td className="whitespace-nowrap px-4 py-3 text-neutral-700">{formatSessionDate(session.date)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-neutral-700">{session.time}</td>
              <td className="px-4 py-3 text-neutral-700">{session.location}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-neutral-700">
                {session.seatsTaken} / {session.capacity}
              </td>
              <td className="px-4 py-3">{status(session)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <ButtonLink href={editHref(session)} variant="secondary" size="sm">
                    Edit<span className="sr-only"> {session.language} on {formatSessionDate(session.date)}</span>
                  </ButtonLink>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-700 hover:bg-red-50"
                    isLoading={deletingId === session.id}
                    onClick={() => onDelete(session)}
                  >
                    Delete<span className="sr-only"> {session.language} on {formatSessionDate(session.date)}</span>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
