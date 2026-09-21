"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { type LoginValues, loginSchema } from "@/lib/validation/authSchemas";
import type { ServerFormErrors } from "@/lib/validation/serverErrors";

import { Button } from "../atoms/Button";
import { Alert } from "../molecules/Alert";
import { FormField } from "../molecules/FormField";

import { useServerFieldErrors } from "./useServerFieldErrors";

const FIELDS = ["email", "password"] as const;

export interface LoginFormProps {
  onSubmit: (values: LoginValues) => void | Promise<void>;
  isSubmitting: boolean;
  serverErrors?: ServerFormErrors | null;
}

export function LoginForm({ onSubmit, isSubmitting, serverErrors }: LoginFormProps) {
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
      <FormField
        label="Email"
        type="email"
        autoComplete="username"
        error={errors.email?.message}
        {...register("email")}
      />
      <FormField
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Button type="submit" fullWidth isLoading={isSubmitting}>
        Sign in
      </Button>
    </form>
  );
}
