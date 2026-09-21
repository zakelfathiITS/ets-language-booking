import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import { aReservation, signedIn } from "@tests/fixtures";
import { api } from "@tests/msw/handlers";
import { server } from "@tests/msw/server";
import { renderWithProviders } from "@tests/renderWithProviders";
import { ReservationsScreen } from "../ReservationsScreen";

const upcoming = aReservation({ id: "r-upcoming" }, { id: "s1", language: "German", date: "2030-10-01" });
const past = aReservation({ id: "r-past" }, { id: "s2", language: "Italian", date: "2020-01-10", hasStarted: true });

describe("ReservationsScreen", () => {
  it("separates upcoming and past reservations", async () => {
    server.use(http.get(api("/api/reservations"), () => HttpResponse.json({ items: [upcoming, past] })));

    renderWithProviders(<ReservationsScreen />, { preloadedState: signedIn() });

    const upcomingSection = await screen.findByRole("region", { name: "Upcoming (1)" });
    const pastSection = screen.getByRole("region", { name: "Past (1)" });
    expect(within(upcomingSection).getByRole("article", { name: "German" })).toBeInTheDocument();
    expect(within(pastSection).getByRole("article", { name: "Italian" })).toBeInTheDocument();
    // A session that took place cannot be cancelled any more.
    expect(within(pastSection).queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("cancels a reservation once confirmed", async () => {
    let items = [upcoming];
    let deleted: string | null = null;
    server.use(
      http.get(api("/api/reservations"), () => HttpResponse.json({ items })),
      http.delete(api("/api/reservations/:id"), ({ params }) => {
        deleted = String(params.id);
        items = [];

        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { user } = renderWithProviders(<ReservationsScreen />, { preloadedState: signedIn() });

    await user.click(await screen.findByRole("button", { name: "Cancel" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel my reservation" }));

    expect(await screen.findByText(/Your reservation for German, Tue 1 October 2030 at 09:00 has been cancelled./)).toBeInTheDocument();
    expect(deleted).toBe("r-upcoming");
    expect(await screen.findByRole("heading", { name: "No reservation yet" })).toBeInTheDocument();
  });

  it("keeps the reservation when the user changes their mind", async () => {
    let deleteCalls = 0;
    server.use(
      http.get(api("/api/reservations"), () => HttpResponse.json({ items: [upcoming] })),
      http.delete(api("/api/reservations/:id"), () => {
        deleteCalls += 1;

        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { user } = renderWithProviders(<ReservationsScreen />, { preloadedState: signedIn() });

    await user.click(await screen.findByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Keep it" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(deleteCalls).toBe(0);
  });

  it("invites users without reservations to browse sessions", async () => {
    renderWithProviders(<ReservationsScreen />, { preloadedState: signedIn() });

    expect(await screen.findByRole("heading", { name: "No reservation yet" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse sessions" })).toHaveAttribute("href", "/sessions");
  });
});
