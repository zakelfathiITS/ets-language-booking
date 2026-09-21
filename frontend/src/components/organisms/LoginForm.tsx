"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { type LoginValues, loginSchema } from "@/lib/validation/authSchemas";
import type { ServerFormErrors } from "@/lib/validation/serverErrors";

import { Button } from "../atoms/Button";
import { Alert } from "../molecules/Alert";
import { FormField } from "../molecules/FormField";

import { useFieldErrorText } from "./useFieldErrorText";
import { useServerFieldErrors } from "./useServerFieldErrors";

const FIELDS = ["email", "password"] as const;

export interface LoginFormProps {
  onSubmit: (values: LoginValues) => void | Promise<void>;
  isSubmitting: boolean;
  serverErrors?: ServerFormErrors | null;
}

export function LoginForm({ onSubmit, isSubmitting, serverErrors }: LoginFormProps) {
  const t = useTranslations("auth");
  const errorText = useFieldErrorText();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  useServerFieldErrors(serverErrors, setError, FIELDS);

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverErrors?.message && <Alert tone="error">{serverErrors.message}</Alert>}
      <FormField label={t("email")} type="email" autoComplete="username" error={errorText(errors.email)} {...register("email")} />
      <FormField
        label={t("password")}
        type="password"
        autoComplete="current-password"
        error={errorText(errors.password)}
        {...register("password")}
      />
      <Button type="submit" fullWidth isLoading={isSubmitting}>
        {t("signIn.submit")}
      </Button>
    </form>
  );
}
