import { toServerFormErrors } from "@/features/forms/toServerFormErrors";

const translations: Record<string, string> = {
  generic: "Something went wrong.",
  email_already_in_use: "Email already used.",
  invalid_credentials: "Invalid email or password.",
};
const translate = (code: string) => translations[code] ?? null;

describe("toServerFormErrors", () => {
  it("keeps the (already localised) violation messages on their fields", () => {
    expect(
      toServerFormErrors({ status: 422, code: "validation_failed", message: "Invalid data.", fieldErrors: { name: "Trop court." } }, translate),
    ).toEqual({ message: null, fields: { name: "Trop court." } });
  });

  it("translates field-specific conflicts and attaches them to the field", () => {
    expect(
      toServerFormErrors({ status: 409, code: "email_already_in_use", message: "The email is used.", fieldErrors: {} }, translate),
    ).toEqual({ message: null, fields: { email: "Email already used." } });
  });

  it("translates other errors for the whole form, falling back to the API text", () => {
    expect(
      toServerFormErrors({ status: 401, code: "invalid_credentials", message: "API text", fieldErrors: {} }, translate).message,
    ).toBe("Invalid email or password.");
    expect(toServerFormErrors({ status: 500, code: "unknown_code", message: "API text", fieldErrors: {} }, translate).message).toBe("API text");
    expect(toServerFormErrors(new Error("boom"), translate).message).toBe("Something went wrong.");
  });
});
