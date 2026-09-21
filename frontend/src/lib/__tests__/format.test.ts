import { formatLongDate, formatSessionDate, sessionDateParts, timezoneCity } from "@/lib/format";

describe("format", () => {
  it("formats the local date of a session without shifting it, in each language", () => {
    expect(formatSessionDate("2026-09-23", "en")).toBe("Wed 23 September 2026");
    expect(formatSessionDate("2030-01-01", "en")).toBe("Tue 1 January 2030");
    expect(formatSessionDate("2026-09-23", "fr")).toBe("mer. 23 septembre 2026");
  });

  it("splits the local date of a session for calendar tiles, without abbreviation dots", () => {
    expect(sessionDateParts("2030-01-01", "en")).toEqual({ day: "1", month: "Jan" });
    expect(sessionDateParts("2026-10-31", "en")).toEqual({ day: "31", month: "Oct" });
    expect(sessionDateParts("2030-01-01", "fr")).toEqual({ day: "1", month: "janv" });
  });

  it("formats long dates in each language", () => {
    expect(formatLongDate("2026-09-21T12:00:00+02:00", "en")).toBe("21 September 2026");
    expect(formatLongDate("2026-09-21T12:00:00+02:00", "fr")).toBe("21 septembre 2026");
  });

  it("names the city of a timezone", () => {
    expect(timezoneCity("Europe/Paris")).toBe("Paris");
    expect(timezoneCity("America/New_York")).toBe("New York");
  });
});
