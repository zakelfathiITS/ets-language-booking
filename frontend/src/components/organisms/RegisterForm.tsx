"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { PASSWORD_MIN_LENGTH, type RegisterValues, registerSchema } from "@/lib/validation/authSchemas";
import type { ServerFormErrors } from "@/lib/validation/serverErrors";

import { Button } from "../atoms/Button";
import { Alert } from "../molecules/Alert";
import { FormField } from "../molecules/FormField";

import { useFieldErrorText } from "./useFieldErrorText";
import { useServerFieldErrors } from "./useServerFieldErrors";

const FIELDS = ["name", "email", "password"] as const;

export interface RegisterFormProps {
  onSubmit: (values: RegisterValues) => void | Promise<void>;
  isSubmitting: boolean;
  serverErrors?: ServerFormErrors | null;
}

export function RegisterForm({ onSubmit, isSubmitting, serverErrors }: RegisterFormProps) {
  const t = useTranslations("auth");
  const errorText = useFieldErrorText();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  useServerFieldErrors(serverErrors, setError, FIELDS);

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverErrors?.message && <Alert tone="error">{serverErrors.message}</Alert>}
      <FormField label={t("fullName")} autoComplete="name" error={errorText(errors.name)} {...register("name")} />
      <FormField label={t("email")} type="email" autoComplete="email" error={errorText(errors.email)} {...register("email")} />
      <FormField
        label={t("password")}
        type="password"
        autoComplete="new-password"
        hint={t("passwordHint", { min: PASSWORD_MIN_LENGTH })}
        error={errorText(errors.password)}
        {...register("password")}
      />
      <FormField
        label={t("confirmPassword")}
        type="password"
        autoComplete="new-password"
        error={errorText(errors.confirmPassword)}
        {...register("confirmPassword")}
      />
      <Button type="submit" fullWidth isLoading={isSubmitting}>
        {t("register.submit")}
      </Button>
    </form>
  );
}
