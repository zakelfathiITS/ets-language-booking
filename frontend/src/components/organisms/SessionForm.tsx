"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { CAPACITY_MAX, CAPACITY_MIN, sessionSchema, type SessionValues } from "@/lib/validation/sessionSchema";
import type { ServerFormErrors } from "@/lib/validation/serverErrors";

import { Button } from "../atoms/Button";
import { ButtonLink } from "../atoms/ButtonLink";
import { Alert } from "../molecules/Alert";
import { FormField } from "../molecules/FormField";

import { useFieldErrorText } from "./useFieldErrorText";
import { useServerFieldErrors } from "./useServerFieldErrors";

const FIELDS = ["language", "date", "time", "location", "capacity"] as const;

export interface SessionFormProps {
  initialValues?: SessionValues;
  submitLabel: string;
  cancelHref: string;
  timezone: string;
  onSubmit: (values: SessionValues) => void | Promise<void>;
  isSubmitting: boolean;
  serverErrors?: ServerFormErrors | null;
}

const EMPTY: SessionValues = { language: "", date: "", time: "", location: "", capacity: 20 };

export function SessionForm({
  initialValues = EMPTY,
  submitLabel,
  cancelHref,
  timezone,
  onSubmit,
  isSubmitting,
  serverErrors,
}: SessionFormProps) {
  const t = useTranslations();
  const errorText = useFieldErrorText();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SessionValues>({ resolver: zodResolver(sessionSchema), defaultValues: initialValues });

  useServerFieldErrors(serverErrors, setError, FIELDS);

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {serverErrors?.message && <Alert tone="error">{serverErrors.message}</Alert>}
      <FormField
        label={t("admin.form.language")}
        placeholder={t("admin.form.languagePlaceholder")}
        error={errorText(errors.language)}
        {...register("language")}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label={t("admin.form.date")} type="date" error={errorText(errors.date)} {...register("date")} />
        <FormField
          label={t("admin.form.time")}
          type="time"
          hint={t("admin.form.timeHint", { timezone })}
          error={errorText(errors.time)}
          {...register("time")}
        />
      </div>
      <FormField
        label={t("admin.form.location")}
        placeholder={t("admin.form.locationPlaceholder")}
        error={errorText(errors.location)}
        {...register("location")}
      />
      <FormField
        label={t("admin.form.capacity")}
        type="number"
        inputMode="numeric"
        min={CAPACITY_MIN}
        max={CAPACITY_MAX}
        error={errorText(errors.capacity)}
        {...register("capacity", { valueAsNumber: true })}
      />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <ButtonLink href={cancelHref} variant="secondary">
          {t("common.cancel")}
        </ButtonLink>
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
