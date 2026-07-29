import {
  stripeReadinessFailureCode,
  verifyStripeProductionReadiness,
} from "../../../../lib/commerce/stripe-production-readiness";
import {
  emitOperationalEvent,
} from "../../../../lib/commerce/operational-logging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

  try {
    const result = await verifyStripeProductionReadiness();
    await emitOperationalEvent({
      name: "stripe.production.readiness",
      severity: "info",
      outcome: "success",
      attributes: {
        credential: result.credential,
        checkout: result.checkout,
        verifiedPrices: result.verifiedPrices,
      },
    });
    return Response.json(
      { ok: true, ...result },
      { status: 200, headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    await emitOperationalEvent({
      name: "stripe.production.readiness",
      severity: "error",
      outcome: "failure",
      attributes: { reason: stripeReadinessFailureCode(error) },
    });
    return Response.json(
      { error: "provider_unavailable" },
      { status: 503, headers: PRIVATE_HEADERS },
    );
  }
}
