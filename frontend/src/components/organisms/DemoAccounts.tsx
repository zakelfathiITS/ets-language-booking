"use client";

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
  return (
    <section aria-labelledby="demo-accounts" className="rounded-lg border border-dashed border-neutral-300 p-4">
      <h2 id="demo-accounts" className="text-sm font-medium text-neutral-800">
        Demo accounts
      </h2>
      <p className="mt-1 text-xs text-neutral-500">Explore the application without creating an account.</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {accounts.map((account) => (
          <Button key={account.email} variant="secondary" size="sm" fullWidth disabled={disabled} onClick={() => onPick(account)}>
            {account.label}
          </Button>
        ))}
      </div>
    </section>
  );
}
