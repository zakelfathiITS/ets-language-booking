import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import { admin, aSession, signedIn } from "@tests/fixtures";
import { navigation, router } from "@tests/mocks/nextNavigation";
import { api, problem } from "@tests/msw/handlers";
import { server } from "@tests/msw/server";
import { renderWithProviders } from "@tests/renderWithProviders";
import { EditSessionScreen } from "../[id]/edit/EditSessionScreen";
import { NewSessionScreen } from "../new/NewSessionScreen";

type User = ReturnType<typeof renderWithProviders>["user"];

async function fill(user: User, values: Partial<Record<"Language" | "Date" | "Time" | "Location" | "Number of seats", string>>) {
  for (const [label, value] of Object.entries(values)) {
    const field = screen.getByLabelText(label);
    await user.clear(field);
    await user.type(field, value);
  }
}

describe("NewSessionScreen", () => {
  it("validates the form before calling the API", async () => {
    const { user } = renderWithProviders(<NewSessionScreen />, { preloadedState: signedIn(admin) });

    await user.click(screen.getByRole("button", { name: "Create session" }));

    expect(await screen.findByText("Language must contain between 2 and 60 characters.")).toBeInTheDocument();
    expect(screen.getByText("Pick a date.")).toBeInTheDocument();
  });

  it("creates a session and goes back to the list with a message", async () => {
    let payload: unknown;
    server.use(
      http.post(api("/api/sessions"), async ({ request }) => {
        payload = await request.json();

        return HttpResponse.json(aSession({ id: "s9", language: "Dutch", date: "2030-02-03", time: "10:00" }), { status: 201 });
      }),
    );
    const { user, store } = renderWithProviders(<NewSessionScreen />, { preloadedState: signedIn(admin) });

    await fill(user, { Language: "Dutch", Date: "2030-02-03", Time: "10:00", Location: "Amsterdam", "Number of seats": "12" });
    await user.click(screen.getByRole("button", { name: "Create session" }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/admin/sessions"));
    expect(payload).toEqual({ language: "Dutch", date: "2030-02-03", time: "10:00", location: "Amsterdam", capacity: 12 });
    expect(store.getState().flash.current?.message).toBe("Session created: Dutch, Sun 3 February 2030 at 10:00.");
  });

  it("shows a date in the past next to the date field", async () => {
    server.use(http.post(api("/api/sessions"), () => problem(422, "session_in_past", "A session must be scheduled in the future.")));
    const { user } = renderWithProviders(<NewSessionScreen />, { preloadedState: signedIn(admin) });

    await fill(user, { Language: "Dutch", Date: "2020-02-03", Time: "10:00", Location: "Amsterdam" });
    await user.click(screen.getByRole("button", { name: "Create session" }));

    await waitFor(() => expect(screen.getByLabelText("Date")).toHaveAccessibleDescription("A session must be scheduled in the future."));
    expect(router.push).not.toHaveBeenCalled();
  });
});

describe("EditSessionScreen", () => {
  beforeEach(() => {
    navigation.params = { id: "s1" };
  });

  it("prefills the form and saves the changes", async () => {
    let payload: unknown;
    server.use(
      http.get(api("/api/sessions/s1"), () => HttpResponse.json(aSession({ id: "s1", seatsTaken: 3 }))),
      http.put(api("/api/sessions/s1"), async ({ request }) => {
        payload = await request.json();

        return HttpResponse.json(aSession({ id: "s1", capacity: 30 }));
      }),
    );
    const { user } = renderWithProviders(<EditSessionScreen />, { preloadedState: signedIn(admin) });

    expect(await screen.findByLabelText("Language")).toHaveValue("English");
    expect(screen.getByLabelText("Date")).toHaveValue("2030-09-23");
    expect(screen.getByText(/3 of 8 seats are booked/)).toBeInTheDocument();

    await fill(user, { "Number of seats": "30" });
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/admin/sessions"));
    expect(payload).toMatchObject({ language: "English", capacity: 30 });
  });

  it("refuses a capacity below the seats already booked", async () => {
    server.use(
      http.get(api("/api/sessions/s1"), () => HttpResponse.json(aSession({ id: "s1", seatsTaken: 6 }))),
      http.put(api("/api/sessions/s1"), () =>
        problem(409, "capacity_below_reserved_seats", "The capacity cannot be lowered to 4: 6 seat(s) are already booked."),
      ),
    );
    const { user } = renderWithProviders(<EditSessionScreen />, { preloadedState: signedIn(admin) });

    await screen.findByLabelText("Language");
    await fill(user, { "Number of seats": "4" });
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    // The code is translated; the API's English detail is not shown.
    await waitFor(() =>
      expect(screen.getByLabelText("Number of seats")).toHaveAccessibleDescription(
        "The capacity cannot be lower than the seats already booked.",
      ),
    );
  });

  it("says so when the session no longer exists", async () => {
    server.use(http.get(api("/api/sessions/s1"), () => problem(404, "session_not_found")));

    renderWithProviders(<EditSessionScreen />, { preloadedState: signedIn(admin) });

    expect(await screen.findByRole("heading", { name: "Session not found" })).toBeInTheDocument();
  });
});
