"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

import { isApiError } from "@/services/http/apiError";

import { type ErrorCodeTranslator, toServerFormErrors } from "../forms/toServerFormErrors";

/**
 * Messages for API errors in the current language, looked up by their stable
 * code (never from the English "detail" of the API).
 */
export function useApiErrors() {
  const t = useTranslations("errors");

  const translate = useCallback<ErrorCodeTranslator>((code) => (t.has(code) ? t(code) : null), [t]);

  const messageOf = useCallback(
    (error: unknown): string => {
      if (isApiError(error)) {
        return translate(error.code) ?? error.message;
      }

      return t("generic");
    },
    [t, translate],
  );

  const formErrorsOf = useCallback((error: unknown) => toServerFormErrors(error, translate), [translate]);

  return { messageOf, formErrorsOf };
}
