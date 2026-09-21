"use client";

import { usePathname } from "next/navigation";

import { Navbar } from "@/components/organisms/Navbar";
import { AppTemplate } from "@/components/templates/AppTemplate";
import { RequireAuth } from "@/features/auth/guards";
import { useAuth } from "@/features/auth/useAuth";
import { navigationLinks } from "@/features/navigation/navigationLinks";

export default function SignedInLayout({ children }: LayoutProps<"/">) {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();

  return (
    <RequireAuth>
      <AppTemplate
        header={
          <Navbar
            links={navigationLinks(isAdmin)}
            currentPath={pathname}
            userName={user?.name ?? null}
            onLogout={logout}
          />
        }
      >
        {children}
      </AppTemplate>
    </RequireAuth>
  );
}
