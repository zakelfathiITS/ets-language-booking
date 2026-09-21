import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

const styles = {
  1: "text-2xl font-semibold tracking-tight text-ink sm:text-3xl",
  2: "text-lg font-semibold tracking-tight text-ink",
  3: "text-base font-semibold text-ink",
} as const;

export function Heading({ level = 1, className, children }: { level?: 1 | 2 | 3; className?: string; children: ReactNode }) {
  const Tag = `h${level}` as const;

  return <Tag className={cn(styles[level], className)}>{children}</Tag>;
}
