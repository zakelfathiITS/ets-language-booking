"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { PASSWORD_MIN_LENGTH, type RegisterValues, registerSchema } from "@/lib/validation/authSchemas";
import type { ServerFormErrors } from "@/lib/validation/serverErrors";

import { Button } from "../atoms/Button";
import { Alert } from "../molecules/Alert";
import { FormField } from "../molecules/FormField";

import { useServerFieldErrors } from "./useServerFieldErrors";

const FIELDS = ["name", "email", "password"] as const;

export interface RegisterFormProps {
  onSubmit: (values: RegisterValues) => void | Promise<void>;
  isSubmitting: boolean;
  serverErrors?: ServerFormErrors | null;
}

export function RegisterForm({ onSubmit, isSubmitting, serverErrors }: RegisterFormProps) {
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
      <FormField label="Full name" autoComplete="name" error={errors.name?.message} {...register("name")} />
      <FormField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <FormField
        label="Password"
        type="password"
        autoComplete="new-password"
        hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
        error={errors.password?.message}
        {...register("password")}
      />
      <FormField
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      <Button type="submit" fullWidth isLoading={isSubmitting}>
        Create my account
      </Button>
    </form>
  );
}
