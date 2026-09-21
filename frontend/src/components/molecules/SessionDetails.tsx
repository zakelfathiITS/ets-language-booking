import { CalendarDays, Clock3, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { formatSessionDate } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locales";

export interface SessionDetailsProps {
  date: string;
  time: string;
  location: string;
  /** "inline" puts the three details on one wrapping line. */
  layout?: "stacked" | "inline";
}

/** Date, time and place of a session, as a description list. */
export function SessionDetails({ date, time, location, layout = "stacked" }: SessionDetailsProps) {
  const t = useTranslations("sessions.details");
  const locale = useLocale() as Locale;
  const rows = [
    { icon: CalendarDays, label: t("date"), value: formatSessionDate(date, locale) },
    { icon: Clock3, label: t("time"), value: time },
    { icon: MapPin, label: t("place"), value: location },
  ];

  return (
    <dl className={cn("text-sm", layout === "inline" ? "flex flex-wrap gap-x-5 gap-y-1.5" : "space-y-1.5")}>
      {rows.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-start gap-2">
          <dt className="flex items-center">
            <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 text-ink-subtle" />
            <span className="sr-only">{label}</span>
          </dt>
          <dd className="text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
