import { Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Heading } from "../atoms/Heading";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
}

export function EmptyState({ title, description, action, icon: Icon = Inbox }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center motion-safe:animate-fade">
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-8 ring-brand-50/50 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/5">
        <Icon aria-hidden="true" className="h-6 w-6" />
      </span>
      <Heading level={2}>{title}</Heading>
      {description && <p className="mt-2 max-w-md text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
