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
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Cross-Origin-Opener-Policy", value: "unsafe-none" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://upload-widget.cloudinary.com; style-src 'self' 'unsafe-inline' https://accounts.google.com https://upload-widget.cloudinary.com https://fonts.googleapis.com; img-src 'self' data: blob: https://res.cloudinary.com https://upload-widget.cloudinary.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://delightful-encouragement-production-878d.up.railway.app https://api.cloudinary.com https://upload-widget.cloudinary.com; frame-src 'self' https://accounts.google.com https://upload-widget.cloudinary.com https://widget.cloudinary.com https://cloudinary.com; object-src 'none'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
