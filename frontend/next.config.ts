import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const nextConfig: NextConfig = {
  // Self-contained server bundle: the production Docker image ships only what it needs.
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
};

export default withNextIntl(nextConfig);
