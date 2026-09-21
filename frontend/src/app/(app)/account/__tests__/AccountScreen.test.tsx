import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import { candidate, signedIn } from "@tests/fixtures";
import { api, problem } from "@tests/msw/handlers";
import { server } from "@tests/msw/server";
import { renderWithProviders, settleApi } from "@tests/renderWithProviders";
import { AccountScreen } from "../AccountScreen";

describe("AccountScreen", () => {
  it("shows the account and prefills the form", async () => {
    const { store } = renderWithProviders(<AccountScreen />, { preloadedState: signedIn(candidate) });
    await settleApi(store);

    expect(screen.getByRole("heading", { name: candidate.name })).toBeInTheDocument();
    expect(screen.getByText("Candidate")).toBeInTheDocument();
    expect(screen.getByLabelText("Full name")).toHaveValue(candidate.name);
    expect(screen.getByLabelText("Email")).toHaveValue(candidate.email);
    // Nothing to save until something changes.
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  });

  it("updates the name and email", async () => {
    let payload: unknown;
    server.use(
      http.put(api("/api/me"), async ({ request }) => {
        payload = await request.json();

        return HttpResponse.json({ ...candidate, name: "Camille Durand", email: "camille.durand@example.com" });
      }),
    );
    const { user, store } = renderWithProviders(<AccountScreen />, { preloadedState: signedIn(candidate) });
    await settleApi(store);

    await user.clear(screen.getByLabelText("Full name"));
    await user.type(screen.getByLabelText("Full name"), "Camille Durand");
    await user.clear(screen.getByLabelText("Email"));
    await user.type(screen.getByLabelText("Email"), "camille.durand@example.com");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Your account has been updated.")).toBeInTheDocument();
    expect(payload).toEqual({ name: "Camille Durand", email: "camille.durand@example.com" });
    expect(store.getState().auth.user?.name).toBe("Camille Durand");
  });

  it("shows API errors next to the fields", async () => {
    server.use(
      http.put(api("/api/me"), () =>
        problem(422, "validation_failed", "The request contains invalid data.", [
          { field: "name", message: "This value is too short." },
        ]),
      ),
    );
    const { user, store } = renderWithProviders(<AccountScreen />, { preloadedState: signedIn(candidate) });
    await settleApi(store);

    await user.clear(screen.getByLabelText("Full name"));
    await user.type(screen.getByLabelText("Full name"), "Zed Zed");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(screen.getByLabelText("Full name")).toHaveAccessibleDescription("This value is too short."));
  });

  it("refuses an email used by another account", async () => {
    server.use(http.put(api("/api/me"), () => problem(409, "email_already_in_use", "This email is already used.")));
    const { user, store } = renderWithProviders(<AccountScreen />, { preloadedState: signedIn(candidate) });
    await settleApi(store);

    await user.clear(screen.getByLabelText("Email"));
    await user.type(screen.getByLabelText("Email"), "taken@example.com");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(screen.getByLabelText("Email")).toHaveAccessibleDescription("This email is already used by another account."),
    );
  });
});
