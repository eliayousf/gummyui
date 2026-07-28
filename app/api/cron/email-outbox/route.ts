import {
  readResendOutboxConfig,
  ResendOutboxWorker,
} from "../../../../lib/commerce/resend-outbox";
import { emitOperationalEvent } from "../../../../lib/commerce/operational-logging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIVATE_HEADERS = {
  "cache-control": "private, no-store",
  "content-type": "application/json; charset=utf-8",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow, noarchive",
} as const;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (
    !secret
    || secret.length < 32
    || request.headers.get("authorization") !== `Bearer ${secret}`
  ) {
    return Response.json(
      { error: "not_found" },
      { status: 404, headers: PRIVATE_HEADERS },
    );
  }

  let config: ReturnType<typeof readResendOutboxConfig>;
  try {
    config = readResendOutboxConfig();
  } catch {
    return Response.json(
      { error: "service_unavailable" },
      { status: 503, headers: PRIVATE_HEADERS },
    );
  }
  if (!config) {
    return Response.json(
      { error: "service_unavailable" },
      { status: 503, headers: PRIVATE_HEADERS },
    );
  }

  try {
    const result = await new ResendOutboxWorker(config).drain();
    await emitOperationalEvent({
      name: "resend.outbox.drained",
      severity: result.deadLettered > 0 ? "warning" : "info",
      outcome: result.deadLettered > 0 ? "degraded" : "success",
      attributes: result,
    });
    return Response.json(
      { ok: true, ...result },
      { status: 200, headers: PRIVATE_HEADERS },
    );
  } catch {
    await emitOperationalEvent({
      name: "resend.outbox.unavailable",
      severity: "error",
      outcome: "failure",
      attributes: { reason: "worker_unavailable" },
    });
    return Response.json(
      { error: "worker_unavailable" },
      { status: 503, headers: PRIVATE_HEADERS },
    );
  }
}
