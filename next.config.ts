import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the Next.js "N" dev emblem in the corner.
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "http", hostname: "127.0.0.1" },
    ],
  },
  async rewrites() {
    // Customer sites load /sdk.js from this origin; the SDK calls /ab/* on the same host.
    return [
      { source: "/ab/config/:key", destination: "/api/ab/config/:key" },
      { source: "/ab/collect", destination: "/api/ab/collect" },
    ];
  },
  async headers() {
    return [
      {
        source: "/ab/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
      {
        source: "/sdk.js",
        headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
      },
    ];
  },
};

export default nextConfig;
