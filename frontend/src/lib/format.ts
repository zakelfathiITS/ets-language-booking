const longDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

/** "2026-09-21T12:00:00+02:00" → "21 September 2026". */
export function formatLongDate(isoDate: string): string {
  return longDate.format(new Date(isoDate));
}

const sessionDate = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * "2026-09-23" → "Wed 23 September 2026". The API already gives the local
 * date of the session: it is formatted as is, never shifted to the viewer's zone.
 * Assembled from parts so the output is identical whatever the ICU version
 * (server, browser, tests): some add a comma after the weekday, some do not.
 */
export function formatSessionDate(localDate: string): string {
  const parts: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};
  for (const part of sessionDate.formatToParts(new Date(`${localDate}T00:00:00Z`))) {
    parts[part.type] = part.value;
  }

  return `${parts.weekday} ${parts.day} ${parts.month} ${parts.year}`;
}

/** "Europe/Paris" → "Paris". */
export function timezoneCity(timezone: string): string {
  return timezone.split("/").pop()?.replace(/_/g, " ") ?? timezone;
}
