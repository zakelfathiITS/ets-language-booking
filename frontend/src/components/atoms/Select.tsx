import type { Ref, SelectHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  ref?: Ref<HTMLSelectElement>;
}

export function Select({ className, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "block h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink shadow-sm transition-colors",
        "hover:border-brand-300 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15",
        className,
      )}
      {...props}
    />
  );
}
