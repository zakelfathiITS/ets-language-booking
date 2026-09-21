"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { LoadingScreen } from "@/components/molecules/LoadingScreen";
import { HOME_PATH, LOGIN_PATH } from "@/features/auth/guards";
import { useAuth } from "@/features/auth/useAuth";

/** Entry point: signed-in users land on their reservations, others on the login page. */
export default function HomePage() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status !== "unknown") {
      router.replace(status === "authenticated" ? HOME_PATH : LOGIN_PATH);
    }
  }, [status, router]);

  return <LoadingScreen label="Loading…" />;
}
