import { safeRedirectPath } from "@/lib/safeRedirect";

describe("safeRedirectPath", () => {
  it("keeps same-site paths", () => {
    expect(safeRedirectPath("/sessions?page=2", "/home")).toBe("/sessions?page=2");
  });

  it.each([null, "", "https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)"])(
    "falls back for %p",
    (candidate) => {
      expect(safeRedirectPath(candidate, "/home")).toBe("/home");
    },
  );
});
