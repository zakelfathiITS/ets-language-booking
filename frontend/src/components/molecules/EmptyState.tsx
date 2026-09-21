import type { ReactNode } from "react";

import { Heading } from "../atoms/Heading";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
      <Heading level={2}>{title}</Heading>
      {description && <p className="mt-2 max-w-md text-sm text-neutral-600">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
