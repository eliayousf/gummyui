import { ConvexStripeFulfillmentStore } from "../../../../lib/commerce/stripe-convex-store";
import { buildStripeFulfillmentProjection } from "../../../../lib/commerce/stripe-fulfillment";
import { buildStripeAdjustmentProjection } from "../../../../lib/commerce/stripe-adjustments";
import { buildStripeLifecycleProjection } from "../../../../lib/commerce/stripe-lifecycle";
import { ConvexStripeAdjustmentStore } from "../../../../lib/commerce/stripe-convex-adjustment-store";
import { ConvexStripeLifecycleStore } from "../../../../lib/commerce/stripe-convex-lifecycle-store";
import {
  createStripeCheckoutWebhookRuntime,
  readStripeCheckoutWebhookConfig,
} from "../../../../lib/commerce/stripe-managed-payments";

export const runtime = "nodejs";

const MAX_WEBHOOK_BYTES = 1_000_000;
const PRIVATE_HEADERS = {
  "cache-control": "private, no-store",
  "content-type": "application/json; charset=utf-8",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow, noarchive",
} as const;

export async function POST(request: Request) {
  if (process.env.STRIPE_WEBHOOK_ENABLED !== "true") {
    return privateJson({ error: "service_unavailable" }, 503);
  }

  let config: ReturnType<typeof readStripeCheckoutWebhookConfig>;
  try {
    config = readStripeCheckoutWebhookConfig();
  } catch {
    return privateJson({ error: "service_unavailable" }, 503);
  }
  if (!config) {
    return privateJson({ error: "service_unavailable" }, 503);
  }
  const stripeConfig = config;

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BYTES) {
    return privateJson({ error: "payload_too_large" }, 413);
  }

  let rawBody: Uint8Array;
  try {
    rawBody = new Uint8Array(await request.arrayBuffer());
  } catch {
    return privateJson({ error: "invalid_request" }, 400);
  }
  if (rawBody.byteLength === 0 || rawBody.byteLength > MAX_WEBHOOK_BYTES) {
    return privateJson(
      {
        error:
          rawBody.byteLength > MAX_WEBHOOK_BYTES
            ? "payload_too_large"
            : "invalid_request",
      },
      rawBody.byteLength > MAX_WEBHOOK_BYTES ? 413 : 400,
    );
  }

  const receivedAt = Date.now();
  const stripe = createStripeCheckoutWebhookRuntime(stripeConfig);
  const verification = await stripe.adapter.verify({
    rawBody,
    headers: request.headers,
    receivedAt,
  });
  if (!verification.verified) {
    return privateJson({ error: "invalid_webhook" }, 400);
  }
  const verifiedEvent = verification.event;
  const payloadHash = verification.payloadHash;

  try {
    const status = verifiedEvent.aggregateType === "purchase"
      ? await applyCheckoutProjection()
      : verifiedEvent.aggregateType === "adjustment"
      ? await applyAdjustmentProjection()
      : await applyLifecycleProjection();
    return privateJson({ received: true, status }, 200);

    async function applyCheckoutProjection() {
      const checkout = await stripe.sessions.retrieve(
        verifiedEvent.aggregateId,
      );
      const projection = buildStripeFulfillmentProjection({
        event: verifiedEvent,
        checkout,
        payloadHash,
        receivedAt,
        priceIds: stripeConfig.priceIds,
      });
      return new ConvexStripeFulfillmentStore().apply(projection);
    }

    async function applyLifecycleProjection() {
      const invoice = verifiedEvent.aggregateType === "invoice"
        ? await stripe.invoices.retrieve(verifiedEvent.aggregateId)
        : undefined;
      const invoicePaymentIntentId = invoice
        ? await stripe.invoicePayments.retrieve(invoice.id)
        : undefined;
      const projection = buildStripeLifecycleProjection({
        event: verifiedEvent,
        invoice,
        invoicePaymentIntentId,
        payloadHash,
        receivedAt,
        priceIds: stripeConfig.priceIds,
      });
      return projection
        ? new ConvexStripeLifecycleStore().apply(projection)
        : "ignored";
    }

    async function applyAdjustmentProjection() {
      const adjustment = await stripe.adjustments.retrieve(
        verifiedEvent.eventType,
        verifiedEvent.aggregateId,
      );
      const projection = buildStripeAdjustmentProjection({
        event: verifiedEvent,
        adjustment,
        payloadHash,
        receivedAt,
      });
      return new ConvexStripeAdjustmentStore().apply(projection);
    }
  } catch {
    // A retryable response prevents Stripe from treating a verified event as
    // fulfilled before its provider-authoritative state is durably projected.
    return privateJson({ error: "projection_unavailable" }, 503);
  }
}

function privateJson(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: PRIVATE_HEADERS });
}
