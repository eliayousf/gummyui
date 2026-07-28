import { cancelAccountDeletion } from "../../../../../lib/commerce/privacy-operations";
import { resolveServerAccountAccess } from "../../../../../lib/commerce/server-access";
import {
  distributedRateLimitResponse,
  enforceDistributedRateLimit,
} from "../../../../../lib/commerce/rate-limit";

export const runtime = "nodejs";

const PRIVATE_HEADERS = {
  "cache-control": "private, no-store",
  "content-type": "application/json; charset=utf-8",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow, noarchive",
} as const;

export async function DELETE(
  request: Request,
  context: { params: Promise<{ deletionId: string }> },
) {
  const access = await resolveServerAccountAccess({
    requireFreshMembership: true,
  });
  if (
    access.status !== "authenticated"
    || !validMutationRequest(request)
  ) {
    return hiddenDenial();
  }
  const rateLimit = await enforceDistributedRateLimit({
    policy: "privacy.deletion.cancel",
    request,
    accountId: access.accountId,
    workspaceId: access.workspaceId,
  });
  if (!rateLimit.allowed) {
    return distributedRateLimitResponse(rateLimit);
  }
  const { deletionId } = await context.params;
  try {
    const cancelled = await cancelAccountDeletion({
      access,
      deletionId: decodeURIComponent(deletionId),
    });
    return cancelled
      ? Response.json(
          { cancelled: true },
          { status: 200, headers: PRIVATE_HEADERS },
        )
      : hiddenDenial();
  } catch {
    return Response.json(
      { error: "service_unavailable" },
      { status: 503, headers: PRIVATE_HEADERS },
    );
  }
}

function validMutationRequest(request: Request): boolean {
  const origin = process.env.GUMMYUI_ORIGIN?.trim();
  return Boolean(
    origin
    && request.headers.get("origin") === new URL(origin).origin
    && request.headers.get("content-type")?.split(";", 1)[0]
      === "application/json",
  );
}

function hiddenDenial(): Response {
  return Response.json(
    { error: "not_found_or_forbidden" },
    { status: 404, headers: PRIVATE_HEADERS },
  );
}
