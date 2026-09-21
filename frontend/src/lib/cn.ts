/** Joins class names, skipping falsy values: cn("a", flag && "b"). */
export function cn(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}
