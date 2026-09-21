"use client";

import { useMemo } from "react";

import { Heading } from "@/components/atoms/Heading";
import { AccountForm } from "@/components/organisms/AccountForm";
import { PageHeader } from "@/components/organisms/PageHeader";
import { ProfileSummary } from "@/components/organisms/ProfileSummary";
import { useGetMeQuery, useUpdateMeMutation } from "@/features/auth/authApi";
import { useAuth } from "@/features/auth/useAuth";
import { toServerFormErrors } from "@/features/forms/toServerFormErrors";
import { formatLongDate } from "@/lib/format";

export function AccountScreen() {
  const { user, isAdmin } = useAuth();
  // Refreshes the stored profile, in case it changed from another device.
  useGetMeQuery();
  const [updateMe, { isLoading, error, isSuccess }] = useUpdateMeMutation();

  const serverErrors = useMemo(() => (error ? toServerFormErrors(error) : null), [error]);
  const initialValues = useMemo(() => ({ name: user?.name ?? "", email: user?.email ?? "" }), [user?.name, user?.email]);

  if (!user) {
    return null;
  }

  return (
    <>
      <PageHeader title="My account" description="Manage your name and email address." />
      <div className="grid gap-6 lg:grid-cols-3">
        <ProfileSummary
          name={user.name}
          email={user.email}
          isAdmin={isAdmin}
          memberSince={formatLongDate(user.createdAt)}
        />
        <section
          aria-labelledby="personal-information"
          className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm lg:col-span-2"
        >
          <Heading level={2}>
            <span id="personal-information">Personal information</span>
          </Heading>
          <div className="mt-4">
            <AccountForm
              initialValues={initialValues}
              onSubmit={(values) => {
                void updateMe(values);
              }}
              isSubmitting={isLoading}
              serverErrors={serverErrors}
              successMessage={isSuccess ? "Your account has been updated." : null}
            />
          </div>
        </section>
      </div>
    </>
  );
}
