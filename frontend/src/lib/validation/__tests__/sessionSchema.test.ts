import { sessionSchema } from "@/lib/validation/sessionSchema";

const valid = { language: "English", date: "2030-06-14", time: "09:30", location: "Paris", capacity: 20 };

describe("sessionSchema", () => {
  it("accepts a valid session", () => {
    expect(sessionSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ["language", { language: "E" }],
    ["date", { date: "" }],
    ["time", { time: "25:00" }],
    ["location", { location: " " }],
    ["capacity", { capacity: 0 }],
    ["capacity", { capacity: 1001 }],
    ["capacity", { capacity: 2.5 }],
    ["capacity", { capacity: Number.NaN }],
  ])("rejects an invalid %s", (field, patch) => {
    const result = sessionSchema.safeParse({ ...valid, ...patch });

    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual([field]);
  });
});
