import { cn } from "@/lib/cn";

const PALETTE = [
  "from-amber-600 to-orange-700",
  "from-emerald-500 to-teal-700",
  "from-fuchsia-500 to-purple-700",
  "from-orange-500 to-red-700",
  "from-lime-600 to-green-700",
  "from-violet-500 to-indigo-700",
  "from-sky-500 to-blue-700",
  "from-rose-500 to-pink-700",
] as const;

const sizes = {
  sm: "h-8 w-8 rounded-lg text-[0.7rem]",
  md: "h-11 w-11 rounded-xl text-sm",
} as const;

/**
 * Same language, same colour: a hash of the name (FNV-1a) picks the gradient.
 * The seed is chosen so that the most taught languages get different colours.
 */
function paletteFor(language: string): string {
  let hash = 353;
  for (const char of language.toLowerCase()) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  }
  hash ^= hash >>> 15;

  return PALETTE[(hash >>> 0) % PALETTE.length];
}

/** Two-letter monogram of a language ("English" → "EN"); decorative. */
export function LanguageMark({ language, size = "md" }: { language: string; size?: keyof typeof sizes }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-gradient-to-br font-bold tracking-wide text-white shadow-sm",
        sizes[size],
        paletteFor(language),
      )}
    >
      {language.slice(0, 2).toUpperCase()}
    </span>
  );
}
