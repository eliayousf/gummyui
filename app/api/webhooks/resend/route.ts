import {
  ConvexResendDeliveryStore,
  readResendWebhookConfig,
  ResendWebhookAdapter,
} from "../../../../lib/commerce/resend-webhook";
import { emitOperationalEvent } from "../../../../lib/commerce/operational-logging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_WEBHOOK_BYTES = 1_000_000;
const PRIVATE_HEADERS = {
  "cache-control": "private, no-store",
  "content-type": "application/json; charset=utf-8",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow, noarchive",
} as const;

export async function POST(request: Request) {
  if (process.env.RESEND_WEBHOOK_ENABLED !== "true") {
    return response({ error: "not_found" }, 404);
  }
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (
    !Number.isFinite(declaredLength)
    || declaredLength < 0
    || declaredLength > MAX_WEBHOOK_BYTES
  ) {
    return response({ error: "invalid_request" }, 413);
  }

  let config: ReturnType<typeof readResendWebhookConfig>;
  try {
    config = readResendWebhookConfig();
  } catch {
    return response({ error: "service_unavailable" }, 503);
  }
  if (!config) return response({ error: "service_unavailable" }, 503);

  const rawBody = new Uint8Array(await request.arrayBuffer());
  if (rawBody.byteLength > MAX_WEBHOOK_BYTES) {
    return response({ error: "invalid_request" }, 413);
  }

  let projection;
  try {
    projection = await new ResendWebhookAdapter(config).verify({
      rawBody,
      headers: request.headers,
    });
  } catch {
    await emitOperationalEvent({
      name: "resend.webhook.rejected",
      severity: "warning",
      outcome: "failure",
      attributes: { reason: "verification_failed" },
    });
    return response({ error: "invalid_request" }, 400);
  }
  if (!projection) {
    await emitOperationalEvent({
      name: "resend.webhook.ignored",
      severity: "info",
      outcome: "ignored",
      attributes: { reason: "unsupported_event" },
    });
    return response({ received: true, ignored: true }, 200);
  }

  try {
    const outcome = await new ConvexResendDeliveryStore().apply(projection);
    await emitOperationalEvent({
      name: "resend.delivery.updated",
      severity:
        projection.state === "delivered" ? "info" : "warning",
      outcome: outcome === "applied" ? "success" : "ignored",
      attributes: {
        state: projection.state,
        providerEventId: projection.providerEventId,
        providerMessageId: projection.providerMessageId,
        projectionOutcome: outcome,
      },
    });
    return response({ received: true, outcome }, 200);
  } catch {
    await emitOperationalEvent({
      name: "resend.webhook.deferred",
      severity: "error",
      outcome: "degraded",
      attributes: {
        state: projection.state,
        reason: "projection_unavailable",
      },
    });
    return response({ error: "service_unavailable" }, 503);
  }
}

function response(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, { status, headers: PRIVATE_HEADERS });
}
