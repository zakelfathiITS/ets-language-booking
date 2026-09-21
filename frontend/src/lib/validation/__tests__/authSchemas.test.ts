import { loginSchema, profileSchema, registerSchema } from "@/lib/validation/authSchemas";

describe("auth schemas", () => {
  it("trims the email before validating it", () => {
    expect(loginSchema.parse({ email: "  jane@example.com ", password: "x" }).email).toBe("jane@example.com");
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({ email: "jane@", password: "x" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Enter a valid email address.");
  });

  it("requires matching passwords of at least 8 characters on sign-up", () => {
    const tooShort = registerSchema.safeParse({ name: "Jane", email: "jane@example.com", password: "short", confirmPassword: "short" });
    const mismatch = registerSchema.safeParse({
      name: "Jane",
      email: "jane@example.com",
      password: "S3cure-passw0rd",
      confirmPassword: "different",
    });

    expect(tooShort.error?.issues.map((issue) => issue.path.join("."))).toEqual(["password"]);
    expect(mismatch.error?.issues.map((issue) => [issue.path.join("."), issue.message])).toEqual([
      ["confirmPassword", "Passwords do not match."],
    ]);
  });

  it("applies the API name rules to the profile", () => {
    expect(profileSchema.safeParse({ name: " J ", email: "jane@example.com" }).success).toBe(false);
    expect(profileSchema.safeParse({ name: "Jane Doe", email: "jane@example.com" }).success).toBe(true);
  });
});
