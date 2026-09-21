import { cn } from "@/lib/cn";

/** Calendar-style tile ("SEP / 23"); decorative, the full date is written next to it. */
export function DateTile({ month, day, muted = false }: { month: string; day: string; muted?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex w-14 shrink-0 flex-col overflow-hidden rounded-xl border border-line bg-surface text-center shadow-sm"
    >
      <span
        className={cn(
          "py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-white",
          muted ? "bg-slate-500 dark:bg-slate-600" : "bg-brand-600",
        )}
      >
        {month}
      </span>
      <span className={cn("py-1 text-xl font-semibold tabular-nums", muted ? "text-ink-muted" : "text-ink")}>{day}</span>
    </span>
  );
}
