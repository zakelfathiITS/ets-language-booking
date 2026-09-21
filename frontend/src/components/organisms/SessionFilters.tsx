"use client";

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
  return (
    <form
      role="search"
      aria-label="Filter sessions"
      onSubmit={(event) => event.preventDefault()}
      className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-4 sm:flex-row sm:items-end"
    >
      <div className="space-y-1.5 sm:w-64">
        <Label htmlFor="language-filter">Language</Label>
        <Select
          id="language-filter"
          value={language ?? ""}
          onChange={(event) => onChange({ language: event.target.value || null })}
        >
          <option value="">All languages</option>
          {languages.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </div>
      <div className="sm:pb-2">
        <Checkbox
          label="Only sessions with seats left"
          checked={availableOnly}
          onChange={(event) => onChange({ availableOnly: event.target.checked })}
        />
      </div>
    </form>
  );
}
