"use client";

import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/cn";

import { Button } from "../atoms/Button";

export interface NavLink {
  href: string;
  label: string;
}

export interface NavbarProps {
  links: NavLink[];
  currentPath: string;
  userName: string | null;
  onLogout: () => void;
}

function isActive(href: string, currentPath: string): boolean {
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export function Navbar({ links, currentPath, userName, onLogout }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClasses = (href: string) =>
    cn(
      "rounded-md px-3 py-2 text-sm font-medium",
      isActive(href, currentPath) ? "bg-brand-50 text-brand-700" : "text-neutral-700 hover:bg-neutral-100",
    );

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/sessions" className="text-base font-semibold text-brand-700">
          ETS <span className="text-neutral-900">Test Booking</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
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

        <div className="hidden items-center gap-3 md:flex">
          {userName && <span className="text-sm text-neutral-600">{userName}</span>}
          <Button variant="secondary" size="sm" onClick={onLogout}>
            Sign out
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? "Close" : "Menu"}
        </Button>
      </div>

      {menuOpen && (
        <nav id="mobile-menu" aria-label="Main" className="space-y-1 border-t border-neutral-200 px-4 py-3 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn("block", linkClasses(link.href))}
              aria-current={isActive(link.href, currentPath) ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
            {userName && <span className="text-sm text-neutral-600">{userName}</span>}
            <Button variant="secondary" size="sm" onClick={onLogout}>
              Sign out
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
