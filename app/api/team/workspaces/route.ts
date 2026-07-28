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
  let input: { name?: unknown; requestId?: unknown };
  try {
    input = await request.json() as typeof input;
  } catch {
    return hiddenDenial();
  }
  if (
    typeof input.name !== "string"
    || typeof input.requestId !== "string"
  ) {
    return hiddenDenial();
  }
  const rateLimit = await enforceDistributedRateLimit({
    policy: "team.workspace",
    request,
    accountId: access.accountId,
    workspaceId: access.workspaceId,
  });
  if (!rateLimit.allowed) {
    return distributedRateLimitResponse(rateLimit);
  }
  try {
    const auth = await withAuth();
    if (!auth.user) return hiddenDenial();
    const result = await new WorkOSTeamService(config).createWorkspace({
      access,
      user: auth.user,
      name: input.name,
      requestId: input.requestId,
    });
    return Response.json(result, {
      status: 201,
      headers: PRIVATE_HEADERS,
    });
  } catch {
    return Response.json(
      { error: "workspace_unavailable" },
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
