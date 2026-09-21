"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

import { Heading } from "@/components/atoms/Heading";
import { AccountForm } from "@/components/organisms/AccountForm";
import { PageHeader } from "@/components/organisms/PageHeader";
import { ProfileSummary } from "@/components/organisms/ProfileSummary";
import { useGetMeQuery, useUpdateMeMutation } from "@/features/auth/authApi";
import { useAuth } from "@/features/auth/useAuth";
import { useApiErrors } from "@/features/i18n/useApiErrors";
import { formatLongDate } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locales";

export function AccountScreen() {
  const t = useTranslations("account");
  const locale = useLocale() as Locale;
  const { user, isAdmin } = useAuth();
  // Refreshes the stored profile, in case it changed from another device.
  useGetMeQuery();
  const [updateMe, { isLoading, error, isSuccess }] = useUpdateMeMutation();
  const { formErrorsOf } = useApiErrors();

  const serverErrors = useMemo(() => (error ? formErrorsOf(error) : null), [error, formErrorsOf]);
  const initialValues = useMemo(() => ({ name: user?.name ?? "", email: user?.email ?? "" }), [user?.name, user?.email]);

  if (!user) {
    return null;
  }

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="grid gap-6 lg:grid-cols-3">
        <ProfileSummary
          name={user.name}
          email={user.email}
          isAdmin={isAdmin}
          memberSince={formatLongDate(user.createdAt, locale)}
        />
        <section
          aria-labelledby="personal-information"
          className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm lg:col-span-2"
        >
          <Heading level={2}>
            <span id="personal-information">{t("personalInformation")}</span>
          </Heading>
          <div className="mt-4">
            <AccountForm
              initialValues={initialValues}
              onSubmit={(values) => {
                void updateMe(values);
              }}
              isSubmitting={isLoading}
              serverErrors={serverErrors}
              successMessage={isSuccess ? t("updated") : null}
            />
          </div>
        </section>
      </div>
    </>
  );
}
