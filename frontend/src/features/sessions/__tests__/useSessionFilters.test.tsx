import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useSessionFilters } from "@/features/sessions/useSessionFilters";

import { navigation, router } from "@tests/mocks/nextNavigation";

function Probe() {
  const { filters, setPage, setFilters } = useSessionFilters();

  return (
    <>
      <output>{JSON.stringify(filters)}</output>
      <button onClick={() => setPage(3)}>page 3</button>
      <button onClick={() => setFilters({ language: "French" })}>french</button>
      <button onClick={() => setFilters({ language: null, availableOnly: false })}>clear</button>
    </>
  );
}

describe("useSessionFilters", () => {
  beforeEach(() => {
    navigation.pathname = "/sessions";
  });

  it("reads page and filters from the URL", () => {
    navigation.searchParams = new URLSearchParams("page=2&language=German&availableOnly=true");
    render(<Probe />);

    expect(screen.getByRole("status")).toHaveTextContent('{"page":2,"language":"German","availableOnly":true,"includePast":false}');
  });

  it("falls back to sane defaults for invalid values", () => {
    navigation.searchParams = new URLSearchParams("page=-4&availableOnly=maybe");
    render(<Probe />);

    expect(screen.getByRole("status")).toHaveTextContent('{"page":1,"language":null,"availableOnly":false,"includePast":false}');
  });

  it("writes the page to the URL", async () => {
    navigation.searchParams = new URLSearchParams("language=German");
    render(<Probe />);

    await userEvent.click(screen.getByRole("button", { name: "page 3" }));

    expect(router.replace).toHaveBeenCalledWith("/sessions?page=3&language=German", { scroll: false });
  });

  it("goes back to the first page when a filter changes", async () => {
    navigation.searchParams = new URLSearchParams("page=4");
    render(<Probe />);

    await userEvent.click(screen.getByRole("button", { name: "french" }));
    await userEvent.click(screen.getByRole("button", { name: "clear" }));

    expect(router.replace).toHaveBeenNthCalledWith(1, "/sessions?language=French", { scroll: false });
    expect(router.replace).toHaveBeenNthCalledWith(2, "/sessions", { scroll: false });
  });
});
