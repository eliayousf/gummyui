import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StripeSubscriptionLifecycleProjection } from "../lib/commerce/stripe-lifecycle";

const executeConvex = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("../db", () => ({ executeConvex }));

import { ConvexStripeLifecycleStore } from "../lib/commerce/stripe-convex-lifecycle-store";

const projection: StripeSubscriptionLifecycleProjection = {
  kind: "subscription",
  providerEventId: "evt_test_subscription_deleted",
  providerEventType: "customer.subscription.deleted",
  providerOccurredAt: 1_831_536_001_000,
  receivedAt: 1_831_536_001_500,
  payloadHash: "a".repeat(64),
  accountId: "account:stripe:test:001",
  workspaceId: "workspace:stripe:test:001",
  planId: "team-yearly",
  stripeSubscriptionId: "sub_test_team_yearly",
  stripeCustomerId: "cus_test_customer",
  subscriptionStatus: "canceled",
  accessStatus: "expired",
  currentPeriodStartsAt: 1_800_000_000_000,
  currentPeriodEndsAt: 1_831_536_000_000,
  cancelAtPeriodEnd: false,
  canceledAt: 1_831_536_001_000,
};

describe("Convex Stripe lifecycle adapter", () => {
  beforeEach(() => executeConvex.mockReset());

  it("uses the lifecycle mutation and preserves its result", async () => {
    executeConvex.mockResolvedValue("ignored");
    await expect(
      new ConvexStripeLifecycleStore().apply(projection),
    ).resolves.toBe("ignored");
    expect(executeConvex).toHaveBeenCalledWith(
      "stripe.lifecycle.apply",
      projection,
    );
  });
});
