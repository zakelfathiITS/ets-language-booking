/** Accounts created by the backend seed command (bin/console app:seed). */
export interface DemoAccountCredentials {
  labelKey: "candidate" | "admin";
  email: string;
  password: string;
}

export const DEMO_ACCOUNTS: DemoAccountCredentials[] = [
  { labelKey: "candidate", email: "candidate@ets.test", password: "Candidate123!" },
  { labelKey: "admin", email: "admin@ets.test", password: "Admin123!" },
];
