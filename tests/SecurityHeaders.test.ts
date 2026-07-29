import { describe, expect, it } from "vitest";
import {
  PUBLIC_PAGE_CACHE_CONTROL,
  withSecurityHeaders,
} from "../worker/security";

describe("production response security headers", () => {
  it("adds the public-site browser protections", () => {
    const response = withSecurityHeaders(
      "https://gummyui.dev/components",
      new Response("ok", { headers: { "Cache-Control": "public, max-age=60" } }),
    );

    expect(response.headers.get("Cache-Control")).toBe("public, max-age=60");
    expect(response.headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(response.headers.get("Permissions-Policy")).toContain("camera=()");
    expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("Strict-Transport-Security")).toContain("max-age=63072000");
  });

  it("does not advertise HSTS over an insecure local response", () => {
    const response = withSecurityHeaders(
      "http://localhost:3000/api/health",
      new Response('{"status":"ok"}'),
    );

    expect(response.headers.has("Strict-Transport-Security")).toBe(false);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("sets safe public defaults without overriding explicit cache policy", () => {
    const html = withSecurityHeaders(
      "https://gummyui.dev/components",
      new Response("<!doctype html>", {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }),
    );
    const asset = withSecurityHeaders(
      "https://gummyui.dev/assets/index-abc123.js",
      new Response("script", {
        headers: { "Content-Type": "text/javascript" },
      }),
    );
    const account = withSecurityHeaders(
      "https://gummyui.dev/account",
      new Response("<!doctype html>", {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }),
    );
    const signIn = withSecurityHeaders(
      "https://gummyui.dev/sign-in",
      new Response("<!doctype html>", {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }),
    );
    const authCallback = withSecurityHeaders(
      "https://gummyui.dev/auth/callback",
      new Response(null, { status: 302 }),
    );
    const checkout = withSecurityHeaders(
      "https://gummyui.dev/checkout",
      new Response("<!doctype html>", {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }),
    );
    const download = withSecurityHeaders(
      "https://gummyui.dev/downloads/opaque",
      new Response("archive"),
    );
    const routeStyle = withSecurityHeaders(
      "https://gummyui.dev/styles/gummy-primitives.css",
      new Response("styles", {
        headers: { "Content-Type": "text/css" },
      }),
    );

    expect(html.headers.get("Cache-Control")).toBe(PUBLIC_PAGE_CACHE_CONTROL);
    expect(html.headers.get("Cache-Control")).toContain("max-age=300");
    expect(asset.headers.get("Cache-Control")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(account.headers.get("Cache-Control")).toBe("private, no-store");
    expect(account.headers.get("X-Robots-Tag")).toBe(
      "noindex, nofollow, noarchive",
    );
    expect(signIn.headers.get("Cache-Control")).toBe("private, no-store");
    expect(signIn.headers.get("X-Robots-Tag")).toContain("noindex");
    expect(authCallback.headers.get("Cache-Control")).toBe("private, no-store");
    expect(authCallback.headers.get("X-Robots-Tag")).toContain("noindex");
    expect(checkout.headers.get("Cache-Control")).toBe("private, no-store");
    expect(checkout.headers.get("X-Robots-Tag")).toContain("noindex");
    expect(download.headers.get("Cache-Control")).toBe("private, no-store");
    expect(download.headers.get("X-Robots-Tag")).toContain("noindex");
    expect(routeStyle.headers.get("Cache-Control")).toBe(
      "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    );
  });
});
