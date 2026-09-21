import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

const tones = {
  info: "border-brand-200 bg-brand-50 text-brand-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
} as const;

export interface AlertProps {
  tone?: keyof typeof tones;
  title?: string;
  children: ReactNode;
}

/** Errors are announced immediately (role="alert"), other messages politely. */
export function Alert({ tone = "info", title, children }: AlertProps) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-md border px-4 py-3 text-sm", tones[tone])}>
      {title && <p className="font-medium">{title}</p>}
      <div className={cn(title && "mt-1")}>{children}</div>
    </div>
  );
}
