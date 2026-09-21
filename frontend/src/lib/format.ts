import type { Locale } from "./i18n/locales";

/** Regional conventions used to format dates in each language. */
const INTL_LOCALES: Record<Locale, string> = { en: "en-GB", fr: "fr-FR" };

const longDates = new Map<Locale, Intl.DateTimeFormat>();
const sessionDates = new Map<Locale, Intl.DateTimeFormat>();

function formatter(cache: Map<Locale, Intl.DateTimeFormat>, locale: Locale, options: Intl.DateTimeFormatOptions) {
  let format = cache.get(locale);
  if (!format) {
    format = new Intl.DateTimeFormat(INTL_LOCALES[locale], options);
    cache.set(locale, format);
  }

  return format;
}

/** "2026-09-21T12:00:00+02:00" → "21 September 2026" / "21 septembre 2026". */
export function formatLongDate(isoDate: string, locale: Locale): string {
  return formatter(longDates, locale, { day: "numeric", month: "long", year: "numeric" }).format(new Date(isoDate));
}

/**
 * "2026-09-23" → "Wed 23 September 2026" / "mer. 23 septembre 2026". The API
 * gives the local date of the session: it is formatted as is, never shifted to
 * the viewer's timezone. Assembled from parts so the output is identical
 * whatever the ICU version (server, browser, tests).
 */
export function formatSessionDate(localDate: string, locale: Locale): string {
  const parts: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};
  const format = formatter(sessionDates, locale, {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  for (const part of format.formatToParts(new Date(`${localDate}T00:00:00Z`))) {
    parts[part.type] = part.value;
  }

  return `${parts.weekday} ${parts.day} ${parts.month} ${parts.year}`;
}

const shortMonths = new Map<Locale, Intl.DateTimeFormat>();

/** "2026-09-23" → { day: "23", month: "Sep" } / { day: "23", month: "sept." }, for calendar tiles. */
export function sessionDateParts(localDate: string, locale: Locale): { day: string; month: string } {
  const format = formatter(shortMonths, locale, { day: "numeric", month: "short", timeZone: "UTC" });
  const parts: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};
  for (const part of format.formatToParts(new Date(`${localDate}T00:00:00Z`))) {
    parts[part.type] = part.value;
  }

  return { day: parts.day ?? "", month: (parts.month ?? "").replace(/\.$/, "") };
}

/** "Europe/Paris" → "Paris". */
export function timezoneCity(timezone: string): string {
  return timezone.split("/").pop()?.replace(/_/g, " ") ?? timezone;
}
