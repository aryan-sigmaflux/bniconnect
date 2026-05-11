import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow local network devices (e.g. phone testing) to connect to HMR
  allowedDevOrigins: ["http://192.168.1.7:3000"],

  // Production: nginx handles /api/v1/ proxying. This rewrite is for local dev only.
  async rewrites() {
    // In production, nginx handles the proxy. These rewrites are dev fallbacks.
    const backendUrl = process.env.API_URL || "http://localhost:8000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/:path*`,
      },
      {
        source: "/api/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },

  // Security headers to prevent crawling and improve security
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          }
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
