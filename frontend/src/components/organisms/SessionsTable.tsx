import { Pencil, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { formatSessionDate } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locales";
import type { TestSession } from "@/types/api";

import { Badge } from "../atoms/Badge";
import { Button } from "../atoms/Button";
import { ButtonLink } from "../atoms/ButtonLink";
import { LanguageMark } from "../atoms/LanguageMark";

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
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-card motion-safe:animate-fade">
      <table className="min-w-full divide-y divide-line text-sm">
        <caption className="sr-only">{t("caption")}</caption>
        <thead className="bg-surface-muted/70 text-left text-xs font-semibold uppercase tracking-wider text-ink-subtle">
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
        <tbody className="divide-y divide-line">
          {sessions.map((session) => {
            const date = formatSessionDate(session.date, locale);
            const label = `${session.language} – ${date}`;

            return (
              <tr key={session.id} className="transition-colors hover:bg-surface-muted/50">
                <th scope="row" className="whitespace-nowrap px-4 py-3 text-left font-medium text-ink">
                  <span className="flex items-center gap-3">
                    <LanguageMark language={session.language} size="sm" />
                    {session.language}
                  </span>
                </th>
                <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{date}</td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-ink-muted">{session.time}</td>
                <td className="px-4 py-3 text-ink-muted">{session.location}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-ink-muted">
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
                  <div className="flex justify-end gap-1.5">
                    <ButtonLink href={editHref(session)} variant="secondary" size="sm">
                      <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                      {t.rich("edit", { session: label, hidden })}
                    </ButtonLink>
                    <Button
                      variant="dangerGhost"
                      size="sm"
                      isLoading={deletingId === session.id}
                      onClick={() => onDelete(session)}
                    >
                      {deletingId !== session.id && <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />}
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
