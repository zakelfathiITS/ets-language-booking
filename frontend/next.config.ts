import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle: the production Docker image ships only what it needs.
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
