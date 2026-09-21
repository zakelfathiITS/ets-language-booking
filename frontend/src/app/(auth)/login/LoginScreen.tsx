"use client";

import Link from "next/link";
import { useMemo } from "react";

import { Alert } from "@/components/molecules/Alert";
import { DemoAccounts } from "@/components/organisms/DemoAccounts";
import { LoginForm } from "@/components/organisms/LoginForm";
import { AuthTemplate } from "@/components/templates/AuthTemplate";
import { useLoginMutation } from "@/features/auth/authApi";
import { DEMO_ACCOUNTS } from "@/features/auth/demoAccounts";
import { useAuth } from "@/features/auth/useAuth";
import { toServerFormErrors } from "@/features/forms/toServerFormErrors";
import { SHOW_DEMO_ACCOUNTS } from "@/lib/env";

/** On success, the (auth) layout redirects to ?next= or to the reservations. */
export function LoginScreen() {
  const [login, { isLoading, error }] = useLoginMutation();
  const { sessionEnd } = useAuth();
  const serverErrors = useMemo(() => (error ? toServerFormErrors(error) : null), [error]);

  return (
    <AuthTemplate
      title="Sign in"
      subtitle="Access your language test reservations."
      footer={
        <>
          No account yet?{" "}
          <Link href="/register" className="font-medium text-brand-700 hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        {sessionEnd === "expiry" && <Alert tone="info">Your session has expired. Please sign in again.</Alert>}
        <LoginForm
          onSubmit={(values) => {
            void login(values);
          }}
          isSubmitting={isLoading}
          serverErrors={serverErrors}
        />
        {SHOW_DEMO_ACCOUNTS && (
          <DemoAccounts
            accounts={DEMO_ACCOUNTS}
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
