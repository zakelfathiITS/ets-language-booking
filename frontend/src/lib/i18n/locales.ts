/** Languages offered by the application; English is the default. */
export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
const DEFAULT_LOCALE: Locale = "en";

/** Cookie remembering the language chosen with the switcher. */
export const LOCALE_COOKIE = "locale";

function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Picks the language: explicit choice (cookie) first, then the browser's
 * preferences (Accept-Language, by decreasing weight), then English.
 */
export function resolveLocale(cookieValue: string | undefined, acceptLanguage: string | null): Locale {
  if (isLocale(cookieValue)) {
    return cookieValue;
  }

  const preferences = (acceptLanguage ?? "")
    .split(",")
    .map((entry) => {
      const [tag, ...params] = entry.trim().split(";");
      const quality = params.find((param) => param.trim().startsWith("q="));

      return { language: tag.toLowerCase().split("-")[0], weight: quality ? Number(quality.trim().slice(2)) : 1 };
    })
    .filter(({ language, weight }) => language && weight > 0)
    .sort((a, b) => b.weight - a.weight);

  return preferences.map(({ language }) => language).find(isLocale) ?? DEFAULT_LOCALE;
}
