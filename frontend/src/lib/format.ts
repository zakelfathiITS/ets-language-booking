const longDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

/** "2026-09-21T12:00:00+02:00" → "21 September 2026". */
export function formatLongDate(isoDate: string): string {
  return longDate.format(new Date(isoDate));
}
