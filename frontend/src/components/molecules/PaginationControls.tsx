"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
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
    <nav
      aria-label={t("label")}
      className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface px-3 py-2 shadow-card"
    >
      <Button variant="ghost" size="sm" disabled={disabled || page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        {t("previous")}
      </Button>
      <p className="text-sm text-ink-muted" aria-live="polite">
        {t.rich("status", {
          page,
          totalPages,
          strong: (chunks) => <span className="font-semibold text-ink">{chunks}</span>,
        })}
      </p>
      <Button variant="ghost" size="sm" disabled={disabled || page >= totalPages} onClick={() => onPageChange(page + 1)}>
        {t("next")}
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
      </Button>
    </nav>
  );
}
