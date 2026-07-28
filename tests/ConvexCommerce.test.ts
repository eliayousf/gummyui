/// <reference types="vite/client" />

import { anyApi } from "convex/server";
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import schema from "../convex/schema";

const modules = import.meta.glob("../convex/**/*.ts");
const SERVER_SECRET = "convex-test-secret-".padEnd(40, "x");

function commerceTest() {
  const test = convexTest(schema, modules);
  const execute = (operation: string, input: unknown) =>
    test.mutation(anyApi.commerce.execute, {
      serverSecret: SERVER_SECRET,
      operation,
      input,
    });
  return { test, execute };
}

const fulfillment = {
  providerEventId: "evt_checkout_001",
  providerEventType: "checkout.session.completed",
  providerOccurredAt: 1_800_000_000_000,
  receivedAt: 1_800_000_000_100,
  payloadHash: "a".repeat(64),
  checkoutSessionId: "cs_test_001",
  stripeCustomerId: "cus_test_001",
  stripePaymentIntentId: "pi_test_001",
  stripeSubscriptionId: "sub_test_001",
  accountId: "account:workos:user_test_001",
  workspaceId: "workspace:workos-personal:user_test_001",
  planId: "individual-monthly",
  billingInterval: "month",
  purchaseStatus: "completed",
  currency: "USD",
  amountMinor: 4_900,
  purchasedAt: 1_800_000_000_000,
  consentCapturedAt: 1_800_000_000_000,
  consentPolicyVersion: "2026-07-27",
  seatLimit: 1,
  entitlementScope: "account",
  subscriptionCurrentPeriodStartsAt: 1_800_000_000_000,
  subscriptionCurrentPeriodEndsAt: 1_802_678_400_000,
  subscriptionCancelAtPeriodEnd: false,
  updatesUntil: 1_802_678_400_000,
  productRefs: ["gummy-ui-pro-blocks"],
} as const;

