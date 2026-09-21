import { type InputHTMLAttributes, useId } from "react";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export function Checkbox({ label, id, ...props }: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex items-center gap-2.5">
      <input
        id={inputId}
        type="checkbox"
        className="h-4 w-4 cursor-pointer rounded border-line-strong accent-brand-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
        {...props}
      />
      <label htmlFor={inputId} className="cursor-pointer text-sm text-ink">
        {label}
      </label>
    </div>
  );
}
