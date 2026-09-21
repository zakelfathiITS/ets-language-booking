import { useId } from "react";

import { cn } from "@/lib/cn";

/** Brand mark: a speech bubble (languages) holding a check (booked). */
function LogoMark({ className }: { className?: string }) {
  // One gradient id per instance: a shared id breaks when its first owner is hidden.
  const gradientId = useId();

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("h-8 w-8 shrink-0", className)}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6f8dfc" />
          <stop offset="1" stopColor="#2f3ad0" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      <path
        d="M9 10.5A2.5 2.5 0 0 1 11.5 8h9A2.5 2.5 0 0 1 23 10.5v7a2.5 2.5 0 0 1-2.5 2.5h-5l-4.2 3.3a.6.6 0 0 1-1-.5V20A2.5 2.5 0 0 1 9 17.5Z"
        fill="#fff"
        fillOpacity="0.95"
      />
      <path d="m13 14.2 2.1 2.1 4-4.3" fill="none" stroke="#3a4aeb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export interface LogoProps {
  brand: string;
  product: string;
  /** White text, for coloured backgrounds. */
  inverted?: boolean;
  className?: string;
}

export function Logo({ brand, product, inverted = false, className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={cn(inverted && "ring-1 ring-white/30 rounded-[9px]")} />
      <span className={cn("text-base font-semibold tracking-tight", inverted ? "text-white" : "text-ink")}>
        {brand} <span className={cn("font-medium", inverted ? "text-white/75" : "text-ink-muted")}>{product}</span>
      </span>
    </span>
  );
}
