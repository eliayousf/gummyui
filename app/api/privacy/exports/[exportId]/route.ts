import { createDataExportResponse } from "../../../../../lib/commerce/privacy-operations";
import { resolveServerAccountAccess } from "../../../../../lib/commerce/server-access";
import {
  distributedRateLimitResponse,
  enforceDistributedRateLimit,
} from "../../../../../lib/commerce/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIVATE_HEADERS = {
  "cache-control": "private, no-store",
  "content-type": "application/json; charset=utf-8",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow, noarchive",
} as const;

export async function GET(
  request: Request,
  context: { params: Promise<{ exportId: string }> },
) {
  const access = await resolveServerAccountAccess({
    requireFreshMembership: true,
  });
  if (access.status !== "authenticated") {
    return hiddenDenial();
  }
  const rateLimit = await enforceDistributedRateLimit({
    policy: "privacy.export.download",
    request,
    accountId: access.accountId,
    workspaceId: access.workspaceId,
  });
  if (!rateLimit.allowed) {
    return distributedRateLimitResponse(rateLimit);
  }
  const { exportId } = await context.params;
  try {
    const response = await createDataExportResponse({
      access,
      exportId: decodeURIComponent(exportId),
    });
    return response ?? hiddenDenial();
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
