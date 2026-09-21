"use client";

import { useEffect } from "react";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import type { ServerFormErrors } from "@/lib/validation/serverErrors";

/**
 * Shows the API's field errors next to the matching inputs, exactly like the
 * client-side validation messages.
 */
export function useServerFieldErrors<T extends FieldValues>(
  serverErrors: ServerFormErrors | null | undefined,
  setError: UseFormSetError<T>,
  knownFields: ReadonlyArray<Path<T>>,
): void {
  useEffect(() => {
    for (const [field, message] of Object.entries(serverErrors?.fields ?? {})) {
      if ((knownFields as readonly string[]).includes(field)) {
        setError(field as Path<T>, { type: "server", message }, { shouldFocus: true });
      }
    }
  }, [serverErrors, setError, knownFields]);
}
