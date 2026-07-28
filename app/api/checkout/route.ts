import { commercialPlans } from "../../data/commercial";
import { resolveServerAccountAccess } from "../../../lib/commerce/server-access";
import {
  createStripeManagedPaymentsService,
  readStripeManagedPaymentsConfig,
  type CommercialPlanId,
} from "../../../lib/commerce/stripe-managed-payments";
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

const planIds = new Set<string>(commercialPlans.map((plan) => plan.id));

export async function POST(request: Request) {
  const access = await resolveServerAccountAccess({
    requireFreshMembership: true,
  });
  if (access.status !== "authenticated") {
    return privateJson({ error: "not_found_or_forbidden" }, 404);
  }
  if (process.env.STRIPE_CHECKOUT_ENABLED !== "true") {
    return privateJson({ error: "service_unavailable" }, 503);
  }

  const config = readStripeManagedPaymentsConfig();
  if (!config || request.headers.get("origin") !== config.applicationOrigin) {
    return privateJson({ error: "not_found_or_forbidden" }, 404);
  }

  const input = await readCheckoutInput(request);
  if (!input) {
    return privateJson({ error: "invalid_request" }, 400);
  }
  const rateLimit = await enforceDistributedRateLimit({
    policy: "checkout.create",
    request,
    accountId: access.accountId,
    workspaceId: access.workspaceId,
  });
  if (!rateLimit.allowed) {
    return distributedRateLimitResponse(rateLimit);
  }

  try {
    const checkout = await createStripeManagedPaymentsService(
      config,
    ).createHostedCheckout({
      idempotencyKey:
        `checkout:${access.accountId}:${input.requestId}`,
      accountId: access.accountId,
      workspaceId: access.workspaceId,
      commercialOfferRef: input.planId,
      returnPath: "/account/purchases",
      consent: {
        immediateSupplyRequested: true,
        cancellationLossAcknowledged: true,
        policyVersion: "2026-07-27",
        capturedAt: Date.now(),
      },
    });
    return privateJson(checkout, 201);
  } catch {
    return privateJson({ error: "service_unavailable" }, 503);
  }
}

async function readCheckoutInput(request: Request): Promise<{
  planId: CommercialPlanId;
  requestId: string;
} | null> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return null;
  }
  if (!body || typeof body !== "object") {
    return null;
  }
  const record = body as Record<string, unknown>;
  if (
    typeof record.planId !== "string"
    || !planIds.has(record.planId)
    || typeof record.requestId !== "string"
    || !/^[A-Za-z0-9][A-Za-z0-9._:-]{15,80}$/.test(record.requestId)
    || record.immediateSupplyRequested !== true
    || record.cancellationLossAcknowledged !== true
  ) {
    return null;
  }
  return {
    planId: record.planId as CommercialPlanId,
    requestId: record.requestId,
  };
}

function privateJson(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: PRIVATE_HEADERS });
}
