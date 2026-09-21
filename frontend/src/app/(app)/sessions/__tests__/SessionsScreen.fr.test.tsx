import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import { aPage, aSession, signedIn } from "@tests/fixtures";
import { navigation } from "@tests/mocks/nextNavigation";
import { api, problem } from "@tests/msw/handlers";
import { server } from "@tests/msw/server";
import { renderWithProviders } from "@tests/renderWithProviders";

import { SessionsScreen } from "../SessionsScreen";

describe("SessionsScreen in French", () => {
  beforeEach(() => {
    navigation.pathname = "/sessions";
  });

  it("renders the catalogue, dates and plurals in French", async () => {
    server.use(http.get(api("/api/sessions"), () => HttpResponse.json(aPage([aSession()], 1, 2))));

    renderWithProviders(<SessionsScreen />, { preloadedState: signedIn(), locale: "fr" });

    const card = await screen.findByRole("article", { name: "English" });
    expect(card).toHaveTextContent("lun. 23 septembre 2030");
    expect(card).toHaveTextContent("6 places restantes sur 8");
    expect(screen.getByRole("button", { name: "Réserver une place" })).toBeInTheDocument();
    expect(screen.getByText(/Les horaires sont indiqués à l'heure de Paris/)).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Pagination" })).toHaveTextContent("Page 1 sur 2");
  });

  it("translates API conflicts from their code", async () => {
    server.use(http.post(api("/api/reservations"), () => problem(409, "session_full", 'Session "x" has no seat left.')));
    const { user } = renderWithProviders(<SessionsScreen />, { preloadedState: signedIn(), locale: "fr" });

    await user.click(await screen.findByRole("button", { name: "Réserver une place" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Désolé, cette session vient d'être complète.");
  });
});
