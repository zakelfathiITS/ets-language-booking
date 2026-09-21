/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import { contentSecurityPolicy } from "@/lib/contentSecurityPolicy";
import { proxy } from "@/proxy";

describe("content security policy", () => {
  it("only lets scripts carrying the nonce run", () => {
    const policy = contentSecurityPolicy("abc123", false);

    expect(policy).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).not.toContain("unsafe-eval");
  });

  it("relaxes only what development tools need", () => {
    const policy = contentSecurityPolicy("abc123", true);

    expect(policy).toContain("'unsafe-eval'");
    expect(policy).toContain("connect-src 'self' ws:");
  });

  it("gives every page its own nonce, shared with Next.js through the request", () => {
    const first = proxy(new NextRequest("http://localhost:3000/sessions"));
    const second = proxy(new NextRequest("http://localhost:3000/sessions"));

    const policy = first.headers.get("content-security-policy");
    expect(policy).toMatch(/'nonce-[A-Za-z0-9+/=]+'/);
    expect(first.headers.get("x-middleware-request-content-security-policy")).toBe(policy);
    expect(second.headers.get("content-security-policy")).not.toBe(policy);
  });
});
