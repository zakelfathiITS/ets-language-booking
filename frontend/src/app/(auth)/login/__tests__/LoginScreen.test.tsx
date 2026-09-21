import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import { admin, anonymous } from "@tests/fixtures";
import { api, problem } from "@tests/msw/handlers";
import { server } from "@tests/msw/server";
import { renderWithProviders } from "@tests/renderWithProviders";
import { LoginScreen } from "../LoginScreen";

describe("LoginScreen", () => {
  it("validates the form before calling the API", async () => {
    const { user } = renderWithProviders(<LoginScreen />, { preloadedState: anonymous });

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Email is required.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
  });

  it("signs the user in", async () => {
    let credentials: unknown;
    server.use(
      http.post(api("/api/auth/login"), async ({ request }) => {
        credentials = await request.json();

        return HttpResponse.json({ user: admin });
      }),
    );
    const { user, store } = renderWithProviders(<LoginScreen />, { preloadedState: anonymous });

    await user.type(screen.getByLabelText("Email"), "admin@ets.test");
    await user.type(screen.getByLabelText("Password"), "Admin123!");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(store.getState().auth.status).toBe("authenticated"));
    expect(credentials).toEqual({ email: "admin@ets.test", password: "Admin123!" });
  });

  it("explains wrong credentials", async () => {
    server.use(http.post(api("/api/auth/login"), () => problem(401, "invalid_credentials", "Invalid email or password.")));
    const { user, store } = renderWithProviders(<LoginScreen />, { preloadedState: anonymous });

    await user.type(screen.getByLabelText("Email"), "jane@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password.");
    expect(store.getState().auth.status).toBe("anonymous");
  });

  it("signs in with a demo account in one click", async () => {
    let credentials: unknown;
    server.use(
      http.post(api("/api/auth/login"), async ({ request }) => {
        credentials = await request.json();

        return HttpResponse.json({ user: admin });
      }),
    );
    const { user, store } = renderWithProviders(<LoginScreen />, { preloadedState: anonymous });

    await user.click(screen.getByRole("button", { name: "Sign in as an administrator" }));

    await waitFor(() => expect(store.getState().auth.status).toBe("authenticated"));
    expect(credentials).toEqual({ email: "admin@ets.test", password: "Admin123!" });
  });

  it("tells users when their session has expired", () => {
    renderWithProviders(<LoginScreen />, { preloadedState: { auth: { ...anonymous.auth, endedBy: "expiry" } } });

    expect(screen.getByRole("status")).toHaveTextContent("Your session has expired");
  });
});
