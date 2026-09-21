import { formatSessionDate } from "@/lib/format";

export interface SessionDetailsProps {
  date: string;
  time: string;
  location: string;
}

/** Date, time and place of a session, as a description list. */
export function SessionDetails({ date, time, location }: SessionDetailsProps) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
      <dt className="text-neutral-500">Date</dt>
      <dd className="text-neutral-900">{formatSessionDate(date)}</dd>
      <dt className="text-neutral-500">Time</dt>
      <dd className="text-neutral-900">{time}</dd>
      <dt className="text-neutral-500">Place</dt>
      <dd className="text-neutral-900">{location}</dd>
    </dl>
  );
}
