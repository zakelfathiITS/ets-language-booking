import { cn } from "@/lib/cn";

/** Placeholder shape displayed while content loads (shimmers unless motion is reduced). */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-md bg-[linear-gradient(90deg,var(--surface-muted)_0%,var(--line)_50%,var(--surface-muted)_100%)] bg-[length:200%_100%] motion-safe:animate-shimmer",
        className,
      )}
    />
  );
}
