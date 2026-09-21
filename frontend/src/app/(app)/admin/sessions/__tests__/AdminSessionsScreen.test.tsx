import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import { admin, aPage, aSession, signedIn } from "@tests/fixtures";
import { navigation, router } from "@tests/mocks/nextNavigation";
import { api, problem } from "@tests/msw/handlers";
import { server } from "@tests/msw/server";
import { renderWithProviders } from "@tests/renderWithProviders";
import { AdminSessionsScreen } from "../AdminSessionsScreen";

const english = aSession({ id: "s1", language: "English" });
const past = aSession({ id: "s2", language: "German", hasStarted: true, date: "2020-02-03" });

describe("AdminSessionsScreen", () => {
  beforeEach(() => {
    navigation.pathname = "/admin/sessions";
  });

  it("lists the sessions with their bookings and actions", async () => {
    let query = "";
    server.use(
      http.get(api("/api/sessions"), ({ request }) => {
        query = new URL(request.url).search;

        return HttpResponse.json(aPage([english]));
      }),
    );

    renderWithProviders(<AdminSessionsScreen />, { preloadedState: signedIn(admin) });

    const row = await screen.findByRole("row", { name: /English/ });
    expect(within(row).getByText("2 / 8")).toBeInTheDocument();
    expect(within(row).getByText("Open")).toBeInTheDocument();
    expect(within(row).getByRole("link", { name: "Edit English on Mon 23 September 2030" })).toHaveAttribute(
      "href",
      "/admin/sessions/s1/edit",
    );
    expect(query).toBe("?page=1&limit=20");
  });

  it("includes past sessions on demand, through the URL", async () => {
    navigation.searchParams = new URLSearchParams("includePast=true");
    let query = "";
    server.use(
      http.get(api("/api/sessions"), ({ request }) => {
        query = new URL(request.url).search;

        return HttpResponse.json(aPage([past]));
      }),
    );
    const { user } = renderWithProviders(<AdminSessionsScreen />, { preloadedState: signedIn(admin) });

    expect(await screen.findByText("Past")).toBeInTheDocument();
    expect(query).toBe("?page=1&limit=20&includePast=true");

    await user.click(screen.getByLabelText("Include past sessions"));
    expect(router.replace).toHaveBeenCalledWith("/admin/sessions", { scroll: false });
  });

  it("deletes a session after confirmation", async () => {
    let items = [english];
    server.use(
      http.get(api("/api/sessions"), () => HttpResponse.json(aPage(items))),
      http.delete(api("/api/sessions/s1"), () => {
        items = [];

        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { user } = renderWithProviders(<AdminSessionsScreen />, { preloadedState: signedIn(admin) });

    await user.click(await screen.findByRole("button", { name: /Delete English/ }));
    await user.click(within(screen.getByRole("dialog", { name: "Delete this session?" })).getByRole("button", { name: "Delete session" }));

    expect(await screen.findByText("Session deleted: English, Mon 23 September 2030 at 09:00.")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "No session yet" })).toBeInTheDocument();
  });

  it("explains why a booked session cannot be deleted", async () => {
    server.use(
      http.get(api("/api/sessions"), () => HttpResponse.json(aPage([english]))),
      http.delete(api("/api/sessions/s1"), () => problem(409, "session_has_reservations")),
    );
    const { user } = renderWithProviders(<AdminSessionsScreen />, { preloadedState: signedIn(admin) });

    await user.click(await screen.findByRole("button", { name: /Delete English/ }));
    await user.click(screen.getByRole("button", { name: "Delete session" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("This session has bookings, so it cannot be deleted.");
  });

  it("shows the message left by the create and edit screens", async () => {
    const { user, store } = renderWithProviders(<AdminSessionsScreen />, {
      preloadedState: { ...signedIn(admin), flash: { current: { tone: "success", message: "Session created: Dutch." } } },
    });

    expect(await screen.findByText("Session created: Dutch.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(screen.queryByText("Session created: Dutch.")).not.toBeInTheDocument();
    expect(store.getState().flash.current).toBeNull();
  });
});
