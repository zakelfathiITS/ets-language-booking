import { screen } from "@testing-library/react";

import { LocaleSwitcher } from "@/features/i18n/LocaleSwitcher";

import { router } from "@tests/mocks/nextNavigation";
import { renderWithIntl } from "@tests/renderWithProviders";

describe("LocaleSwitcher", () => {
  afterEach(() => {
    document.cookie = "locale=; max-age=0; path=/";
  });

  it("shows the current language", () => {
    renderWithIntl(<LocaleSwitcher />, { locale: "fr" });

    expect(screen.getByRole("combobox", { name: "Langue" })).toHaveValue("fr");
  });

  it("remembers the chosen language and re-renders the page in it", async () => {
    const { user } = renderWithIntl(<LocaleSwitcher />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Language" }), "fr");

    expect(document.cookie).toContain("locale=fr");
    expect(router.refresh).toHaveBeenCalled();
  });
});
