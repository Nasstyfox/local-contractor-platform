import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Increase the limit to 10 MB (you can adjust to 5mb, 10mb, or 20mb)
      bodySizeLimit: '10mb', 
      allowedOrigins: [
        "localhost:3000",
        "98cncfc1-3000.inc1.devtunnels.ms",
        "*.devtunnels.ms"
      ],
    },
  },
};

export default nextConfig;