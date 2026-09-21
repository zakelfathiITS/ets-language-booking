"use client";

import { RequireAdmin } from "@/features/auth/guards";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <RequireAdmin>{children}</RequireAdmin>;
}
