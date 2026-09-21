import { toServerFormErrors } from "@/features/forms/toServerFormErrors";

describe("toServerFormErrors", () => {
  it("attaches violations to their fields", () => {
    expect(
      toServerFormErrors({ status: 422, code: "validation_failed", message: "Invalid data.", fieldErrors: { name: "Too short." } }),
    ).toEqual({ message: null, fields: { name: "Too short." } });
  });

  it("attaches field-specific conflicts to the field", () => {
    expect(
      toServerFormErrors({ status: 409, code: "email_already_in_use", message: "Email already used.", fieldErrors: {} }),
    ).toEqual({ message: null, fields: { email: "Email already used." } });
  });

  it("keeps other errors for the whole form", () => {
    expect(toServerFormErrors({ status: 401, code: "invalid_credentials", message: "Invalid email or password.", fieldErrors: {} })).toEqual({
      message: "Invalid email or password.",
      fields: {},
    });
    expect(toServerFormErrors(new Error("boom")).message).toBe("Something went wrong. Please try again.");
  });
});
