import type { DemoAccount } from "@/components/organisms/DemoAccounts";

/** Accounts created by the backend seed command (bin/console app:seed). */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  { label: "Sign in as a candidate", email: "candidate@ets.test", password: "Candidate123!" },
  { label: "Sign in as an administrator", email: "admin@ets.test", password: "Admin123!" },
];
