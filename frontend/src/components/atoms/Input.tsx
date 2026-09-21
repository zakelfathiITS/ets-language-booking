import type { InputHTMLAttributes, Ref } from "react";

import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  ref?: Ref<HTMLInputElement>;
}

export function Input({ invalid = false, className, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        "block h-10 w-full rounded-lg border bg-surface px-3 text-sm text-ink shadow-sm transition-colors placeholder:text-ink-subtle",
        "focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-subtle",
        invalid
          ? "border-red-500 focus:border-red-500 focus:ring-red-500/15"
          : "border-line-strong hover:border-brand-300 focus:border-brand-500 focus:ring-brand-500/15",
        className,
      )}
      {...props}
    />
  );
}
