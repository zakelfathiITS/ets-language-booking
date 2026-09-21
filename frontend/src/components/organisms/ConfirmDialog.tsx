"use client";

import { CircleHelp, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useId, useRef } from "react";

import { cn } from "@/lib/cn";

import { Button } from "../atoms/Button";
import { Heading } from "../atoms/Heading";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal confirmation. Focus starts on the safe choice (cancel), Escape
 * closes it, and focus returns to where it was once the dialog closes.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = "danger",
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const t = useTranslations("common");
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const Icon = tone === "danger" ? TriangleAlert : CircleHelp;

  useEffect(() => {
    if (!open) {
      return;
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 backdrop-blur-sm motion-safe:animate-fade sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-raised motion-safe:animate-pop"
      >
        <div className="flex gap-4">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              tone === "danger"
                ? "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400"
                : "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300",
            )}
          >
            <Icon aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <Heading level={2}>
              <span id={titleId}>{title}</span>
            </Heading>
            <div id={descriptionId} className="mt-1.5 text-sm text-ink-muted">
              {description}
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button ref={cancelRef} variant="secondary" onClick={onCancel} disabled={isConfirming}>
            {cancelLabel ?? t("keepIt")}
          </Button>
          <Button variant={tone} onClick={onConfirm} isLoading={isConfirming}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
