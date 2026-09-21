"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { Navbar } from "@/components/organisms/Navbar";
import { AppTemplate } from "@/components/templates/AppTemplate";
import { RequireAuth } from "@/features/auth/guards";
import { useAuth } from "@/features/auth/useAuth";
import { LocaleSwitcher } from "@/features/i18n/LocaleSwitcher";
import { navigationLinks } from "@/features/navigation/navigationLinks";

export default function SignedInLayout({ children }: LayoutProps<"/">) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { user, isAdmin, logout } = useAuth();

  const links = navigationLinks(isAdmin).map(({ href, labelKey }) => ({ href, label: t(labelKey) }));

  return (
    <RequireAuth>
      <AppTemplate
        header={
          <Navbar
            links={links}
            currentPath={pathname}
            userName={user?.name ?? null}
            onLogout={logout}
            toolbar={<LocaleSwitcher />}
          />
        }
      >
        {children}
      </AppTemplate>
    </RequireAuth>
  );
}
