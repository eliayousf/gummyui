import type Stripe from "stripe";
import type { NormalizedProviderEvent } from "./webhooks";

export type StripeAdjustmentAccessAction =
  | "unchanged"
  | "suspend"
  | "restore"
  | "revoke";

export interface StripeAdjustmentProjection {
  providerEventId: string;
  providerEventType: string;
  providerOccurredAt: number;
  receivedAt: number;
  payloadHash: string;
  stripeAdjustmentId: string;
  stripePaymentIntentId: string;
  kind: "refund" | "chargeback" | "chargeback_reversal";
  adjustmentStatus: "pending" | "processed" | "failed" | "reversed";
  amountMinor: number;
  currency: "USD";
  fullRefund: boolean;
  accessAction: StripeAdjustmentAccessAction;
}

export interface StripeAdjustmentStore {
  apply(
    projection: StripeAdjustmentProjection,
  ): Promise<"applied" | "duplicate" | "ignored">;
}

export function buildStripeAdjustmentProjection(input: {
  event: NormalizedProviderEvent<Stripe.Event>;
  adjustment: Stripe.Refund | Stripe.Dispute;
  payloadHash: string;
  receivedAt: number;
}): StripeAdjustmentProjection {
  if (
    input.event.aggregateType !== "adjustment"
    || input.event.aggregateId !== input.adjustment.id
  ) {
    throw new Error("Stripe adjustment event identity is invalid");
  }

  const base = {
    providerEventId: input.event.eventId,
    providerEventType: input.event.eventType,
    providerOccurredAt: input.event.occurredAt,
    receivedAt: input.receivedAt,
    payloadHash: requireSha256(input.payloadHash),
    stripeAdjustmentId: input.adjustment.id,
    stripePaymentIntentId: paymentIntentId(input.adjustment),
    amountMinor: requireAmount(input.adjustment.amount),
    currency: requireUsd(input.adjustment.currency),
  } as const;

  if (input.adjustment.object === "refund") {
    if (!input.event.eventType.startsWith("refund.")) {
      throw new Error("Stripe refund event type is invalid");
    }
    const status = normalizeRefundStatus(input.adjustment.status);
    const fullRefund = isFullRefund(input.adjustment);
    return {
      ...base,
      kind: "refund",
      adjustmentStatus: status,
      fullRefund,
      accessAction:
        status === "processed" && fullRefund ? "revoke" : "unchanged",
    };
  }

  if (!input.event.eventType.startsWith("charge.dispute.")) {
    throw new Error("Stripe dispute event type is invalid");
  }
  const disputeState = normalizeDisputeStatus(input.adjustment.status);
  return {
    ...base,
    kind:
      disputeState.accessAction === "restore"
        ? "chargeback_reversal"
        : "chargeback",
    adjustmentStatus: disputeState.adjustmentStatus,
    fullRefund: false,
    accessAction: disputeState.accessAction,
  };
}

function paymentIntentId(
  adjustment: Stripe.Refund | Stripe.Dispute,
): string {
  const direct = adjustment.payment_intent;
  const charge = adjustment.charge;
  const fromCharge =
    charge && typeof charge !== "string" ? charge.payment_intent : null;
  const value = direct ?? fromCharge;
  const id = typeof value === "string" ? value : value?.id;
  if (!id || !/^pi_[A-Za-z0-9_]+$/.test(id)) {
    throw new Error("Stripe adjustment PaymentIntent is invalid");
  }
  return id;
}

function isFullRefund(refund: Stripe.Refund): boolean {
  const charge = refund.charge;
  if (!charge || typeof charge === "string") {
    throw new Error("Stripe refund charge must be expanded");
  }
  if (
    !Number.isSafeInteger(charge.amount)
    || !Number.isSafeInteger(charge.amount_refunded)
    || charge.amount <= 0
    || charge.amount_refunded < 0
    || charge.amount_refunded > charge.amount
  ) {
    throw new Error("Stripe refund charge totals are invalid");
  }
  return charge.refunded === true
    && charge.amount_refunded === charge.amount;
}

function normalizeRefundStatus(
  value: string | null,
): StripeAdjustmentProjection["adjustmentStatus"] {
  switch (value) {
    case "pending":
    case "requires_action":
      return "pending";
    case "succeeded":
      return "processed";
    case "failed":
    case "canceled":
      return "failed";
    default:
      throw new Error("Stripe refund status is unsupported");
  }
}

function normalizeDisputeStatus(value: Stripe.Dispute.Status): {
  adjustmentStatus: StripeAdjustmentProjection["adjustmentStatus"];
  accessAction: StripeAdjustmentAccessAction;
} {
  switch (value) {
    case "warning_needs_response":
    case "warning_under_review":
    case "needs_response":
    case "under_review":
      return { adjustmentStatus: "pending", accessAction: "suspend" };
    case "lost":
      return { adjustmentStatus: "processed", accessAction: "revoke" };
    case "warning_closed":
    case "won":
    case "prevented":
      return { adjustmentStatus: "reversed", accessAction: "restore" };
  }
}

function requireAmount(value: number): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error("Stripe adjustment amount is invalid");
  }
  return value;
}

function requireUsd(value: string): "USD" {
  if (value.toUpperCase() !== "USD") {
    throw new Error("Stripe adjustment currency is unsupported");
  }
  return "USD";
}

function requireSha256(value: string): string {
  if (!/^[a-f0-9]{64}$/.test(value)) {
    throw new Error("Stripe webhook payload hash is invalid");
  }
  return value;
}
