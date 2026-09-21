"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { CAPACITY_MAX, CAPACITY_MIN, sessionSchema, type SessionValues } from "@/lib/validation/sessionSchema";
import type { ServerFormErrors } from "@/lib/validation/serverErrors";

import { Button } from "../atoms/Button";
import { ButtonLink } from "../atoms/ButtonLink";
import { Alert } from "../molecules/Alert";
import { FormField } from "../molecules/FormField";

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
      <FormField label="Language" placeholder="English" error={errors.language?.message} {...register("language")} />
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Date" type="date" error={errors.date?.message} {...register("date")} />
        <FormField
          label="Time"
          type="time"
          hint={`Local time (${timezone}).`}
          error={errors.time?.message}
          {...register("time")}
        />
      </div>
      <FormField
        label="Location"
        placeholder="Paris – Test Center La Défense"
        error={errors.location?.message}
        {...register("location")}
      />
      <FormField
        label="Number of seats"
        type="number"
        inputMode="numeric"
        min={CAPACITY_MIN}
        max={CAPACITY_MAX}
        error={errors.capacity?.message}
        {...register("capacity", { valueAsNumber: true })}
      />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <ButtonLink href={cancelHref} variant="secondary">
          Cancel
        </ButtonLink>
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
