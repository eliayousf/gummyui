import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { readWorkOSIdentityConfig } from "../../../lib/commerce/workos-identity";
import {
  distributedRateLimitResponse,
  enforceDistributedRateLimit,
} from "../../../lib/commerce/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimit = await enforceDistributedRateLimit({
    policy: "auth.sign_in",
    request,
  });
  if (!rateLimit.allowed) {
    return distributedRateLimitResponse(rateLimit);
  }
  if (!configured()) {
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
  const organizationId =
    new URL(request.url).searchParams.get("organizationId");
  if (
    organizationId !== null
    && !/^[A-Za-z0-9][A-Za-z0-9_-]{5,127}$/u.test(organizationId)
  ) {
    return Response.json(
      { error: "not_found_or_forbidden" },
      {
        status: 404,
        headers: {
          "cache-control": "private, no-store",
          "x-content-type-options": "nosniff",
          "x-robots-tag": "noindex, nofollow, noarchive",
        },
      },
    );
  }
  redirect(await getSignInUrl({
    returnTo: "/account",
    organizationId: organizationId ?? undefined,
  }));
}

function configured(): boolean {
  try {
    const config = readWorkOSIdentityConfig();
    if (!config && process.env.NODE_ENV !== "test") {
      console.warn(JSON.stringify({
        event: "auth.configuration.unavailable",
        missing: [
          ["WORKOS_CLIENT_ID", process.env.WORKOS_CLIENT_ID],
          ["WORKOS_API_KEY", process.env.WORKOS_API_KEY],
          ["WORKOS_COOKIE_PASSWORD", process.env.WORKOS_COOKIE_PASSWORD],
          ["WORKOS_REDIRECT_URI", process.env.WORKOS_REDIRECT_URI],
          [
            "NEXT_PUBLIC_WORKOS_REDIRECT_URI",
            process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI,
          ],
          ["GUMMYUI_ORIGIN", process.env.GUMMYUI_ORIGIN],
        ]
          .filter(([, value]) => !value?.trim())
          .map(([name]) => name),
      }));
    }
    return config !== null;
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.warn(JSON.stringify({
        event: "auth.configuration.invalid",
        reason: error instanceof Error
          ? error.message
          : "Unknown WorkOS configuration error",
      }));
    }
    return false;
  }
}
