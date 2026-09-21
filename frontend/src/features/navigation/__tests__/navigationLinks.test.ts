import { navigationLinks } from "@/features/navigation/navigationLinks";

describe("navigationLinks", () => {
  it("offers the administration only to administrators", () => {
    expect(navigationLinks(false).map((link) => link.href)).toEqual(["/sessions", "/reservations", "/account"]);
    expect(navigationLinks(true).map((link) => link.href)).toContain("/admin/sessions");
  });
});
