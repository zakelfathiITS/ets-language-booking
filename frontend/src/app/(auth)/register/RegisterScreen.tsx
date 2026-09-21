"use client";

import Link from "next/link";
import { useMemo } from "react";

import { RegisterForm } from "@/components/organisms/RegisterForm";
import { AuthTemplate } from "@/components/templates/AuthTemplate";
import { useLoginMutation, useRegisterMutation } from "@/features/auth/authApi";
import { toServerFormErrors } from "@/features/forms/toServerFormErrors";
import type { RegisterValues } from "@/lib/validation/authSchemas";

/** Creates the account, then signs the user in straight away. */
export function RegisterScreen() {
  const [registerUser, registration] = useRegisterMutation();
  const [login, signIn] = useLoginMutation();

  const error = registration.error ?? signIn.error;
  const serverErrors = useMemo(() => (error ? toServerFormErrors(error) : null), [error]);

  async function onSubmit({ name, email, password }: RegisterValues) {
    const result = await registerUser({ name, email, password });
    if (!result.error) {
      await login({ email, password });
    }
  }

  return (
    <AuthTemplate
      title="Create your account"
      subtitle="Book language test sessions in a few clicks."
      footer={
        <>
          Already registered?{" "}
          <Link href="/login" className="font-medium text-brand-700 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm
        onSubmit={onSubmit}
        isSubmitting={registration.isLoading || signIn.isLoading}
        serverErrors={serverErrors}
      />
    </AuthTemplate>
  );
}
