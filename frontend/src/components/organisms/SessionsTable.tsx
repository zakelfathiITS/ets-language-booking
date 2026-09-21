import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { formatSessionDate } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locales";
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

/** Back-office listing; scrolls horizontally on small screens. */
export function SessionsTable({ sessions, editHref, onDelete, deletingId = null }: SessionsTableProps) {
  const t = useTranslations("admin.table");
  const locale = useLocale() as Locale;
  // Visible labels stay short; screen readers also hear which session is concerned.
  const hidden = (chunks: ReactNode) => <span className="sr-only">{chunks}</span>;

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-neutral-200 text-sm">
        <caption className="sr-only">{t("caption")}</caption>
        <thead className="bg-neutral-50 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
          <tr>
            <th scope="col" className="px-4 py-3">{t("language")}</th>
            <th scope="col" className="px-4 py-3">{t("date")}</th>
            <th scope="col" className="px-4 py-3">{t("time")}</th>
            <th scope="col" className="px-4 py-3">{t("location")}</th>
            <th scope="col" className="px-4 py-3 text-right">{t("seats")}</th>
            <th scope="col" className="px-4 py-3">{t("status")}</th>
            <th scope="col" className="px-4 py-3 text-right">
              <span className="sr-only">{t("actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {sessions.map((session) => {
            const date = formatSessionDate(session.date, locale);
            const label = `${session.language} – ${date}`;

            return (
              <tr key={session.id}>
                <th scope="row" className="whitespace-nowrap px-4 py-3 text-left font-medium text-neutral-900">
                  {session.language}
                </th>
                <td className="whitespace-nowrap px-4 py-3 text-neutral-700">{date}</td>
                <td className="whitespace-nowrap px-4 py-3 text-neutral-700">{session.time}</td>
                <td className="px-4 py-3 text-neutral-700">{session.location}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-neutral-700">
                  {session.seatsTaken} / {session.capacity}
                </td>
                <td className="px-4 py-3">
                  {session.hasStarted ? (
                    <Badge>{t("past")}</Badge>
                  ) : session.isFull ? (
                    <Badge tone="danger">{t("full")}</Badge>
                  ) : (
                    <Badge tone="success">{t("open")}</Badge>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <ButtonLink href={editHref(session)} variant="secondary" size="sm">
                      {t.rich("edit", { session: label, hidden })}
                    </ButtonLink>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-700 hover:bg-red-50"
                      isLoading={deletingId === session.id}
                      onClick={() => onDelete(session)}
                    >
                      {t.rich("delete", { session: label, hidden })}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
