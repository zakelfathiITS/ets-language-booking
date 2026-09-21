"use client";

import { Button } from "../atoms/Button";

export interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function PaginationControls({ page, totalPages, onPageChange, disabled = false }: PaginationControlsProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4">
      <Button variant="secondary" size="sm" disabled={disabled || page <= 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </Button>
      <p className="text-sm text-neutral-600" aria-live="polite">
        Page <span className="font-medium text-neutral-900">{page}</span> of{" "}
        <span className="font-medium text-neutral-900">{totalPages}</span>
      </p>
      <Button
        variant="secondary"
        size="sm"
        disabled={disabled || page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </nav>
  );
}
