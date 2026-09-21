"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback } from "react";

import { formatSessionDate } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locales";

interface SessionLike {
  language: string;
  date: string;
  time: string;
}

/** "English, Mon 23 September 2030 at 09:00", in the current language. */
export function useSessionLabel() {
  const t = useTranslations("sessions");
  const locale = useLocale() as Locale;

  return useCallback(
    (session: SessionLike) =>
      t("summary", { language: session.language, date: formatSessionDate(session.date, locale), time: session.time }),
    [t, locale],
  );
}
