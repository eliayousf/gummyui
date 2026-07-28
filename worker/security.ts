export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

export const SECURITY_HEADERS = {
  "Content-Security-Policy": CONTENT_SECURITY_POLICY,
  "Permissions-Policy": "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
} as const;

export const STRICT_TRANSPORT_SECURITY =
  "max-age=63072000; includeSubDomains; preload";

export const SENSITIVE_PATH_PATTERN =
  /^\/(?:api|auth|sign-in|account|checkout|downloads)(?:\/|$)/;

export function withSecurityHeaders(requestUrl: string, response: Response): Response {
  const hardened = new Response(response.body, response);
  const url = new URL(requestUrl);

  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    hardened.headers.set(name, value);
  }

  const sensitivePath = SENSITIVE_PATH_PATTERN.test(url.pathname);
  if (sensitivePath) {
    hardened.headers.set(
      "X-Robots-Tag",
      "noindex, nofollow, noarchive",
    );
    hardened.headers.set("Cache-Control", "private, no-store");
  }

  if (!sensitivePath && !hardened.headers.has("Cache-Control")) {
    if (hardened.headers.has("Set-Cookie")) {
      hardened.headers.set("Cache-Control", "private, no-store");
    } else if (url.pathname.startsWith("/assets/")) {
      hardened.headers.set(
        "Cache-Control",
        "public, max-age=31536000, immutable",
      );
    } else if (
      url.pathname.startsWith("/r/")
      || url.pathname.startsWith("/styles/")
    ) {
      hardened.headers.set(
        "Cache-Control",
        "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      );
    } else if (
      hardened.headers.get("Content-Type")?.includes("text/html")
    ) {
      hardened.headers.set(
        "Cache-Control",
        "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
      );
    }
  }

  if (url.protocol === "https:") {
    hardened.headers.set(
      "Strict-Transport-Security",
      STRICT_TRANSPORT_SECURITY,
    );
  }

  return hardened;
}
