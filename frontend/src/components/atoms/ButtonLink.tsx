import Link, { type LinkProps } from "next/link";
import type { ReactNode } from "react";

import { type ButtonSize, type ButtonVariant, buttonClasses } from "./Button";

export interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}

/** A navigation link that looks like a button. */
export function ButtonLink({ variant = "primary", size = "md", className, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, false, className)} {...props}>
      {children}
    </Link>
  );
}
