"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";
import type { FieldError } from "react-hook-form";

/**
 * Client-side rules carry translation keys ("validation.*"); errors set from
 * the API arrive already translated and are displayed as they are.
 */
export function useFieldErrorText() {
  const t = useTranslations();

  return useCallback(
    (error: FieldError | undefined): string | undefined => {
      if (!error?.message) {
        return undefined;
      }

      return error.type === "server" ? error.message : t(error.message);
    },
    [t],
  );
}
