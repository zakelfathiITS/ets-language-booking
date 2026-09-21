import { formatSessionDate, timezoneCity } from "@/lib/format";

describe("format", () => {
  it("formats the local date of a session without shifting it", () => {
    expect(formatSessionDate("2026-09-23")).toBe("Wed 23 September 2026");
    expect(formatSessionDate("2030-01-01")).toBe("Tue 1 January 2030");
  });

  it("names the city of a timezone", () => {
    expect(timezoneCity("Europe/Paris")).toBe("Paris");
    expect(timezoneCity("America/New_York")).toBe("New York");
  });
});
