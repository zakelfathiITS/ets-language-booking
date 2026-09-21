import type { NavLink } from "@/components/organisms/Navbar";

const USER_LINKS: NavLink[] = [
  { href: "/sessions", label: "Test sessions" },
  { href: "/reservations", label: "My reservations" },
  { href: "/account", label: "My account" },
];

const ADMIN_LINKS: NavLink[] = [{ href: "/admin/sessions", label: "Administration" }];

export function navigationLinks(isAdmin: boolean): NavLink[] {
  return isAdmin ? [...USER_LINKS, ...ADMIN_LINKS] : USER_LINKS;
}
