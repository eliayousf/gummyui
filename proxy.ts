import { authkitProxy } from "@workos-inc/authkit-nextjs";
import { NextResponse } from "next/server";

// AuthKit requires a redirect URI even while identity is intentionally
// unconfigured. The public fallback is not a credential and lets protected
// routes render their fail-closed unavailable state during local and recovery
// operation; real sign-in still requires the complete server-side config.
const redirectUri =
  process.env.WORKOS_REDIRECT_URI?.trim()
  || "https://gummyui.dev/auth/callback";
const publicRedirectUri =
  process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI?.trim();

const workosConfigured = Boolean(
  process.env.WORKOS_CLIENT_ID?.trim()
  && process.env.WORKOS_API_KEY?.trim()
  && (process.env.WORKOS_COOKIE_PASSWORD?.trim().length ?? 0) >= 32
  && process.env.WORKOS_REDIRECT_URI?.trim()
  && publicRedirectUri
  && redirectUri === publicRedirectUri
  && process.env.GUMMYUI_ORIGIN?.trim(),
);

export default workosConfigured
  ? authkitProxy({ redirectUri })
  : () => NextResponse.next();

export const config = {
  matcher: [
    "/account/:path*",
    "/api/checkout",
    "/api/billing-portal",
    "/api/download-grants",
    "/api/privacy/:path*",
    "/api/team/:path*",
    "/downloads/:path*",
    "/auth/:path*",
  ],
};
