import {
  ConvexWorkOSWebhookStore,
  readWorkOSWebhookConfig,
  WorkOSWebhookAdapter,
} from "../../../../lib/commerce/workos-webhook";

export const runtime = "nodejs";

const PRIVATE_HEADERS = {
  "cache-control": "private, no-store",
  "content-type": "application/json; charset=utf-8",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow, noarchive",
} as const;

export async function POST(request: Request) {
  if (process.env.WORKOS_WEBHOOK_ENABLED !== "true") {
    return privateJson({ error: "service_unavailable" }, 503);
  }
  let config;
  try {
    config = readWorkOSWebhookConfig();
  } catch {
    config = null;
  }
  if (!config) {
    return privateJson({ error: "service_unavailable" }, 503);
  }
  const rawBody = await request.text();
  if (!rawBody || new TextEncoder().encode(rawBody).byteLength > 1_048_576) {
    return privateJson({ error: "invalid_request" }, 400);
  }

  try {
    const projection = await new WorkOSWebhookAdapter(config).verify({
      rawBody,
      signature: request.headers.get("workos-signature"),
    });
    if (!projection) {
      return privateJson({ received: true, applied: false }, 200);
    }
    const result = await new ConvexWorkOSWebhookStore().apply(projection);
    return privateJson({
      received: true,
      applied: result === "applied",
    }, 200);
  } catch {
    return privateJson({ error: "service_unavailable" }, 503);
  }
}

function privateJson(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: PRIVATE_HEADERS });
}
