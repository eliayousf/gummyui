import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StripeFulfillmentProjection } from "../lib/commerce/stripe-fulfillment";

const executeConvex = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("../db", () => ({ executeConvex }));

import { ConvexStripeFulfillmentStore } from "../lib/commerce/stripe-convex-store";

const projection: StripeFulfillmentProjection = {
  providerEventId: "evt_test_store",
  providerEventType: "checkout.session.completed",
  providerOccurredAt: 1_800_000_001_000,
  receivedAt: 1_800_000_001_500,
  payloadHash: "a".repeat(64),
  checkoutSessionId: "cs_test_store",
  stripeCustomerId: "cus_test_store",
  stripePaymentIntentId: null,
  stripeSubscriptionId: "sub_test_store",
  accountId: "account:stripe:test:001",
  workspaceId: "workspace:stripe:test:001",
  planId: "team-yearly",
  billingInterval: "year",
  purchaseStatus: "completed",
  currency: "USD",
  amountMinor: 78_900,
  purchasedAt: 1_800_000_000_000,
  consentCapturedAt: 1_800_000_000_000,
  consentPolicyVersion: "2026-07-27",
  seatLimit: 5,
  entitlementScope: "workspace",
  subscriptionCurrentPeriodStartsAt: 1_800_000_000_000,
  subscriptionCurrentPeriodEndsAt: 1_831_536_000_000,
  subscriptionCancelAtPeriodEnd: false,
  updatesUntil: 1_831_536_000_000,
  productRefs: [
    "gummy-ui-pro-blocks",
    "gummy-ui-pro-templates",
    "gummy-ui-pro-design-kit",
  ],
};

describe("Convex Stripe fulfillment adapter", () => {
  beforeEach(() => executeConvex.mockReset());

  it("sends the validated projection to the atomic Convex mutation", async () => {
    executeConvex.mockResolvedValue("applied");
    await expect(
      new ConvexStripeFulfillmentStore().apply(projection),
    ).resolves.toBe("applied");
    expect(executeConvex).toHaveBeenCalledWith(
      "stripe.fulfillment.apply",
      projection,
    );
  });

  it("preserves Convex duplicate results", async () => {
    executeConvex.mockResolvedValue("duplicate");
    await expect(
      new ConvexStripeFulfillmentStore().apply(projection),
    ).resolves.toBe("duplicate");
  });
});
