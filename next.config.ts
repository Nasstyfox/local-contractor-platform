import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "98cncfc1-3000.inc1.devtunnels.ms",
        "*.devtunnels.ms"
      ],
    },
  },
};

export default nextConfig;