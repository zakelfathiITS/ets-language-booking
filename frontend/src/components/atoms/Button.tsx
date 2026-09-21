import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

import { Spinner } from "./Spinner";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export const buttonVariants = {
  primary: "bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus-visible:outline-brand-600",
  secondary:
    "border border-neutral-300 bg-white text-neutral-800 shadow-sm hover:bg-neutral-50 focus-visible:outline-brand-600",
  ghost: "text-neutral-700 hover:bg-neutral-100 focus-visible:outline-brand-600",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:outline-red-600",
} as const;

export const buttonSizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;

export function buttonClasses(variant: ButtonVariant, size: ButtonSize, fullWidth = false, className?: string): string {
  return cn(base, buttonVariants[variant], buttonSizes[size], fullWidth && "w-full", className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  fullWidth = false,
  disabled,
  type = "button",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={buttonClasses(variant, size, fullWidth, className)}
      {...props}
    >
      {isLoading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
