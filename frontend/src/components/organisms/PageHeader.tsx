import type { ReactNode } from "react";

import { Heading } from "../atoms/Heading";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

/** Title block at the top of each screen. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 motion-safe:animate-rise sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Heading level={1}>{title}</Heading>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-ink-muted sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
