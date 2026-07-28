import type { NextConfig } from "next";
import {
  SECURITY_HEADERS,
  STRICT_TRANSPORT_SECURITY,
} from "./worker/security";

const commonSecurityHeaders = [
  ...Object.entries(SECURITY_HEADERS).map(([key, value]) => ({ key, value })),
  {
    key: "Strict-Transport-Security",
    value: STRICT_TRANSPORT_SECURITY,
  },
];

const privateNoStoreHeaders = [
  {
    key: "Cache-Control",
    value: "private, no-store",
  },
  {
    key: "X-Robots-Tag",
    value: "noindex, nofollow, noarchive",
  },
];

const sensitiveNextPaths = [
  "/api/:path*",
  "/auth/:path*",
  "/sign-in",
  "/sign-in/:path*",
  "/account",
  "/account/:path*",
  "/checkout",
  "/checkout/:path*",
  "/downloads/:path*",
] as const;

const alternateProductionHostPatterns = [
  "www\\.gummyui\\.dev",
  "gummyui\\.vercel\\.app",
] as const;

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return alternateProductionHostPatterns.map((hostPattern) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: hostPattern }],
      destination: "https://gummyui.dev/:path*",
      permanent: true,
    }));
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: commonSecurityHeaders,
      },
      ...sensitiveNextPaths.map((source) => ({
        source,
        headers: privateNoStoreHeaders,
      })),
    ];
  },
};

export default nextConfig;
