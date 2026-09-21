import en from "@/lib/i18n/messages/en.json";
import fr from "@/lib/i18n/messages/fr.json";

type Messages = { [key: string]: string | Messages };

function entries(messages: Messages, prefix = ""): Array<[string, string]> {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === "string" ? [[`${prefix}${key}`, value] as [string, string]] : entries(value, `${prefix}${key}.`),
  );
}

/** Placeholder names used by a message: {name}, {count, plural, ...}, <tag> (not the text of plural branches). */
function placeholders(message: string): string[] {
  const names = [...message.matchAll(/\{(\w+)\s*[,}]|<(\w+)>/g)].map((match) => match[1] ?? match[2]);

  return [...new Set(names)].sort();
}

describe("translation catalogues", () => {
  const english = new Map(entries(en));
  const french = new Map(entries(fr));

  it("translate exactly the same keys", () => {
    expect([...french.keys()].sort()).toEqual([...english.keys()].sort());
  });

  it("use the same placeholders in both languages", () => {
    for (const [key, message] of english) {
      expect({ key, placeholders: placeholders(french.get(key) ?? "") }).toEqual({ key, placeholders: placeholders(message) });
    }
  });

  it("leave no message empty", () => {
    expect([...english, ...french].filter(([, message]) => message.trim() === "")).toEqual([]);
  });
});
