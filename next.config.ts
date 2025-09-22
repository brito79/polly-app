import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Set output file tracing root to suppress lockfile warning
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
