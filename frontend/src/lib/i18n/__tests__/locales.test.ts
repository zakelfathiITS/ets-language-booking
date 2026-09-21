import { resolveLocale } from "@/lib/i18n/locales";

describe("resolveLocale", () => {
  it("honours the language chosen with the switcher", () => {
    expect(resolveLocale("fr", "en-GB,en;q=0.9")).toBe("fr");
  });

  it("follows the browser preferences by decreasing weight", () => {
    expect(resolveLocale(undefined, "de-DE,fr;q=0.8,en;q=0.5")).toBe("fr");
    expect(resolveLocale(undefined, "fr-CA")).toBe("fr");
    expect(resolveLocale(undefined, "en;q=0.4,fr;q=0.6")).toBe("fr");
  });

  it("falls back to English", () => {
    expect(resolveLocale("de", null)).toBe("en");
    expect(resolveLocale(undefined, "ja,zh;q=0.9")).toBe("en");
    expect(resolveLocale(undefined, "fr;q=0")).toBe("en");
  });
});
