import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";

import { ApiAvailabilityGate } from "@/features/availability/ApiAvailabilityGate";
import { type ApiAvailability, selectApiAvailability } from "@/features/availability/availabilitySlice";
import { waitForApi } from "@/features/availability/waitForApi";
import { WakeUpScreen } from "@/components/organisms/WakeUpScreen";
import { makeStore } from "@/store/store";

import { api, problem } from "@tests/msw/handlers";
import { server } from "@tests/msw/server";
import { renderWithIntl, renderWithProviders } from "@tests/renderWithProviders";

const timing = { noticeAfterMs: 20, retryEveryMs: 5 };

/** Every availability the store goes through while waiting, starting with the initial one. */
async function statusesWhileWaiting(): Promise<ApiAvailability[]> {
  const store = makeStore();
  const statuses: ApiAvailability[] = [selectApiAvailability(store.getState())];
  store.subscribe(() => {
    const status = selectApiAvailability(store.getState());
    if (statuses.at(-1) !== status) {
      statuses.push(status);
    }
  });

  await store.dispatch(waitForApi(timing));

  return statuses;
}

describe("waiting for the API", () => {
  it("shows nothing when the API answers at once", async () => {
    expect(await statusesWhileWaiting()).toEqual(["checking", "ready"]);
  });

  it("says it is waking up, and keeps asking until the API answers", async () => {
    let calls = 0;
    server.use(
      http.get(api("/api/health"), () => {
        calls += 1;

        return calls < 3 ? problem(503, "service_unavailable") : HttpResponse.json({ status: "ok" });
      }),
    );

    expect(await statusesWhileWaiting()).toEqual(["checking", "waking", "ready"]);
    expect(calls).toBe(3);
  });

  it("says it is waking up when the API is slow to answer", async () => {
    server.use(
      http.get(api("/api/health"), async () => {
        await delay(100);

        return HttpResponse.json({ status: "ok" });
      }),
    );

    expect(await statusesWhileWaiting()).toEqual(["checking", "waking", "ready"]);
  });
});

describe("ApiAvailabilityGate", () => {
  it("shows the waking-up screen instead of the page", () => {
    renderWithProviders(<ApiAvailabilityGate>page</ApiAvailabilityGate>, { preloadedState: { availability: { status: "waking" } } });

    expect(screen.getByRole("status")).toHaveTextContent("Waking up the service");
    expect(screen.queryByText("page")).not.toBeInTheDocument();
  });

  it("offers a reload when waking up takes too long", async () => {
    const user = userEvent.setup();
    const retry = jest.fn();
    renderWithIntl(<WakeUpScreen slowAfterMs={10} onRetry={retry} />);
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: "Try again" }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it.each(["checking", "ready"] as const)("shows the page while %s", (status) => {
    renderWithProviders(<ApiAvailabilityGate>page</ApiAvailabilityGate>, { preloadedState: { availability: { status } } });

    expect(screen.getByText("page")).toBeInTheDocument();
  });
});
