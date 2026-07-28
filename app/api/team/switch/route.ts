import {
  getWorkOS,
  switchToOrganization,
  withAuth,
} from "@workos-inc/authkit-nextjs";
import { readWorkOSTeamConfig } from
  "../../../../lib/commerce/workos-team";
import {
  distributedRateLimitResponse,
  enforceDistributedRateLimit,
} from "../../../../lib/commerce/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let config: ReturnType<typeof readWorkOSTeamConfig>;
  try {
    config = readWorkOSTeamConfig();
  } catch {
    config = null;
  }
  if (!config) return hiddenDenial();
  if (
    request.headers.get("origin") !== config.applicationOrigin
    || request.headers.get("content-type")?.split(";", 1)[0]
      !== "application/json"
  ) {
    return hiddenDenial();
  }
  let input: { organizationId?: unknown };
  try {
    input = await request.json() as typeof input;
  } catch {
    return hiddenDenial();
  }
  const organizationId = input.organizationId;
  if (
    typeof organizationId !== "string"
    || !/^[A-Za-z0-9][A-Za-z0-9_-]{5,127}$/u.test(organizationId)
  ) {
    return hiddenDenial();
  }
  try {
    const auth = await withAuth();
    if (!auth.user) return hiddenDenial();
    const rateLimit = await enforceDistributedRateLimit({
      policy: "team.switch",
      request,
      providerSubject: auth.user.id,
    });
    if (!rateLimit.allowed) {
      return distributedRateLimitResponse(rateLimit);
    }
    const memberships =
      await getWorkOS().userManagement.listOrganizationMemberships({
        organizationId,
        userId: auth.user.id,
        statuses: ["active"],
        limit: 10,
      });
    if (
      !memberships.data.some(
        (membership) =>
          membership.organizationId === organizationId
          && membership.userId === auth.user!.id
          && membership.status === "active",
      )
    ) {
      return hiddenDenial();
    }
    await switchToOrganization(organizationId, {
      revalidationStrategy: "none",
    });
    return new Response(null, {
      status: 204,
      headers: {
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
        "x-robots-tag": "noindex, nofollow, noarchive",
      },
    });
  } catch {
    return hiddenDenial();
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
