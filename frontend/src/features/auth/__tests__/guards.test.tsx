import { screen, waitFor } from "@testing-library/react";

import { RedirectIfAuthenticated, RequireAdmin, RequireAuth } from "@/features/auth/guards";

import { admin, anonymous, candidate, signedIn } from "../../../../test/fixtures";
import { navigation, router } from "../../../../test/mocks/nextNavigation";
import { renderWithProviders } from "../../../../test/renderWithProviders";

describe("RequireAuth", () => {
  it("waits while the session is being restored", () => {
    renderWithProviders(<RequireAuth>secret</RequireAuth>);

    expect(screen.getByRole("status")).toHaveTextContent("Checking your session");
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("sends anonymous visitors to the login page, remembering where they were going", async () => {
    navigation.pathname = "/reservations";

    renderWithProviders(<RequireAuth>secret</RequireAuth>, { preloadedState: anonymous });

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login?next=%2Freservations"));
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("shows the page to signed-in users", () => {
    renderWithProviders(<RequireAuth>secret</RequireAuth>, { preloadedState: signedIn() });

    expect(screen.getByText("secret")).toBeInTheDocument();
  });
});

describe("RequireAdmin", () => {
  it("shows the page to administrators", () => {
    renderWithProviders(<RequireAdmin>back-office</RequireAdmin>, { preloadedState: signedIn(admin) });

    expect(screen.getByText("back-office")).toBeInTheDocument();
  });

  it("explains the restriction to other users", () => {
    renderWithProviders(<RequireAdmin>back-office</RequireAdmin>, { preloadedState: signedIn(candidate) });

    expect(screen.getByRole("heading", { name: "Administrators only" })).toBeInTheDocument();
    expect(screen.queryByText("back-office")).not.toBeInTheDocument();
  });
});

describe("RedirectIfAuthenticated", () => {
  it("shows the login screen to anonymous visitors", () => {
    renderWithProviders(<RedirectIfAuthenticated>login form</RedirectIfAuthenticated>, { preloadedState: anonymous });

    expect(screen.getByText("login form")).toBeInTheDocument();
  });

  it("sends signed-in users to the page they were heading to", async () => {
    navigation.searchParams = new URLSearchParams("next=/sessions");

    renderWithProviders(<RedirectIfAuthenticated>login form</RedirectIfAuthenticated>, { preloadedState: signedIn() });

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/sessions"));
  });

  it("never follows an external redirect", async () => {
    navigation.searchParams = new URLSearchParams("next=https://evil.example");

    renderWithProviders(<RedirectIfAuthenticated>login form</RedirectIfAuthenticated>, { preloadedState: signedIn() });

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/reservations"));
  });
});
