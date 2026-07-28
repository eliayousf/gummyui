import { withAuth } from "@workos-inc/authkit-nextjs";
import { resolveServerAccountAccess } from
  "../../../../lib/commerce/server-access";
import {
  readWorkOSTeamConfig,
  WorkOSTeamService,
} from "../../../../lib/commerce/workos-team";
import {
  distributedRateLimitResponse,
  enforceDistributedRateLimit,
} from "../../../../lib/commerce/rate-limit";

export const runtime = "nodejs";

const PRIVATE_HEADERS = {
  "cache-control": "private, no-store",
  "content-type": "application/json; charset=utf-8",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow, noarchive",
} as const;

export async function POST(request: Request) {
  const access = await resolveServerAccountAccess({
    requireFreshMembership: true,
  });
  let config: ReturnType<typeof readWorkOSTeamConfig>;
  try {
    config = readWorkOSTeamConfig();
  } catch {
    config = null;
  }
  if (
    access.status !== "authenticated"
    || !config
    || !validMutationRequest(request, config.applicationOrigin)
  ) {
    return hiddenDenial();
  }
  let input: { email?: unknown; role?: unknown };
  try {
    input = await request.json() as typeof input;
  } catch {
    return hiddenDenial();
  }
  if (
    typeof input.email !== "string"
    || (
      input.role !== undefined
      && input.role !== "member"
      && input.role !== "viewer"
    )
  ) {
    return hiddenDenial();
  }
  const rateLimit = await enforceDistributedRateLimit({
    policy: "team.invitation",
    request,
    accountId: access.accountId,
    workspaceId: access.workspaceId,
  });
  if (!rateLimit.allowed) {
    return distributedRateLimitResponse(rateLimit);
  }
  try {
    const auth = await withAuth();
    if (!auth.user || !auth.organizationId) return hiddenDenial();
    const result = await new WorkOSTeamService(config).sendInvitation({
      access,
      user: auth.user,
      organizationId: auth.organizationId,
      email: input.email,
      role: input.role,
    });
    return Response.json(result, {
      status: 201,
      headers: PRIVATE_HEADERS,
    });
  } catch {
    return Response.json(
      { error: "invitation_unavailable" },
      { status: 409, headers: PRIVATE_HEADERS },
    );
  }
}

function validMutationRequest(request: Request, origin: string): boolean {
  return request.headers.get("origin") === origin
    && request.headers.get("content-type")?.split(";", 1)[0]
      === "application/json";
}

function hiddenDenial(): Response {
  return Response.json(
    { error: "not_found_or_forbidden" },
    { status: 404, headers: PRIVATE_HEADERS },
  );
}
