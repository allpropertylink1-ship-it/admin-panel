import type { NextConfig } from "next";

const API_BACKEND = process.env.API_BACKEND_URL || "https://delightful-encouragement-production-878d.up.railway.app";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BACKEND}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
