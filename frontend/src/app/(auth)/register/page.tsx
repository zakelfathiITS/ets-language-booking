import type { Metadata } from "next";

import { RegisterScreen } from "./RegisterScreen";

export const metadata: Metadata = { title: "Create an account" };

export default function RegisterPage() {
  return <RegisterScreen />;
}
