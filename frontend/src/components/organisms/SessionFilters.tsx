"use client";

import { useTranslations } from "next-intl";

import { Checkbox } from "../atoms/Checkbox";
import { Label } from "../atoms/Label";
import { Select } from "../atoms/Select";

export interface SessionFiltersProps {
  languages: string[];
  language: string | null;
  availableOnly: boolean;
  onChange: (patch: { language?: string | null; availableOnly?: boolean }) => void;
}

export function SessionFilters({ languages, language, availableOnly, onChange }: SessionFiltersProps) {
  const t = useTranslations("sessions.filters");

  return (
    <form
      role="search"
      aria-label={t("label")}
      onSubmit={(event) => event.preventDefault()}
      className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-4 sm:flex-row sm:items-end"
    >
      <div className="space-y-1.5 sm:w-64">
        <Label htmlFor="language-filter">{t("language")}</Label>
        <Select
          id="language-filter"
          value={language ?? ""}
          onChange={(event) => onChange({ language: event.target.value || null })}
        >
          <option value="">{t("allLanguages")}</option>
          {languages.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </div>
      <div className="sm:pb-2">
        <Checkbox
          label={t("availableOnly")}
          checked={availableOnly}
          onChange={(event) => onChange({ availableOnly: event.target.checked })}
        />
      </div>
    </form>
  );
}
