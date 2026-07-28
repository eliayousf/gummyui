import { requestAccountDeletion } from "../../../../lib/commerce/privacy-operations";
import { resolveServerAccountAccess } from "../../../../lib/commerce/server-access";
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
  if (
    access.status !== "authenticated"
    || !validMutationRequest(request)
  ) {
    return hiddenDenial();
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return hiddenDenial();
  }
  if (
    !body
    || typeof body !== "object"
    || (body as { confirmation?: unknown }).confirmation !== "DELETE"
  ) {
    return Response.json(
      { error: "confirmation_required" },
      { status: 400, headers: PRIVATE_HEADERS },
    );
  }
  const rateLimit = await enforceDistributedRateLimit({
    policy: "privacy.deletion.request",
    request,
    accountId: access.accountId,
    workspaceId: access.workspaceId,
  });
  if (!rateLimit.allowed) {
    return distributedRateLimitResponse(rateLimit);
  }
  try {
    const result = await requestAccountDeletion(access);
    return Response.json(result, {
      status: result.status === "blocked" ? 409 : 202,
      headers: PRIVATE_HEADERS,
    });
  } catch {
    return Response.json(
      { error: "request_unavailable" },
      { status: 409, headers: PRIVATE_HEADERS },
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