describe("Convex commerce backend", () => {
  const previousSecret = process.env.CONVEX_SERVER_SECRET;

  beforeEach(() => {
    process.env.CONVEX_SERVER_SECRET = SERVER_SECRET;
  });

  afterEach(() => {
    if (previousSecret === undefined) {
      delete process.env.CONVEX_SERVER_SECRET;
    } else {
      process.env.CONVEX_SERVER_SECRET = previousSecret;
    }
  });

  it("atomically projects a paid checkout and rejects event substitution", async () => {
    const { test, execute } = commerceTest();

    await expect(
      execute("stripe.fulfillment.apply", fulfillment),
    ).resolves.toBe("applied");
    await expect(
      execute("stripe.fulfillment.apply", fulfillment),
    ).resolves.toBe("duplicate");
    await expect(
      execute("stripe.fulfillment.apply", {
        ...fulfillment,
        payloadHash: "b".repeat(64),
      }),
    ).rejects.toThrow("identity conflict");

    const state = await test.run(async (ctx) => ({
      events: await ctx.db.query("providerEvents").collect(),
      purchases: await ctx.db.query("purchases").collect(),
      licences: await ctx.db.query("licences").collect(),
      seats: await ctx.db.query("licenceSeats").collect(),
      entitlements: await ctx.db.query("entitlements").collect(),
      consents: await ctx.db.query("consentRecords").collect(),
      outbox: await ctx.db.query("outboxMessages").collect(),
    }));
    expect(state.events).toHaveLength(1);
    expect(state.events[0].status).toBe("applied");
    expect(state.purchases[0]).toMatchObject({
      status: "completed",
      amountMinor: 4_900,
    });
    expect(state.licences[0].status).toBe("active");
    expect(state.seats[0].status).toBe("active");
    expect(state.entitlements[0].status).toBe("active");
    expect(state.consents).toHaveLength(3);
    expect(state.outbox).toHaveLength(1);
  });

  it("extends subscription access and revokes it after a full refund", async () => {
    const { test, execute } = commerceTest();
    await execute("stripe.fulfillment.apply", fulfillment);

    await expect(execute("stripe.lifecycle.apply", {
      kind: "invoice",
      providerEventId: "evt_invoice_001",
      providerEventType: "invoice.paid",
      providerOccurredAt: 1_801_000_000_000,
      receivedAt: 1_801_000_000_100,
      payloadHash: "c".repeat(64),
      accountId: fulfillment.accountId,
      workspaceId: fulfillment.workspaceId,
      planId: fulfillment.planId,
      stripeSubscriptionId: fulfillment.stripeSubscriptionId,
      stripeCustomerId: fulfillment.stripeCustomerId,
      subscriptionStatus: "active",
      accessStatus: "active",
      currentPeriodStartsAt: 1_802_678_400_000,
      currentPeriodEndsAt: 1_805_356_800_000,
      cancelAtPeriodEnd: false,
      canceledAt: null,
      stripeInvoiceId: "in_test_001",
      stripePaymentIntentId: "pi_invoice_001",
      invoiceStatus: "paid",
      currency: "USD",
      totalMinor: 4_900,
      issuedAt: 1_801_000_000_000,
      paidAt: 1_801_000_000_000,
    })).resolves.toBe("applied");

    await expect(execute("stripe.adjustment.apply", {
      providerEventId: "evt_refund_001",
      providerEventType: "refund.updated",
      providerOccurredAt: 1_802_000_000_000,
      receivedAt: 1_802_000_000_100,
      payloadHash: "d".repeat(64),
      stripeAdjustmentId: "re_test_001",
      stripePaymentIntentId: fulfillment.stripePaymentIntentId,
      kind: "refund",
      adjustmentStatus: "processed",
      amountMinor: fulfillment.amountMinor,
      currency: "USD",
      fullRefund: true,
      accessAction: "revoke",
    })).resolves.toBe("applied");

    const state = await test.run(async (ctx) => ({
      purchase: (await ctx.db.query("purchases").collect())[0],
      licence: (await ctx.db.query("licences").collect())[0],
      seat: (await ctx.db.query("licenceSeats").collect())[0],
      entitlement: (await ctx.db.query("entitlements").collect())[0],
    }));
    expect(state.purchase.status).toBe("refunded");
    expect(state.licence.status).toBe("revoked");
    expect(state.seat.status).toBe("revoked");
    expect(state.entitlement.status).toBe("revoked");
  });

  it("restores disputed access only after every chargeback is resolved", async () => {
    const { test, execute } = commerceTest();
    await execute("stripe.fulfillment.apply", fulfillment);

    const adjustment = (
      providerEventId: string,
      stripeAdjustmentId: string,
      kind: "chargeback" | "chargeback_reversal",
      adjustmentStatus: "pending" | "reversed",
      accessAction: "suspend" | "restore",
      occurredAt: number,
    ) => execute("stripe.adjustment.apply", {
      providerEventId,
      providerEventType: "charge.dispute.updated",
      providerOccurredAt: occurredAt,
      receivedAt: occurredAt + 100,
      payloadHash: providerEventId.endsWith("a")
        ? "f".repeat(64)
        : providerEventId.endsWith("b")
          ? "1".repeat(64)
          : providerEventId.endsWith("c")
            ? "2".repeat(64)
            : "3".repeat(64),
      stripeAdjustmentId,
      stripePaymentIntentId: fulfillment.stripePaymentIntentId,
      kind,
      adjustmentStatus,
      amountMinor: fulfillment.amountMinor,
      currency: "USD",
      fullRefund: false,
      accessAction,
    });

    await adjustment(
      "evt_dispute_a",
      "dp_test_a",
      "chargeback",
      "pending",
      "suspend",
      1_801_000_000_000,
    );
    await adjustment(
      "evt_dispute_b",
      "dp_test_b",
      "chargeback",
      "pending",
      "suspend",
      1_801_000_001_000,
    );
    await adjustment(
      "evt_dispute_c",
      "dp_test_a",
      "chargeback_reversal",
      "reversed",
      "restore",
      1_801_000_002_000,
    );

    const stillBlocked = await test.run(async (ctx) => ({
      purchase: (await ctx.db.query("purchases").collect())[0],
      licence: (await ctx.db.query("licences").collect())[0],
      entitlement: (await ctx.db.query("entitlements").collect())[0],
    }));
    expect(stillBlocked.purchase.status).toBe("disputed");
    expect(stillBlocked.licence.status).toBe("suspended");
    expect(stillBlocked.entitlement.status).toBe("suspended");

    await adjustment(
      "evt_dispute_d",
      "dp_test_b",
      "chargeback_reversal",
      "reversed",
      "restore",
      1_801_000_003_000,
    );

    const restored = await test.run(async (ctx) => ({
      purchase: (await ctx.db.query("purchases").collect())[0],
      licence: (await ctx.db.query("licences").collect())[0],
      entitlement: (await ctx.db.query("entitlements").collect())[0],
    }));
    expect(restored.purchase.status).toBe("completed");
    expect(restored.licence.status).toBe("active");
    expect(restored.entitlement.status).toBe("active");
  });

  it("provisions and resolves WorkOS identity without storing email text", async () => {
    const { test, execute } = commerceTest();
    const projection = {
      userId: "user_test_001",
      accountId: fulfillment.accountId,
      workspaceId: fulfillment.workspaceId,
      organizationId: null,
      providerMembershipId: null,
      emailHash: "e".repeat(64),
      displayName: "Customer",
      locale: "en-GB",
      workspaceLabel: "Personal workspace",
      role: "owner",
      currentSince: 1_800_000_000_000,
    };
    await execute("workos.identity.provision", projection);
    await expect(execute("workos.identity.resolve", {
      userId: projection.userId,
      accountId: projection.accountId,
      workspaceId: projection.workspaceId,
      organizationId: null,
      providerMembershipId: null,
      role: "owner",
      sessionExpiresAt: 1_900_000_000_000,
    })).resolves.toMatchObject({
      status: "authenticated",
      accountId: projection.accountId,
    });

    const account = await test.run(async (ctx) =>
      (await ctx.db.query("accounts").collect())[0]);
    expect(account.emailHash).toBe("e".repeat(64));
    expect(JSON.stringify(account)).not.toContain("@");
  });

  it("distinguishes provider acceptance from verified delivery", async () => {
    const { test, execute } = commerceTest();
    await execute("stripe.fulfillment.apply", fulfillment);
    const claimed = await execute(
      "email.outbox.claim",
      { now: Date.now() + 1_000 },
    ) as Array<{ id: string; attempts: number }>;
    expect(claimed).toHaveLength(1);

    await execute("email.outbox.accepted", {
      id: claimed[0].id,
      attempts: claimed[0].attempts,
      providerMessageId: "email_message_123",
      now: 1_801_000_000_000,
    });
    const message = await test.run(async (ctx) =>
      (await ctx.db.query("outboxMessages").collect())[0]);
    expect(message).toMatchObject({
      status: "accepted",
      providerMessageId: "email_message_123",
      acceptedAt: 1_801_000_000_000,
      deliveredAt: null,
    });

    const delivery = {
      providerEventId: "msg_event_delivery_123",
      providerMessageId: "email_message_123",
      providerEventType: "email.delivered",
      state: "delivered",
      providerOccurredAt: 1_801_000_001_000,
      receivedAt: 1_801_000_001_100,
      payloadHash: "9".repeat(64),
    };
    await expect(execute("email.outbox.provider-event", delivery))
      .resolves.toBe("applied");
    await expect(execute("email.outbox.provider-event", delivery))
      .resolves.toBe("duplicate");

    await expect(execute("email.outbox.provider-event", {
      ...delivery,
      providerEventId: "msg_event_bounce_older",
      providerEventType: "email.bounced",
      state: "bounced",
      providerOccurredAt: delivery.providerOccurredAt - 1,
      payloadHash: "8".repeat(64),
    })).resolves.toBe("ignored");

    const state = await test.run(async (ctx) => ({
      message: (await ctx.db.query("outboxMessages").collect())[0],
      events: await ctx.db.query("providerEvents").collect(),
      audits: await ctx.db.query("auditEvents").collect(),
    }));
    expect(state.message).toMatchObject({
      status: "delivered",
      deliveredAt: delivery.providerOccurredAt,
      lastErrorCode: null,
    });
    expect(state.events.filter((event) => event.providerKind === "resend"))
      .toHaveLength(2);
    expect(state.audits.some((audit) =>
      audit.action === "email.delivery.updated"
      && audit.outcome === "delivered"
    )).toBe(true);
  });
});
