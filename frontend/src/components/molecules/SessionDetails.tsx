import { useLocale, useTranslations } from "next-intl";

import { formatSessionDate } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locales";

export interface SessionDetailsProps {
  date: string;
  time: string;
  location: string;
}

/** Date, time and place of a session, as a description list. */
export function SessionDetails({ date, time, location }: SessionDetailsProps) {
  const t = useTranslations("sessions.details");
  const locale = useLocale() as Locale;

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
      <dt className="text-neutral-500">{t("date")}</dt>
      <dd className="text-neutral-900">{formatSessionDate(date, locale)}</dd>
      <dt className="text-neutral-500">{t("time")}</dt>
      <dd className="text-neutral-900">{time}</dd>
      <dt className="text-neutral-500">{t("place")}</dt>
      <dd className="text-neutral-900">{location}</dd>
    </dl>
  );
}
