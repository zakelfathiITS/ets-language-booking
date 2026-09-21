"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { Alert } from "@/components/molecules/Alert";
import { DemoAccounts } from "@/components/organisms/DemoAccounts";
import { LoginForm } from "@/components/organisms/LoginForm";
import { AuthTemplate } from "@/components/templates/AuthTemplate";
import { useLoginMutation } from "@/features/auth/authApi";
import { DEMO_ACCOUNTS } from "@/features/auth/demoAccounts";
import { useAuth } from "@/features/auth/useAuth";
import { LocaleSwitcher } from "@/features/i18n/LocaleSwitcher";
import { useApiErrors } from "@/features/i18n/useApiErrors";
import { SHOW_DEMO_ACCOUNTS } from "@/lib/env";

/** On success, the (auth) layout redirects to ?next= or to the reservations. */
export function LoginScreen() {
  const t = useTranslations("auth");
  const [login, { isLoading, error }] = useLoginMutation();
  const { sessionEnd } = useAuth();
  const { formErrorsOf } = useApiErrors();
  const serverErrors = useMemo(() => (error ? formErrorsOf(error) : null), [error, formErrorsOf]);
  const demoAccounts = DEMO_ACCOUNTS.map(({ labelKey, email, password }) => ({ label: t(`demo.${labelKey}`), email, password }));

  return (
    <AuthTemplate
      title={t("signIn.title")}
      subtitle={t("signIn.subtitle")}
      toolbar={<LocaleSwitcher />}
      footer={
        <>
          {t("signIn.noAccount")}{" "}
          <Link href="/register" className="font-medium text-brand-700 hover:underline">
            {t("signIn.createAccount")}
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        {sessionEnd === "expiry" && <Alert tone="info">{t("signIn.sessionExpired")}</Alert>}
        <LoginForm
          onSubmit={(values) => {
            void login(values);
          }}
          isSubmitting={isLoading}
          serverErrors={serverErrors}
        />
        {SHOW_DEMO_ACCOUNTS && (
          <DemoAccounts
            accounts={demoAccounts}
            disabled={isLoading}
            onPick={({ email, password }) => {
              void login({ email, password });
            }}
          />
        )}
      </div>
    </AuthTemplate>
  );
}
