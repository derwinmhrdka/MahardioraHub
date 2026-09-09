import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["sharp"],
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
    middlewareClientMaxBodySize: "12mb",
  },
  // Avoid webpack pack cache filling the disk during Docker builds (ENOSPC).
  webpack: (config, { dev }) => {
    if (!dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
