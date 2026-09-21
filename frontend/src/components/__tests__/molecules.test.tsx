import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Alert } from "@/components/molecules/Alert";
import { FormField } from "@/components/molecules/FormField";
import { PaginationControls } from "@/components/molecules/PaginationControls";
import { renderWithIntl } from "@tests/renderWithProviders";

describe("FormField", () => {
  it("links the label, the hint and the input", () => {
    renderWithIntl(<FormField label="Email" hint="We never share it." />);

    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toHaveAccessibleDescription("We never share it.");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("announces the error instead of the hint", () => {
    renderWithIntl(<FormField label="Email" hint="We never share it." error="This value is not a valid email address." />);

    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("This value is not a valid email address.");
  });
});

describe("Alert", () => {
  it("interrupts for errors and stays polite otherwise", () => {
    renderWithIntl(
      <>
        <Alert tone="error">Failure</Alert>
        <Alert tone="success">Saved</Alert>
      </>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Failure");
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });
});

describe("PaginationControls", () => {
  it("moves between pages and disables the impossible moves", async () => {
    const onPageChange = jest.fn();
    renderWithIntl(<PaginationControls page={1} totalPages={3} onPageChange={onPageChange} />);

    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(screen.getByRole("navigation", { name: "Pagination" })).toHaveTextContent("Page 1 of 3");
  });

  it("disables next on the last page", () => {
    renderWithIntl(<PaginationControls page={3} totalPages={3} onPageChange={jest.fn()} />);

    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
  });

  it("disappears when everything fits on one page", () => {
    const { container } = renderWithIntl(<PaginationControls page={1} totalPages={1} onPageChange={jest.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });
});
