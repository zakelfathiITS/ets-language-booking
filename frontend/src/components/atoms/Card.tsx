import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: "div" | "section";
}

/** Rounded surface holding a form or a block of content. */
export function Card({ as: Tag = "div", className, ...props }: CardProps) {
  return <Tag className={cn("rounded-2xl border border-line bg-surface p-6 shadow-card", className)} {...props} />;
}
