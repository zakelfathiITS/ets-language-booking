"use client";

import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";

import { cn } from "@/lib/cn";

import { Avatar } from "../atoms/Avatar";
import { Button } from "../atoms/Button";
import { Logo } from "../atoms/Logo";

export interface NavLink {
  href: string;
  label: string;
}

export interface NavbarProps {
  links: NavLink[];
  currentPath: string;
  userName: string | null;
  onLogout: () => void;
  /** Extra controls next to the user name, e.g. the language switcher. */
  toolbar?: ReactNode;
}

function isActive(href: string, currentPath: string): boolean {
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

/** Sticky, translucent header; the links fold into a menu on small screens. */
export function Navbar({ links, currentPath, userName, onLogout, toolbar }: NavbarProps) {
  const t = useTranslations();
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClasses = (href: string) =>
    cn(
      "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand-500",
      isActive(href, currentPath)
        ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
        : "text-ink-muted hover:bg-surface-muted hover:text-ink",
    );

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-surface/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/sessions"
          className="flex items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
        >
          <Logo brand={t("common.brand")} product={t("common.product")} />
        </Link>

        <nav aria-label={t("nav.label")} className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={linkClasses(link.href)}
              aria-current={isActive(link.href, currentPath) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {toolbar}
          {userName && (
            <span className="ml-1 flex items-center gap-2 border-l border-line pl-3 text-sm font-medium text-ink">
              <Avatar name={userName} />
              <span className="max-w-36 truncate">{userName}</span>
            </span>
          )}
          <Button variant="ghost" size="icon" onClick={onLogout} aria-label={t("nav.signOut")} title={t("nav.signOut")}>
            <LogOut aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={menuOpen ? t("nav.close") : t("nav.menu")}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
        </Button>
      </div>

      {menuOpen && (
        <nav
          id="mobile-menu"
          aria-label={t("nav.label")}
          className="space-y-1 border-t border-line px-4 py-3 motion-safe:animate-fade md:hidden"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn("block rounded-lg", linkClasses(link.href))}
              aria-current={isActive(link.href, currentPath) ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
            {userName && (
              <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-ink">
                <Avatar name={userName} />
                <span className="truncate">{userName}</span>
              </span>
            )}
            <div className="flex items-center gap-2">
              {toolbar}
              <Button variant="secondary" size="sm" onClick={onLogout}>
                <LogOut aria-hidden="true" className="h-4 w-4" />
                {t("nav.signOut")}
              </Button>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
