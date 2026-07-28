import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import type { NormalizedProviderEvent } from "../lib/commerce/webhooks";

const executeConvex = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("../db", () => ({ executeConvex }));

import {
  buildStripeAdjustmentProjection,
  type StripeAdjustmentProjection,
} from "../lib/commerce/stripe-adjustments";
import { ConvexStripeAdjustmentStore } from "../lib/commerce/stripe-convex-adjustment-store";

function event(
  type: string,
  adjustmentId: string,
): NormalizedProviderEvent<Stripe.Event> {
  return {
    providerKind: "stripe",
    eventId: `evt_${adjustmentId}_${type.replaceAll(".", "_")}`,
    eventType: type,
    aggregateType: "adjustment",
    aggregateId: adjustmentId,
    occurredAt: 1_800_000_001_000,
    payload: {} as Stripe.Event,
  };
}

function refund(overrides: Partial<Stripe.Refund> = {}): Stripe.Refund {
  return {
    id: "re_test_full",
    object: "refund",
    amount: 2_900,
    currency: "usd",
    payment_intent: "pi_test_purchase",
    charge: {
      id: "ch_test_purchase",
      object: "charge",
      amount: 2_900,
      amount_refunded: 2_900,
      refunded: true,
      payment_intent: "pi_test_purchase",
    } as Stripe.Charge,
    status: "succeeded",
    ...overrides,
  } as Stripe.Refund;
}

function dispute(
  overrides: Partial<Stripe.Dispute> = {},
): Stripe.Dispute {
  return {
    id: "dp_test_purchase",
    object: "dispute",
    amount: 2_900,
    currency: "usd",
    payment_intent: "pi_test_purchase",
    charge: "ch_test_purchase",
    status: "needs_response",
    ...overrides,
  } as Stripe.Dispute;
}

describe("Stripe refund and dispute projection", () => {
  it("revokes access only after an authoritative full successful refund", () => {
    expect(
      buildStripeAdjustmentProjection({
        event: event("refund.updated", "re_test_full"),
        adjustment: refund(),
        payloadHash: "a".repeat(64),
        receivedAt: 1_800_000_001_500,
      }),
    ).toMatchObject({
      kind: "refund",
      adjustmentStatus: "processed",
      fullRefund: true,
      accessAction: "revoke",
      stripePaymentIntentId: "pi_test_purchase",
    });
  });

  it("records a partial refund without revoking the whole product", () => {
    const projection = buildStripeAdjustmentProjection({
      event: event("refund.updated", "re_test_partial"),
      adjustment: refund({
        id: "re_test_partial",
        amount: 1_000,
        charge: {
          id: "ch_test_purchase",
          object: "charge",
          amount: 2_900,
          amount_refunded: 1_000,
          refunded: false,
          payment_intent: "pi_test_purchase",
        } as Stripe.Charge,
      }),
      payloadHash: "b".repeat(64),
      receivedAt: 1_800_000_001_500,
    });

    expect(projection).toMatchObject({
      adjustmentStatus: "processed",
      fullRefund: false,
      accessAction: "unchanged",
    });
  });

  it("suspends an open dispute, revokes a lost one and restores a won one", () => {
    const states = [
      ["needs_response", "pending", "suspend", "chargeback"],
      ["lost", "processed", "revoke", "chargeback"],
      ["won", "reversed", "restore", "chargeback_reversal"],
    ] as const;

    for (const [status, adjustmentStatus, accessAction, kind] of states) {
      const projection = buildStripeAdjustmentProjection({
        event: event("charge.dispute.updated", "dp_test_purchase"),
        adjustment: dispute({ status }),
        payloadHash: "c".repeat(64),
        receivedAt: 1_800_000_001_500,
      });
      expect(projection).toMatchObject({
        adjustmentStatus,
        accessAction,
        kind,
      });
    }
  });

  it("fails closed for an unexpanded refund charge or unknown target payment", () => {
    expect(() =>
      buildStripeAdjustmentProjection({
        event: event("refund.updated", "re_test_full"),
        adjustment: refund({ charge: "ch_test_purchase" }),
        payloadHash: "d".repeat(64),
        receivedAt: 1_800_000_001_500,
      })).toThrow("charge must be expanded");
  });
});

const storeProjection: StripeAdjustmentProjection = {
  providerEventId: "evt_test_refund_store",
  providerEventType: "refund.updated",
  providerOccurredAt: 1_800_000_001_000,
  receivedAt: 1_800_000_001_500,
  payloadHash: "e".repeat(64),
  stripeAdjustmentId: "re_test_store",
  stripePaymentIntentId: "pi_test_purchase",
  kind: "refund",
  adjustmentStatus: "processed",
  amountMinor: 2_900,
  currency: "USD",
  fullRefund: true,
  accessAction: "revoke",
};

describe("Convex Stripe adjustment adapter", () => {
  beforeEach(() => {
    executeConvex.mockReset();
  });

  it("sends the validated projection to the atomic Convex mutation", async () => {
    executeConvex.mockResolvedValue("applied");
    await expect(
      new ConvexStripeAdjustmentStore().apply(storeProjection),
    ).resolves.toBe("applied");
    expect(executeConvex).toHaveBeenCalledWith(
      "stripe.adjustment.apply",
      storeProjection,
    );
  });

  it("keeps missing or ambiguous local targets retryable", async () => {
    executeConvex.mockRejectedValue(
      new Error("Stripe adjustment target is unavailable"),
    );
    await expect(
      new ConvexStripeAdjustmentStore().apply(storeProjection),
    ).rejects.toThrow("target is unavailable");
  });

  it("reports identical applied events as duplicates", async () => {
    executeConvex.mockResolvedValue("duplicate");
    await expect(
      new ConvexStripeAdjustmentStore().apply(storeProjection),
    ).resolves.toBe("duplicate");
  });
});
