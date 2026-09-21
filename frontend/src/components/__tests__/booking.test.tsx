import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ConfirmDialog } from "@/components/organisms/ConfirmDialog";
import { SessionCard } from "@/components/organisms/SessionCard";

import { aSession } from "@tests/fixtures";

function renderCard(overrides: Parameters<typeof aSession>[0] = {}) {
  const onBook = jest.fn();
  const onCancel = jest.fn();
  render(<SessionCard session={aSession(overrides)} onBook={onBook} onCancel={onCancel} />);

  return { onBook, onCancel };
}

describe("SessionCard", () => {
  it("lets candidates book an open session", async () => {
    const { onBook } = renderCard();

    expect(screen.getByRole("article", { name: "English" })).toHaveTextContent("Mon 23 September 2030");
    expect(screen.getByText("6 of 8 seats left")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Book a seat" }));

    expect(onBook).toHaveBeenCalledWith(expect.objectContaining({ id: "65f0000000000000000000a1" }));
  });

  it("warns when only a few seats remain", () => {
    renderCard({ seatsAvailable: 2, seatsTaken: 6 });

    expect(screen.getByText("Few seats left")).toBeInTheDocument();
  });

  it("offers to cancel a session the user booked", async () => {
    const { onCancel, onBook } = renderCard({ myReservationId: "r1" });

    expect(screen.getByText("Booked")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Cancel my booking" }));

    expect(onCancel).toHaveBeenCalled();
    expect(onBook).not.toHaveBeenCalled();
  });

  it("cannot book a full session", () => {
    renderCard({ isFull: true, seatsAvailable: 0, seatsTaken: 8 });

    expect(screen.getByText("No seat left")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Full" })).toBeDisabled();
  });

  it("closes bookings once the session has started", () => {
    renderCard({ hasStarted: true, myReservationId: "r1" });

    expect(screen.getByText("Started")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Booking closed" })).toBeDisabled();
  });
});

describe("ConfirmDialog", () => {
  function renderDialog() {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    render(
      <ConfirmDialog open title="Cancel this booking?" description="Your seat will be released." confirmLabel="Cancel my booking" onConfirm={onConfirm} onCancel={onCancel} />,
    );

    return { onConfirm, onCancel };
  }

  it("is an accessible modal focused on the safe choice", () => {
    renderDialog();

    const dialog = screen.getByRole("dialog", { name: "Cancel this booking?" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription("Your seat will be released.");
    expect(screen.getByRole("button", { name: "Keep it" })).toHaveFocus();
  });

  it("confirms, or closes with Escape", async () => {
    const { onConfirm, onCancel } = renderDialog();

    await userEvent.click(screen.getByRole("button", { name: "Cancel my booking" }));
    await userEvent.keyboard("{Escape}");

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <ConfirmDialog open={false} title="t" description="d" confirmLabel="ok" onConfirm={jest.fn()} onCancel={jest.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
