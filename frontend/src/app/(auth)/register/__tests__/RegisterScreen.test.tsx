import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import { anonymous, candidate } from "../../../../../test/fixtures";
import { api, problem } from "../../../../../test/msw/handlers";
import { server } from "../../../../../test/msw/server";
import { renderWithProviders } from "../../../../../test/renderWithProviders";
import { RegisterScreen } from "../RegisterScreen";

async function fillForm(user: ReturnType<typeof renderWithProviders>["user"], confirmation = "S3cure-passw0rd") {
  await user.type(screen.getByLabelText("Full name"), "Camille Martin");
  await user.type(screen.getByLabelText("Email"), "camille@example.com");
  await user.type(screen.getByLabelText("Password"), "S3cure-passw0rd");
  await user.type(screen.getByLabelText("Confirm password"), confirmation);
  await user.click(screen.getByRole("button", { name: "Create my account" }));
}

describe("RegisterScreen", () => {
  it("checks that both passwords match", async () => {
    const { user } = renderWithProviders(<RegisterScreen />, { preloadedState: anonymous });

    await fillForm(user, "something-else");

    expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();
  });

  it("creates the account and signs the user in", async () => {
    let payload: unknown;
    server.use(
      http.post(api("/api/auth/register"), async ({ request }) => {
        payload = await request.json();

        return HttpResponse.json(candidate, { status: 201 });
      }),
    );
    const { user, store } = renderWithProviders(<RegisterScreen />, { preloadedState: anonymous });

    await fillForm(user);

    await waitFor(() => expect(store.getState().auth.status).toBe("authenticated"));
    expect(payload).toEqual({ name: "Camille Martin", email: "camille@example.com", password: "S3cure-passw0rd" });
  });

  it("shows an email already in use next to the email field", async () => {
    server.use(
      http.post(api("/api/auth/register"), () =>
        problem(409, "email_already_in_use", 'The email "camille@example.com" is already used by another account.'),
      ),
    );
    const { user, store } = renderWithProviders(<RegisterScreen />, { preloadedState: anonymous });

    await fillForm(user);

    const email = screen.getByLabelText("Email");
    await waitFor(() => expect(email).toHaveAccessibleDescription(/already used by another account/));
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(store.getState().auth.status).toBe("anonymous");
  });
});
