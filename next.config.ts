import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["sharp"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.susercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.shopee.co.id",
      },
      {
        protocol: "https",
        hostname: "**.shopee.com",
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
    ],
    localPatterns: [
      { pathname: "/uploads/**" },
      { pathname: "/brand/**" },
      { pathname: "/icon.png" },
      { pathname: "/icon-store.png" },
      { pathname: "/apple-icon.png" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "24mb",
    },
    middlewareClientMaxBodySize: "24mb",
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
