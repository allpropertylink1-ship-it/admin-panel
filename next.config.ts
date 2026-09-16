import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com; style-src 'self' 'unsafe-inline' https://accounts.google.com https://fonts.googleapis.com; img-src 'self' data: blob: https://api.allpropertylink.co.ke; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://api.allpropertylink.co.ke; frame-src 'self' https://accounts.google.com; object-src 'none'`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
