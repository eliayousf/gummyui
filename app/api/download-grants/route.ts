import {
  issueAuthorizedDownloadGrant,
  readDownloadGrantConfig,
} from "../../../lib/commerce/convex-downloads";
import { opaqueId } from "../../../lib/commerce/model";
import { resolveServerAccountAccess } from "../../../lib/commerce/server-access";
import {
  distributedRateLimitResponse,
  enforceDistributedRateLimit,
} from "../../../lib/commerce/rate-limit";

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
  if (access.status !== "authenticated") {
    return hiddenDenial();
  }
  let config;
  try {
    config = readDownloadGrantConfig();
  } catch {
    config = null;
  }
  if (
    !config
    || request.headers.get("origin") !== config.applicationOrigin
    || request.headers.get("content-type")?.split(";", 1)[0]
      !== "application/json"
  ) {
    return hiddenDenial();
  }

  let releaseId;
  try {
    const body = await request.json() as { releaseId?: unknown };
    if (typeof body.releaseId !== "string") {
      return hiddenDenial();
    }
    releaseId = opaqueId(body.releaseId, "release");
  } catch {
    return hiddenDenial();
  }

  const rateLimit = await enforceDistributedRateLimit({
    policy: "download.grant",
    request,
    accountId: access.accountId,
    workspaceId: access.workspaceId,
  });
  if (!rateLimit.allowed) {
    return distributedRateLimitResponse(rateLimit);
  }

  try {
    const grant = await issueAuthorizedDownloadGrant({
      accountId: access.accountId,
      workspaceId: access.workspaceId,
      role: access.role,
      releaseId,
      now: Date.now(),
      config,
    });
    if (!grant) {
      return hiddenDenial();
    }
    return Response.json(grant, {
      status: 201,
      headers: PRIVATE_HEADERS,
    });
  } catch {
    return Response.json(
      { error: "service_unavailable" },
      { status: 503, headers: PRIVATE_HEADERS },
    );
  }
}

function hiddenDenial(): Response {
  return Response.json(
    { error: "not_found_or_forbidden" },
    { status: 404, headers: PRIVATE_HEADERS },
  );
}
