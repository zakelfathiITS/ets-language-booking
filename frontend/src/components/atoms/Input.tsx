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
        "block w-full rounded-md border bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400",
        "focus:outline-none focus:ring-2 disabled:bg-neutral-100 disabled:text-neutral-500",
        invalid
          ? "border-red-500 focus:border-red-500 focus:ring-red-200"
          : "border-neutral-300 focus:border-brand-500 focus:ring-brand-200",
        className,
      )}
      {...props}
    />
  );
}
