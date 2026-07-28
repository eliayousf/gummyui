import { signOut } from "@workos-inc/authkit-nextjs";
import type { NextRequest } from "next/server";
import { readWorkOSIdentityConfig } from "../../../lib/commerce/workos-identity";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  let config;
  try {
    config = readWorkOSIdentityConfig();
  } catch {
    config = null;
  }
  if (!config) {
    return Response.json(
      { error: "service_unavailable" },
      {
        status: 503,
        headers: {
          "cache-control": "private, no-store",
          "x-content-type-options": "nosniff",
          "x-robots-tag": "noindex, nofollow, noarchive",
        },
      },
    );
  }
  return signOut({ returnTo: new URL("/", request.url).toString() });
}
