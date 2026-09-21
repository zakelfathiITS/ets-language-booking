"use client";

import { CircleAlert } from "lucide-react";
import { useId } from "react";

import { Input, type InputProps } from "../atoms/Input";
import { Label } from "../atoms/Label";

export interface FormFieldProps extends Omit<InputProps, "invalid"> {
  label: string;
  error?: string;
  hint?: string;
}

/**
 * Label, input, hint and error message, wired together for assistive
 * technologies (aria-invalid, aria-describedby).
 */
export function FormField({ label, error, hint, id, ...inputProps }: FormFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <Input id={inputId} invalid={Boolean(error)} aria-describedby={describedBy} {...inputProps} />
      {error ? (
        <p id={errorId} className="flex items-center gap-1.5 text-sm text-red-600 motion-safe:animate-fade dark:text-red-400">
          <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-sm text-ink-subtle">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
