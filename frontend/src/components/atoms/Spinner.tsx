import { cn } from "@/lib/cn";

const sizes = { sm: "h-4 w-4 border-2", md: "h-6 w-6 border-2", lg: "h-10 w-10 border-[3px]" } as const;

export interface SpinnerProps {
  size?: keyof typeof sizes;
  className?: string;
}

/** Decorative: announce the loading state with text next to it. */
export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block animate-spin rounded-full border-current border-r-transparent", sizes[size], className)}
    />
  );
}
