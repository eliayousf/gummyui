import Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  projectSandboxEvent,
  type StripeSandboxJourneyConfig,
} from "../scripts/stripe-sandbox-journey";
import {
  assertTestClockState,
  isAttemptedFailedInvoice,
  selectExactCycleInvoice,
  testClockSubscriptionStatusAllowed,
  type TestClockState,
} from "../scripts/stripe-test-clock-journey";

function invoice(
  id: string,
  billingReason: Stripe.Invoice.BillingReason = "subscription_cycle",
  livemode = false,
): Stripe.Invoice {
  return {
    id,
    object: "invoice",
    livemode,
    billing_reason: billingReason,
  } as Stripe.Invoice;
}

function journal(
  overrides: Partial<TestClockState> = {},
): TestClockState {
  return {
    schemaVersion: 2,
    phase: "failure-cycle-planned",
    runId: `gummyui-clock-${"a".repeat(32)}`,
    createdAt: 1_800_000_000_000,
    accountId: "account:sandbox-test-clock-proof",
    workspaceId: "workspace:sandbox-test-clock-proof",
    clockId: "clock_test",
    customerId: "cus_test",
    sessionId: "cs_test_proof",
    checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_proof",
    subscriptionId: "sub_test",
    initialInvoiceId: "in_initial",
    renewalInvoiceId: "in_renewal",
    renewalCycleTarget: 1_800_100_000,
    renewalFinalizeTarget: 1_800_104_000,
    failureCycleTarget: 1_802_800_000,
    ...overrides,
  };
}

describe("Stripe Managed Payments test-clock journal", () => {
  it("allows recovery statuses only in phases that can observe them", () => {
    expect(testClockSubscriptionStatusAllowed(
      "checkout-projected",
      "past_due",
    )).toBe(false);
    expect(testClockSubscriptionStatusAllowed(
      "failure-invoice-observed",
      "past_due",
    )).toBe(true);
    expect(testClockSubscriptionStatusAllowed(
      "cancellation-requested",
      "canceled",
    )).toBe(true);
    expect(testClockSubscriptionStatusAllowed(
      "canceled-projected",
      "active",
    )).toBe(false);
    expect(testClockSubscriptionStatusAllowed(
      "canceled-projected",
      "canceled",
    )).toBe(true);
  });

  it("requires persisted clock targets before provider mutation phases", () => {
    expect(() => assertTestClockState(journal())).not.toThrow();
    expect(() => assertTestClockState(journal({
      failureCycleTarget: undefined,
    }))).toThrowError("sandbox_test_clock_state_invalid");
    expect(() => assertTestClockState(journal({
      phase: "failure-invoice-observed",
      failedInvoiceId: "in_failed",
      failureFinalizeTarget: 1_802_804_000,
    }))).not.toThrow();
    expect(() => assertTestClockState(journal({
      phase: "failure-invoice-observed",
      failedInvoiceId: "in_failed",
      failureFinalizeTarget: undefined,
    }))).toThrowError("sandbox_test_clock_state_invalid");
  });

  it("finds one exact natural cycle and refuses ambiguous replay", () => {
    const excluded = new Set(["in_initial", "in_renewal"]);
    const expected = invoice("in_failed");
    expect(selectExactCycleInvoice([
      invoice("in_initial", "subscription_create"),
      invoice("in_renewal"),
      expected,
      invoice("in_live", "subscription_cycle", true),
    ], excluded)).toBe(expected);
    expect(() => selectExactCycleInvoice([
      expected,
      invoice("in_second_failure"),
    ], excluded)).toThrowError("sandbox_test_clock_invoice_ambiguous");
  });

  it("recognises only an attempted, unpaid, open test invoice", () => {
    expect(isAttemptedFailedInvoice({
      livemode: false,
      status: "open",
      amount_paid: 0,
      attempted: true,
    })).toBe(true);
    expect(isAttemptedFailedInvoice({
      livemode: false,
      status: "draft",
      amount_paid: 0,
      attempted: false,
    })).toBe(false);
    expect(isAttemptedFailedInvoice({
      livemode: true,
      status: "open",
      amount_paid: 0,
      attempted: true,
    })).toBe(false);
  });
});

describe("test-clock projection replay", () => {
  const config = {
    runtimeKey: "rk_test_runtime",
    operatorKey: "sk_test_operator",
    webhookSecret: "whsec_test_clock_projection_secret",
    applicationOrigin: "http://127.0.0.1:3000",
    convexTargetUrl: "https://example.convex.cloud",
    accountId: "account:sandbox-test-clock-proof",
    workspaceId: "workspace:sandbox-test-clock-proof",
    priceIds: {},
  } as StripeSandboxJourneyConfig;
  const event = {
    id: "evt_test_clock",
    object: "event",
    api_version: "2026-06-24.dahlia",
    created: 1_800_000_000,
    data: { object: { id: "in_test_clock" } },
    livemode: false,
    pending_webhooks: 0,
    request: null,
    type: "invoice.paid",
  } as Stripe.Event;

  it("keeps ordinary projections first-apply-only", async () => {
    const fetchImplementation = vi.fn(async () =>
      Response.json({ received: true, status: "duplicate" })) as typeof fetch;
    await expect(projectSandboxEvent(
      config,
      event,
      fetchImplementation,
      1_000,
    )).rejects.toMatchObject({
      code: "sandbox_webhook_projection_not_applied",
    });
  });

  it("accepts an exact duplicate only when the resumable caller opts in", async () => {
    const fetchImplementation = vi.fn(async () =>
      Response.json({ received: true, status: "duplicate" })) as typeof fetch;
    await expect(projectSandboxEvent(
      config,
      event,
      fetchImplementation,
      1_000,
      ["applied", "duplicate"],
    )).resolves.toBeUndefined();
  });
});
