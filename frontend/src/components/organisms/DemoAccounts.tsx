"use client";

import { LogIn, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "../atoms/Button";

export interface DemoAccount {
  label: string;
  email: string;
  password: string;
}

export interface DemoAccountsProps {
  accounts: DemoAccount[];
  onPick: (account: DemoAccount) => void;
  disabled?: boolean;
}

/** One-click sign-in with the seeded demo accounts. */
export function DemoAccounts({ accounts, onPick, disabled = false }: DemoAccountsProps) {
  const t = useTranslations("auth.demo");

  return (
    <section aria-labelledby="demo-accounts" className="rounded-xl border border-dashed border-line-strong bg-surface-muted/60 p-4">
      <h2 id="demo-accounts" className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Sparkles aria-hidden="true" className="h-4 w-4 text-brand-600 dark:text-brand-300" />
        {t("title")}
      </h2>
      <p className="mt-1 text-xs text-ink-muted">{t("description")}</p>
      <div className="mt-3 grid gap-2">
        {accounts.map((account) => (
          <Button key={account.email} variant="secondary" size="sm" fullWidth disabled={disabled} onClick={() => onPick(account)}>
            <LogIn aria-hidden="true" className="h-3.5 w-3.5" />
            {account.label}
          </Button>
        ))}
      </div>
    </section>
  );
}
