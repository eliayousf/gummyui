import { executeConvex } from "../../../db";
import { resolveServerAccountAccess } from
  "../../../lib/commerce/server-access";
import {
  distributedRateLimitResponse,
  enforceDistributedRateLimit,
} from "../../../lib/commerce/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const access = await resolveServerAccountAccess({
    requireFreshMembership: true,
  });
  if (access.status !== "authenticated") {
    return hiddenDenial();
  }
  const rateLimit = await enforceDistributedRateLimit({
    policy: "billing.portal",
    request,
    accountId: access.accountId,
    workspaceId: access.workspaceId,
  });
  if (!rateLimit.allowed) {
    return distributedRateLimitResponse(rateLimit);
  }
  try {
    const customerId = await executeConvex<string | null>(
      "billing.customer",
      {
        accountId: access.accountId,
        workspaceId: access.workspaceId,
        role: access.role,
      },
    );
    if (!customerId || !/^cus_[A-Za-z0-9]+$/u.test(customerId)) {
      return hiddenDenial();
    }
    // Managed Payments orders are managed by the customer through Link.
    // A standard Stripe Billing Portal session is not the authoritative
    // post-purchase surface for "Sold through Link" transactions.
    return Response.redirect("https://link.com/", 303);
  } catch {
    return unavailable();
  }
}

function hiddenDenial(): Response {
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

function unavailable(): Response {
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
