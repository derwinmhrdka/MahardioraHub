import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["sharp", "@img/sharp-linuxmusl-x64", "@img/sharp-libvips-linuxmusl-x64"],
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
  webpack: (config, { dev, nextRuntime }) => {
    if (!dev) {
      config.cache = false;
    }
    // Instrumentation Edge compile must not pull Node-only scheduler graph.
    if (nextRuntime === "edge") {
      config.resolve.alias = {
        ...(config.resolve.alias as Record<string, string | false>),
        "./instrumentation.node": false,
        "@/lib/orders/scheduler": false,
      };
    }
    return config;
  },
};

export default nextConfig;
