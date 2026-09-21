import { cn } from "@/lib/cn";

/** Placeholder shape displayed while content loads. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-neutral-200", className)} />;
}
