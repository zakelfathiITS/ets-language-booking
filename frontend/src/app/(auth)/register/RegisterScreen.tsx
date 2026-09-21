"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { RegisterForm } from "@/components/organisms/RegisterForm";
import { AuthTemplate } from "@/components/templates/AuthTemplate";
import { useLoginMutation, useRegisterMutation } from "@/features/auth/authApi";
import { LocaleSwitcher } from "@/features/i18n/LocaleSwitcher";
import { useApiErrors } from "@/features/i18n/useApiErrors";
import type { RegisterValues } from "@/lib/validation/authSchemas";

/** Creates the account, then signs the user in straight away. */
export function RegisterScreen() {
  const t = useTranslations("auth.register");
  const [registerUser, registration] = useRegisterMutation();
  const [login, signIn] = useLoginMutation();
  const { formErrorsOf } = useApiErrors();

  const error = registration.error ?? signIn.error;
  const serverErrors = useMemo(() => (error ? formErrorsOf(error) : null), [error, formErrorsOf]);

  async function onSubmit({ name, email, password }: RegisterValues) {
    const result = await registerUser({ name, email, password });
    if (!result.error) {
      await login({ email, password });
    }
  }

  return (
    <AuthTemplate
      title={t("title")}
      subtitle={t("subtitle")}
      toolbar={<LocaleSwitcher />}
      footer={
        <>
          {t("alreadyRegistered")}{" "}
          <Link href="/login" className="font-medium text-brand-700 hover:underline">
            {t("signIn")}
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
