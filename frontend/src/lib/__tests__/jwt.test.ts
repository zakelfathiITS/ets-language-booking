import { isTokenExpired, tokenExpiresAt } from "@/lib/jwt";

import { makeToken } from "@tests/fixtures";

describe("jwt", () => {
  it("reads the expiry of a token", () => {
    const token = makeToken(60);

    expect(tokenExpiresAt(token)).toBeGreaterThan(Date.now());
    expect(isTokenExpired(token)).toBe(false);
  });

  it("treats an expired token as expired", () => {
    expect(isTokenExpired(makeToken(-10))).toBe(true);
  });

  it("treats a malformed token as expired", () => {
    expect(tokenExpiresAt("not-a-jwt")).toBeNull();
    expect(isTokenExpired("a.%%%.c")).toBe(true);
  });
});
