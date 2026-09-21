/** Destinations of the main navigation; labels are translation keys ("nav.*"). */
export interface NavigationLink {
  href: string;
  labelKey: "sessions" | "reservations" | "account" | "admin";
}

const USER_LINKS: NavigationLink[] = [
  { href: "/sessions", labelKey: "sessions" },
  { href: "/reservations", labelKey: "reservations" },
  { href: "/account", labelKey: "account" },
];

const ADMIN_LINKS: NavigationLink[] = [{ href: "/admin/sessions", labelKey: "admin" }];

export function navigationLinks(isAdmin: boolean): NavigationLink[] {
  return isAdmin ? [...USER_LINKS, ...ADMIN_LINKS] : USER_LINKS;
}
