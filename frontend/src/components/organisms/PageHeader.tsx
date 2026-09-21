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
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Heading level={1}>{title}</Heading>
        {description && <p className="mt-1 text-sm text-neutral-600">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
