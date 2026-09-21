import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Navbar } from "@/components/organisms/Navbar";

const links = [
  { href: "/sessions", label: "Test sessions" },
  { href: "/reservations", label: "My reservations" },
];

describe("Navbar", () => {
  it("highlights the current section", () => {
    render(<Navbar links={links} currentPath="/reservations" userName="Camille" onLogout={jest.fn()} />);

    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { name: "My reservations" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Test sessions" })).not.toHaveAttribute("aria-current");
  });

  it("signs out", async () => {
    const onLogout = jest.fn();
    render(<Navbar links={links} currentPath="/sessions" userName="Camille" onLogout={onLogout} />);

    await userEvent.click(screen.getAllByRole("button", { name: "Sign out" })[0]);

    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("opens and closes the mobile menu", async () => {
    render(<Navbar links={links} currentPath="/sessions" userName="Camille" onLogout={jest.fn()} />);
    const toggle = screen.getByRole("button", { name: "Menu" });

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("navigation", { name: "Main" })).toHaveLength(2);

    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.getAllByRole("navigation", { name: "Main" })).toHaveLength(1);
  });
});
