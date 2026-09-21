"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { type ProfileValues, profileSchema } from "@/lib/validation/authSchemas";
import type { ServerFormErrors } from "@/lib/validation/serverErrors";

import { Button } from "../atoms/Button";
import { Alert } from "../molecules/Alert";
import { FormField } from "../molecules/FormField";

import { useServerFieldErrors } from "./useServerFieldErrors";

const FIELDS = ["name", "email"] as const;

export interface AccountFormProps {
  initialValues: ProfileValues;
  onSubmit: (values: ProfileValues) => void | Promise<void>;
  isSubmitting: boolean;
  serverErrors?: ServerFormErrors | null;
  successMessage?: string | null;
}

export function AccountForm({ initialValues, onSubmit, isSubmitting, serverErrors, successMessage }: AccountFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: initialValues });

  // Once saved, the new values become the reference ("no unsaved changes").
  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  useServerFieldErrors(serverErrors, setError, FIELDS);

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {successMessage && !isDirty && <Alert tone="success">{successMessage}</Alert>}
      {serverErrors?.message && <Alert tone="error">{serverErrors.message}</Alert>}
      <FormField label="Full name" autoComplete="name" error={errors.name?.message} {...register("name")} />
      <FormField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting} disabled={!isDirty}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
