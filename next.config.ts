import type { NextConfig } from "next";
import {
  PUBLIC_PAGE_CACHE_CONTROL,
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

const publicCacheHeaders = [
  {
    key: "Cache-Control",
    value: PUBLIC_PAGE_CACHE_CONTROL,
  },
];

export const publicCacheableNextPaths = [
  "/",
  "/accessibility",
  "/AGENTS.md",
  "/blocks",
  "/blocks/:path*",
  "/blog",
  "/blog/:path*",
  "/changelog",
  "/changelog.xml",
  "/commercial-license",
  "/community",
  "/community/:path*",
  "/components",
  "/components/:path*",
  "/contact",
  "/design-kit",
  "/docs",
  "/docs/:path*",
  "/license",
  "/llms.txt",
  "/locales",
  "/mcp",
  "/pricing",
  "/privacy",
  "/pro",
  "/refund",
  "/registry",
  "/robots.txt",
  "/rss.xml",
  "/rtl",
  "/security",
  "/sitemap.xml",
  "/studio",
  "/subprocessors",
  "/support",
  "/templates",
  "/templates/:path*",
  "/terms",
  "/themes",
  "/styles/:path*",
  "/r/:path*",
  "/gummy-:asset",
  "/favicon.svg",
  "/og.png",
] as const;

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
      ...publicCacheableNextPaths.map((source) => ({
        source,
        headers: publicCacheHeaders,
      })),
      ...sensitiveNextPaths.map((source) => ({
        source,
        headers: privateNoStoreHeaders,
      })),
    ];
  },
};

export default nextConfig;
