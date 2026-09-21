"use client";

import { useTranslations } from "next-intl";

import { Button } from "../atoms/Button";

export interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function PaginationControls({ page, totalPages, onPageChange, disabled = false }: PaginationControlsProps) {
  const t = useTranslations("pagination");

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label={t("label")} className="flex items-center justify-between gap-4">
      <Button variant="secondary" size="sm" disabled={disabled || page <= 1} onClick={() => onPageChange(page - 1)}>
        {t("previous")}
      </Button>
      <p className="text-sm text-neutral-600" aria-live="polite">
        {t.rich("status", {
          page,
          totalPages,
          strong: (chunks) => <span className="font-medium text-neutral-900">{chunks}</span>,
        })}
      </p>
      <Button
        variant="secondary"
        size="sm"
        disabled={disabled || page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        {t("next")}
      </Button>
    </nav>
  );
}
