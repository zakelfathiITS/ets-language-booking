import type { ButtonHTMLAttributes, Ref } from "react";

import { cn } from "@/lib/cn";

import { Spinner } from "./Spinner";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 select-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55";

const buttonVariants = {
  primary:
    "bg-brand-600 text-white shadow-sm shadow-brand-600/25 hover:bg-brand-700 hover:shadow-md hover:shadow-brand-600/25 focus-visible:outline-brand-500",
  secondary:
    "border border-line-strong bg-surface text-ink shadow-sm hover:border-brand-300 hover:bg-surface-muted focus-visible:outline-brand-500",
  ghost: "text-ink-muted hover:bg-surface-muted hover:text-ink focus-visible:outline-brand-500",
  danger: "bg-red-600 text-white shadow-sm shadow-red-600/25 hover:bg-red-700 focus-visible:outline-red-500",
  dangerGhost:
    "text-red-600 hover:bg-red-50 hover:text-red-700 focus-visible:outline-red-500 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300",
} as const;

const buttonSizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  /** Square, for a lone icon: give the button an aria-label. */
  icon: "h-9 w-9 text-sm",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;

export function buttonClasses(variant: ButtonVariant, size: ButtonSize, fullWidth = false, className?: string): string {
  return cn(base, buttonVariants[variant], buttonSizes[size], fullWidth && "w-full", className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>;
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
