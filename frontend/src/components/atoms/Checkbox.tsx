import { type InputHTMLAttributes, useId } from "react";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export function Checkbox({ label, id, ...props }: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex items-center gap-2">
      <input
        id={inputId}
        type="checkbox"
        className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-2 focus:ring-brand-200"
        {...props}
      />
      <label htmlFor={inputId} className="text-sm text-neutral-800">
        {label}
      </label>
    </div>
  );
}
