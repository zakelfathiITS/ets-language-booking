import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { renderWithIntl } from "@tests/renderWithProviders";

describe("Button", () => {
  it("is disabled and busy while loading", async () => {
    const onClick = jest.fn();
    renderWithIntl(
      <Button isLoading onClick={onClick}>
        Save
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");

    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("is a plain button by default, never an accidental submit", () => {
    renderWithIntl(<Button>Cancel</Button>);

    expect(screen.getByRole("button", { name: "Cancel" })).toHaveAttribute("type", "button");
  });
});

describe("Input", () => {
  it("flags an invalid value for assistive technologies", () => {
    renderWithIntl(<Input aria-label="Email" invalid />);

    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute("aria-invalid", "true");
  });
});
