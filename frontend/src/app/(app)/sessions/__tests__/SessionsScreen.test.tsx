import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import { aPage, aReservation, aSession, signedIn } from "@tests/fixtures";
import { navigation, router } from "@tests/mocks/nextNavigation";
import { api, problem } from "@tests/msw/handlers";
import { server } from "@tests/msw/server";
import { renderWithProviders } from "@tests/renderWithProviders";
import { SessionsScreen } from "../SessionsScreen";

/** A tiny stateful backend: booking really changes what the next fetch returns. */
function bookableBackend(initial = aSession()) {
  let session = initial;
  const requests: string[] = [];

  server.use(
    http.get(api("/api/sessions"), ({ request }) => {
      requests.push(new URL(request.url).search);

      return HttpResponse.json(aPage([session]));
    }),
    http.post(api("/api/reservations"), () => {
      session = { ...session, seatsTaken: session.seatsTaken + 1, seatsAvailable: session.seatsAvailable - 1, myReservationId: "r1" };

      return HttpResponse.json(aReservation({ id: "r1" }, session), { status: 201 });
    }),
    http.delete(api("/api/reservations/r1"), () => {
      session = { ...session, seatsTaken: session.seatsTaken - 1, seatsAvailable: session.seatsAvailable + 1, myReservationId: null };

      return new HttpResponse(null, { status: 204 });
    }),
  );

  return { requests };
}

describe("SessionsScreen", () => {
  beforeEach(() => {
    navigation.pathname = "/sessions";
  });

  it("lists the sessions of the page and filters found in the URL", async () => {
    navigation.searchParams = new URLSearchParams("page=2&language=French&availableOnly=true");
    const { requests } = bookableBackend();

    renderWithProviders(<SessionsScreen />, { preloadedState: signedIn() });

    expect(await screen.findByRole("article", { name: "English" })).toBeInTheDocument();
    expect(requests[0]).toBe("?page=2&language=French&availableOnly=true");
    expect(screen.getByText(/Times are in Paris time/)).toBeInTheDocument();
    expect(screen.getByLabelText("Language")).toHaveValue("French");
  });

  it("books a seat and refreshes the availability", async () => {
    bookableBackend();
    const { user } = renderWithProviders(<SessionsScreen />, { preloadedState: signedIn() });

    await user.click(await screen.findByRole("button", { name: "Book a seat" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Your seat is booked: English, Mon 23 September 2030 at 09:00.");
    const card = await screen.findByRole("article", { name: "English" });
    await waitFor(() => expect(within(card).getByText("5 of 8 seats left")).toBeInTheDocument());
    expect(within(card).getByRole("button", { name: "Cancel my booking" })).toBeInTheDocument();
  });

  it("cancels a booking after confirmation", async () => {
    bookableBackend(aSession({ myReservationId: "r1", seatsTaken: 3, seatsAvailable: 5 }));
    const { user } = renderWithProviders(<SessionsScreen />, { preloadedState: signedIn() });

    await user.click(await screen.findByRole("button", { name: "Cancel my booking" }));
    const dialog = screen.getByRole("dialog", { name: "Cancel this booking?" });
    await user.click(within(dialog).getByRole("button", { name: "Cancel my booking" }));

    expect(await screen.findByText(/has been cancelled/)).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Book a seat" })).toBeInTheDocument();
  });

  it("explains a conflict and refreshes the seats", async () => {
    let fetches = 0;
    server.use(
      http.get(api("/api/sessions"), () => {
        fetches += 1;

        return HttpResponse.json(aPage([fetches === 1 ? aSession() : aSession({ isFull: true, seatsAvailable: 0, seatsTaken: 8 })]));
      }),
      http.post(api("/api/reservations"), () => problem(409, "session_full", 'Session "x" has no seat left.')),
    );
    const { user } = renderWithProviders(<SessionsScreen />, { preloadedState: signedIn() });

    await user.click(await screen.findByRole("button", { name: "Book a seat" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Sorry, this session has just filled up.");
    expect(await screen.findByRole("button", { name: "Full" })).toBeDisabled();
  });

  it("changes page through the URL", async () => {
    server.use(http.get(api("/api/sessions"), () => HttpResponse.json(aPage([aSession()], 1, 3))));
    const { user } = renderWithProviders(<SessionsScreen />, { preloadedState: signedIn() });

    await user.click(await screen.findByRole("button", { name: "Next" }));

    expect(router.replace).toHaveBeenCalledWith("/sessions?page=2", { scroll: false });
  });

  it("filters by language through the URL", async () => {
    const { user } = renderWithProviders(<SessionsScreen />, { preloadedState: signedIn() });

    await screen.findByRole("option", { name: "French" });
    await user.selectOptions(screen.getByLabelText("Language"), "French");

    expect(router.replace).toHaveBeenCalledWith("/sessions?language=French", { scroll: false });
  });

  it("offers to clear filters that match nothing", async () => {
    navigation.searchParams = new URLSearchParams("language=Japanese");
    server.use(http.get(api("/api/sessions"), () => HttpResponse.json(aPage([]))));
    const { user } = renderWithProviders(<SessionsScreen />, { preloadedState: signedIn() });

    expect(await screen.findByRole("heading", { name: "No session matches your filters" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(router.replace).toHaveBeenCalledWith("/sessions", { scroll: false });
  });

  it("lets the user retry when the catalogue cannot be loaded", async () => {
    let attempts = 0;
    server.use(
      http.get(api("/api/sessions"), () => {
        attempts += 1;

        return attempts === 1 ? problem(503, "internal_error") : HttpResponse.json(aPage([aSession()]));
      }),
    );
    const { user } = renderWithProviders(<SessionsScreen />, { preloadedState: signedIn() });

    expect(await screen.findByRole("alert")).toHaveTextContent("The sessions could not be loaded.");
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByRole("article", { name: "English" })).toBeInTheDocument();
  });
});
