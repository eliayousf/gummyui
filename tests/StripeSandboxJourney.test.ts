import {
  chmod,
  lstat,
  mkdir,
  readFile,
  rm,
  symlink,
} from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";
import { commercialPlans } from "../app/data/commercial";

vi.mock("server-only", () => ({}));

import {
  attestSandboxApplication,
  projectSandboxEvent,
  readStripeSandboxJourneyConfig,
  RealStripeSandboxJourneyProvider,
  runStripeSandboxJourney,
  StripeSandboxJourneyError,
  type StripeSandboxJourneyProvider,
  type StripeSandboxJourneyState,
} from "../scripts/stripe-sandbox-journey";

const runtimeKey = `rk_test_${"r".repeat(24)}`;
const operatorKey = `sk_test_${"o".repeat(24)}`;
const webhookSecret = `whsec_${"w".repeat(24)}`;

describe("Stripe sandbox journey safety boundary", () => {
  it("is a non-mutating dry run unless --execute is explicit", async () => {
    const provider = fakeProvider();
    const stateStore = fakeStateStore();
    const output = vi.fn();

    await runStripeSandboxJourney({
      argv: ["prepare"],
      environment: {
        STRIPE_SANDBOX_RUNTIME_KEY: `rk_live_${"x".repeat(24)}`,
      },
      provider,
      stateStore,
      writeOutput: output,
    });

    expect(provider.prepare).not.toHaveBeenCalled();
    expect(provider.resume).not.toHaveBeenCalled();
    expect(stateStore.create).not.toHaveBeenCalled();
    expect(output).toHaveBeenCalledWith(JSON.stringify({
      mode: "dry-run",
      operation: "prepare",
      sandboxOnly: true,
      externalMutation: false,
      requires: [
        "dedicated-rk-test-runtime-key",
        "dedicated-sk-test-operator-key",
        "completed-sandbox-checkouts",
        "signed-sandbox-webhook-projection",
      ],
      mutatingResumeRetryable: false,
      mutatingRecoveryRetryable: false,
      mutatingRepairRetryable: false,
      mutatingManagedFinishRetryable: false,
    }));
  });

  it.each([
    ["STRIPE_SANDBOX_RUNTIME_KEY", `rk_live_${"x".repeat(24)}`],
    ["STRIPE_SANDBOX_RUNTIME_KEY", `sk_live_${"x".repeat(24)}`],
    ["STRIPE_SANDBOX_OPERATOR_KEY", `sk_live_${"x".repeat(24)}`],
    ["STRIPE_SANDBOX_OPERATOR_KEY", `rk_live_${"x".repeat(24)}`],
  ])("categorically refuses live key material in %s", (key, value) => {
    expect(() => readStripeSandboxJourneyConfig({
      ...readyEnvironment(),
      [key]: value,
    })).toThrowError(
      expect.objectContaining({ code: "live_stripe_key_refused" }),
    );
  });

  it("requires separate restricted-runtime and standard-operator test keys", () => {
    expect(() => readStripeSandboxJourneyConfig({
      ...readyEnvironment(),
      STRIPE_SANDBOX_RUNTIME_KEY: operatorKey,
    })).toThrowError(
      expect.objectContaining({
        code: "restricted_test_runtime_key_required",
      }),
    );
    expect(() => readStripeSandboxJourneyConfig({
      ...readyEnvironment(),
      STRIPE_SANDBOX_OPERATOR_KEY: runtimeKey,
    })).toThrowError(
      expect.objectContaining({
        code: "standard_test_operator_key_required",
      }),
    );
  });

  it("requires an explicitly isolated Convex target and sandbox identities", () => {
    expect(() => readStripeSandboxJourneyConfig({
      ...readyEnvironment(),
      STRIPE_SANDBOX_CONVEX_URL: "https://example.com",
    })).toThrowError(expect.objectContaining({
      code: "sandbox_convex_target_invalid",
    }));
    expect(() => readStripeSandboxJourneyConfig({
      ...readyEnvironment(),
      STRIPE_SANDBOX_ACCOUNT_ID: "account:real-customer",
    })).toThrowError(expect.objectContaining({
      code: "sandbox_projection_identity_invalid",
    }));
  });

  it("categorically refuses every non-loopback origin", () => {
    for (const origin of [
      "https://gummyui.dev",
      "https://gummyui.dev.",
      "https://www.gummyui.dev",
      "https://www.gummyui.dev.",
      "https://preview.gummyui.dev",
      "https://preview.gummyui.dev.",
    ]) {
      expect(() => readStripeSandboxJourneyConfig({
        ...readyEnvironment(),
        STRIPE_SANDBOX_APP_ORIGIN: origin,
      })).toThrowError(
        expect.objectContaining({
          code: "non_loopback_sandbox_origin_refused",
        }),
      );
    }
  });

  it("permits only canonical HTTP loopback hosts", () => {
    expect(
      readStripeSandboxJourneyConfig(readyEnvironment())
        .applicationOrigin,
    ).toBe("http://127.0.0.1:3000");

    for (const origin of [
      "http://localhost:3000",
      "http://[::1]:3000",
    ]) {
      expect(readStripeSandboxJourneyConfig({
        ...readyEnvironment(),
        STRIPE_SANDBOX_APP_ORIGIN: origin,
      }).applicationOrigin).toBe(origin);
    }
    expect(() => readStripeSandboxJourneyConfig({
      ...readyEnvironment(),
      STRIPE_SANDBOX_APP_ORIGIN: "https://gummyui-sandbox.example.test",
    })).toThrowError(expect.objectContaining({
      code: "non_loopback_sandbox_origin_refused",
    }));
    expect(() => readStripeSandboxJourneyConfig({
      ...readyEnvironment(),
      STRIPE_SANDBOX_APP_ORIGIN: "https://localhost:3000",
    })).toThrowError(expect.objectContaining({
      code: "non_loopback_sandbox_origin_refused",
    }));
  });

  it("does not substitute production webhook or price configuration", () => {
    const environment = readyEnvironment();
    delete environment.STRIPE_SANDBOX_WEBHOOK_SECRET;
    environment.STRIPE_WEBHOOK_SECRET = `whsec_${"live".repeat(6)}`;
    expect(() => readStripeSandboxJourneyConfig(environment))
      .toThrowError(
        expect.objectContaining({
          code: "sandbox_journey_configuration_unavailable",
        }),
      );
  });

  it("requires the sandbox signing secret to differ from an ordinary one", () => {
    expect(() => readStripeSandboxJourneyConfig({
      ...readyEnvironment(),
      STRIPE_WEBHOOK_SECRET: webhookSecret,
    })).toThrowError(expect.objectContaining({
      code: "sandbox_webhook_secret_reuse_refused",
    }));
  });

  it("rejects the removed remote-origin override flag", async () => {
    await expect(runStripeSandboxJourney({
      argv: ["prepare", "--allow-non-loopback-origin"],
    })).rejects.toMatchObject({
      code: "sandbox_journey_usage_invalid",
    });
  });
});

describe("Stripe sandbox webhook projection", () => {
  const event = {
    id: "evt_test_projection",
    livemode: false,
    type: "checkout.session.completed",
    data: { object: { id: "cs_test_projection" } },
  } as Stripe.Event;

  it("accepts only a first-pass applied projection", async () => {
    const fetchImplementation = vi.fn(async (
      _input: URL | RequestInfo,
      init?: RequestInit,
    ) => {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return Response.json({ received: true, status: "applied" });
    }) as typeof fetch;

    await projectSandboxEvent(
      readStripeSandboxJourneyConfig(readyEnvironment()),
      event,
      fetchImplementation,
    );
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  it.each(["ignored", "duplicate", undefined])(
    "never counts webhook status %s as projected",
    async (status) => {
      const fetchImplementation = vi.fn(async () =>
        Response.json({ received: true, status })) as typeof fetch;

      await expect(projectSandboxEvent(
        readStripeSandboxJourneyConfig(readyEnvironment()),
        event,
        fetchImplementation,
      )).rejects.toMatchObject({
        code: "sandbox_webhook_projection_not_applied",
      });
    },
  );

  it("aborts a webhook fetch at the configured bound", async () => {
    const fetchImplementation = vi.fn((
      _input: URL | RequestInfo,
      init?: RequestInit,
    ) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        reject(new DOMException("aborted", "AbortError"));
      }, { once: true });
    })) as typeof fetch;

    await expect(projectSandboxEvent(
      readStripeSandboxJourneyConfig(readyEnvironment()),
      event,
      fetchImplementation,
      5,
    )).rejects.toMatchObject({
      code: "sandbox_webhook_projection_unavailable",
    });
  });
});

describe("Stripe sandbox application attestation", () => {
  it("requires the nonce, isolated target fingerprint and identity proof", async () => {
    const config = readStripeSandboxJourneyConfig(readyEnvironment());
    const fetchImplementation = vi.fn(async () => Response.json({
      challenge: "a".repeat(64),
      targetClass: "isolated-test",
      targetFingerprint: config.convexTargetFingerprint,
      identityReady: true,
    })) as typeof fetch;

    await attestSandboxApplication(
      config,
      "identity",
      "a".repeat(64),
      undefined,
      fetchImplementation,
    );
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  it("requires explicit access revocation after the lifecycle", async () => {
    const config = readStripeSandboxJourneyConfig(readyEnvironment());
    await expect(attestSandboxApplication(
      config,
      "access-revoked",
      "b".repeat(64),
      ["cs_test_monthly", "cs_test_lifetime"],
      vi.fn(async () => Response.json({
        challenge: "b".repeat(64),
        targetClass: "isolated-test",
        targetFingerprint: config.convexTargetFingerprint,
        identityReady: true,
      })) as typeof fetch,
    )).rejects.toMatchObject({
      code: "sandbox_application_attestation_invalid",
    });
  });
});

describe("real Stripe sandbox provider boundaries", () => {
  it("validates all prices and both checkouts before operator mutation", async () => {
    const environment = readyEnvironment();
    const config = readStripeSandboxJourneyConfig(environment);
    const retrievePrice = vi.fn(async (priceId: string) => {
      const plan = commercialPlans.find((candidate) =>
        config.priceIds[candidate.id] === priceId);
      if (!plan) throw new Error("unexpected price");
      return {
        id: priceId,
        active: true,
        currency: "usd",
        livemode: false,
        type: plan.billingInterval === "lifetime"
          ? "one_time"
          : "recurring",
        unit_amount: plan.priceUsd * 100,
        recurring: plan.billingInterval === "lifetime"
          ? null
          : { interval: plan.billingInterval, interval_count: 1 },
      };
    });
    const retrieveSession = vi.fn(async (sessionId: string) => {
      const monthly = sessionId === "cs_test_monthly";
      return {
        id: sessionId,
        livemode: false,
        status: "complete",
        payment_status: "paid",
        metadata: {
          commercial_offer_ref:
            monthly ? "individual-monthly" : "individual-lifetime",
          immediate_supply_requested: "true",
          cancellation_loss_acknowledged: "true",
        },
      };
    });
    const stripeFactory = vi.fn(() => ({
      prices: { retrieve: retrievePrice },
      checkout: { sessions: { retrieve: retrieveSession } },
    }) as unknown as Stripe);
    const provider = new RealStripeSandboxJourneyProvider({
      stripeFactory,
      fetchImplementation: vi.fn() as typeof fetch,
      now: () => 1_800_000_000_000,
      sleep: vi.fn(async () => undefined),
      eventWaitTimeoutMs: 1,
      webhookFetchTimeoutMs: 1,
    });

    await provider.validateForResume(config, continuationState());

    expect(stripeFactory).toHaveBeenCalledTimes(2);
    expect(stripeFactory).toHaveBeenCalledWith(runtimeKey);
    expect(stripeFactory).toHaveBeenCalledWith(operatorKey);
    expect(retrievePrice).toHaveBeenCalledTimes(18);
    expect(retrieveSession).toHaveBeenCalledTimes(4);
  });

  it("executes and projects the provider lifecycle in the required order", async () => {
    const config = readStripeSandboxJourneyConfig(readyEnvironment());
    const monthly = completedSession("cs_test_monthly", true);
    const lifetime = completedSession("cs_test_lifetime", false);
    const retrieveSession = vi.fn(async (id: string) =>
      id === monthly.id ? monthly : lifetime);
    const retrievePrice = vi.fn(async (priceId: string) => {
      const plan = commercialPlans.find((candidate) =>
        config.priceIds[candidate.id] === priceId)!;
      return {
        id: priceId,
        active: true,
        currency: "usd",
        livemode: false,
        type: plan.billingInterval === "lifetime"
          ? "one_time"
          : "recurring",
        unit_amount: plan.priceUsd * 100,
        recurring: plan.billingInterval === "lifetime"
          ? null
          : { interval: plan.billingInterval, interval_count: 1 },
      };
    });
    const events = [
      event("evt_checkout_monthly", "checkout.session.completed", {
        id: monthly.id,
      }),
      event("evt_checkout_lifetime", "checkout.session.completed", {
        id: lifetime.id,
      }),
      event("evt_invoice_paid", "invoice.paid", { id: "in_renewal" }),
      event("evt_invoice_failed", "invoice.payment_failed", {
        id: "in_failed",
      }),
      event("evt_cancel_scheduled", "customer.subscription.updated", {
        id: "sub_sandbox",
        cancel_at_period_end: true,
      }),
      event("evt_cancelled", "customer.subscription.deleted", {
        id: "sub_sandbox",
      }),
      event("evt_refund", "refund.created", { id: "re_sandbox" }),
    ] as Stripe.Event[];
    const subscriptionUpdates = vi.fn(async (
      _id: string,
      params: { cancel_at_period_end?: boolean },
    ) => ({
      id: "sub_sandbox",
      cancel_at_period_end: params.cancel_at_period_end ?? false,
    }));
    const invoice = (
      id: string,
      status: "draft" | "open" | "paid",
      attempted = status !== "draft",
    ) => ({
      id,
      livemode: false,
      status,
      attempted,
      amount_due: 4_900,
      amount_paid: status === "paid" ? 4_900 : 0,
      customer: "cus_sandbox",
      parent: {
        subscription_details: { subscription: "sub_sandbox" },
      },
    });
    const createInvoice = vi.fn()
      .mockResolvedValueOnce(invoice("in_renewal", "draft"))
      .mockResolvedValueOnce(invoice("in_failed", "draft"));
    const payInvoice = vi.fn()
      .mockResolvedValueOnce(invoice("in_renewal", "paid"))
      .mockRejectedValueOnce({
        type: "StripeCardError",
        code: "card_declined",
        decline_code: "generic_decline",
      });
    const detach = vi.fn(async () => ({ id: "pm_declined" }));
    const operator = {
      events: { list: vi.fn(async () => ({ data: events })) },
      subscriptions: {
        retrieve: vi.fn(async () => ({
          id: "sub_sandbox",
          latest_invoice: "in_initial",
          default_payment_method: "pm_good",
        })),
        update: subscriptionUpdates,
        cancel: vi.fn(async () => ({ id: "sub_sandbox" })),
      },
      invoices: {
        create: createInvoice,
        finalizeInvoice: vi.fn(async (id: string) => invoice(id, "open")),
        pay: payInvoice,
        retrieve: vi.fn(async (id: string) =>
          invoice(id, "open", true)),
      },
      invoiceItems: {
        create: vi.fn(async (params: { invoice: string }) => ({
          id: `ii_${params.invoice}`,
          livemode: false,
          customer: "cus_sandbox",
          invoice: params.invoice,
          amount: 4_900,
          currency: "usd",
        })),
      },
      paymentMethods: {
        create: vi.fn(async () => ({
          id: "pm_declined",
          livemode: false,
        })),
        attach: vi.fn(async () => ({ id: "pm_declined" })),
        detach,
      },
      refunds: {
        create: vi.fn(async () => ({
          id: "re_sandbox",
          status: "succeeded",
          amount: 89_900,
          currency: "usd",
        })),
      },
    };
    const stripeFactory = vi.fn((key: string) =>
      key === runtimeKey
        ? {
            prices: { retrieve: retrievePrice },
            checkout: { sessions: { retrieve: retrieveSession } },
          } as unknown as Stripe
        : operator as unknown as Stripe);
    const fetchImplementationMock = vi.fn(async () =>
      Response.json({ received: true, status: "applied" }));
    const fetchImplementation = fetchImplementationMock as typeof fetch;
    const provider = new RealStripeSandboxJourneyProvider({
      stripeFactory,
      fetchImplementation,
      now: () => 1_800_000_000_000,
      sleep: vi.fn(async () => undefined),
      eventWaitTimeoutMs: 10,
      webhookFetchTimeoutMs: 10,
    });

    const afterPurchasesProjected = vi.fn(async () => undefined);
    await expect(provider.resume(
      config,
      continuationState(),
      { afterPurchasesProjected },
    )).resolves.toEqual({ realEventsProjected: 5 });
    expect(subscriptionUpdates).toHaveBeenCalledWith(
      "sub_sandbox",
      { cancel_at_period_end: true },
      expect.objectContaining({ idempotencyKey: expect.any(String) }),
    );
    expect(subscriptionUpdates.mock.calls.some((call) =>
      "billing_cycle_anchor" in (call[1] as Record<string, unknown>),
    )).toBe(false);
    expect(subscriptionUpdates.mock.calls.some((call) =>
      "default_payment_method" in (call[1] as Record<string, unknown>),
    )).toBe(false);
    expect(operator.subscriptions.cancel).toHaveBeenCalledWith(
      "sub_sandbox",
      {},
      expect.objectContaining({ idempotencyKey: expect.any(String) }),
    );
    expect(operator.refunds.create).toHaveBeenCalledWith(
      expect.objectContaining({ payment_intent: "pi_sandbox" }),
      expect.objectContaining({ idempotencyKey: expect.any(String) }),
    );
    expect(fetchImplementation).toHaveBeenCalledTimes(5);
    expect(afterPurchasesProjected).toHaveBeenCalledTimes(1);
    expect(
      fetchImplementationMock.mock.invocationCallOrder[1],
    ).toBeLessThan(afterPurchasesProjected.mock.invocationCallOrder[0]);
    expect(
      afterPurchasesProjected.mock.invocationCallOrder[0],
    ).toBeLessThan(subscriptionUpdates.mock.invocationCallOrder[0]);
    expect(detach).not.toHaveBeenCalled();
  });

  it("strictly recovers the five post-purchase events with subscription-linked invoices", async () => {
    const config = readStripeSandboxJourneyConfig(readyEnvironment());
    const state = failedAnchorState();
    const monthly = completedSession("cs_test_monthly", true);
    const lifetime = completedSession("cs_test_lifetime", false);
    const retrieveSession = vi.fn(async (id: string) =>
      id === monthly.id ? monthly : lifetime);
    const retrievePrice = vi.fn(async (priceId: string) => {
      const plan = commercialPlans.find((candidate) =>
        config.priceIds[candidate.id] === priceId)!;
      return {
        id: priceId,
        active: true,
        currency: "usd",
        livemode: false,
        type: plan.billingInterval === "lifetime"
          ? "one_time"
          : "recurring",
        unit_amount: plan.priceUsd * 100,
        recurring: plan.billingInterval === "lifetime"
          ? null
          : { interval: plan.billingInterval, interval_count: 1 },
      };
    });
    const subscription = {
      id: "sub_sandbox",
      object: "subscription",
      livemode: false,
      status: "active",
      cancel_at_period_end: false,
      canceled_at: null,
      created: 1_700_000_000,
      customer: "cus_sandbox",
      default_payment_method: "pm_good",
      latest_invoice: "in_initial",
      metadata: {
        account_id: state.accountId,
        workspace_id: state.workspaceId,
        commercial_offer_ref: "individual-monthly",
      },
      items: {
        data: [{
          id: "si_sandbox",
          quantity: 1,
          price: {
            id: config.priceIds["individual-monthly"],
          },
          current_period_start: 1_700_000_100,
          current_period_end: 1_702_678_500,
        }],
      },
    } as unknown as Stripe.Subscription;
    const invoice = (
      id: string,
      status: "draft" | "open" | "paid",
      attempted = status !== "draft",
    ) => ({
      id,
      object: "invoice",
      livemode: false,
      status,
      attempted,
      amount_due: 4_900,
      amount_paid: status === "paid" ? 4_900 : 0,
      currency: "usd",
      customer: "cus_sandbox",
      billing_reason: id === "in_initial"
        ? "subscription_create"
        : "manual",
      parent: {
        type: "subscription_details",
        subscription_details: { subscription: "sub_sandbox" },
      },
    }) as unknown as Stripe.Invoice;
    const eventsByType = new Map<string, Stripe.Event>([
      [
        "invoice.paid",
        event("evt_paid", "invoice.paid", { id: "in_paid" }),
      ],
      [
        "invoice.payment_failed",
        event("evt_failed", "invoice.payment_failed", {
          id: "in_failed",
        }),
      ],
      [
        "customer.subscription.updated",
        event("evt_scheduled", "customer.subscription.updated", {
          id: "sub_sandbox",
          cancel_at_period_end: true,
        }),
      ],
      [
        "customer.subscription.deleted",
        event("evt_deleted", "customer.subscription.deleted", {
          id: "sub_sandbox",
        }),
      ],
      [
        "refund.created",
        event("evt_refund", "refund.created", {
          id: "re_sandbox",
        }),
      ],
    ]);
    const listEvents = vi.fn(async (params: {
      types: string[];
    }) => {
      if (params.types.length > 1) {
        return { data: [], has_more: false };
      }
      return {
        data: [eventsByType.get(params.types[0])!],
        has_more: false,
      };
    });
    const createInvoice = vi.fn()
      .mockResolvedValueOnce(invoice("in_paid", "draft"))
      .mockResolvedValueOnce(invoice("in_failed", "draft"));
    const createInvoiceItem = vi.fn(async (params: {
      invoice: string;
    }) => ({
      id: `ii_${params.invoice}`,
      object: "invoiceitem",
      livemode: false,
      customer: "cus_sandbox",
      invoice: params.invoice,
      amount: 4_900,
      currency: "usd",
    }));
    const finalizeInvoice = vi.fn(async (id: string) =>
      invoice(id, "open"));
    const payInvoice = vi.fn()
      .mockResolvedValueOnce(invoice("in_paid", "paid"))
      .mockRejectedValueOnce({
        type: "StripeCardError",
        code: "card_declined",
        decline_code: "generic_decline",
      });
    const retrieveInvoice = vi.fn(async (id: string) =>
      invoice(id, "open", true));
    const subscriptionUpdates = vi.fn(async (
      _id: string,
      params: { cancel_at_period_end?: boolean },
    ) => ({
      ...subscription,
      cancel_at_period_end: params.cancel_at_period_end ?? false,
    }));
    const detach = vi.fn(async () => ({ id: "pm_declined" }));
    const operator = {
      prices: { retrieve: retrievePrice },
      checkout: { sessions: { retrieve: retrieveSession } },
      subscriptions: {
        retrieve: vi.fn(async () => subscription),
        update: subscriptionUpdates,
        cancel: vi.fn(async () => ({
          ...subscription,
          status: "canceled",
        })),
      },
      invoices: {
        list: vi.fn(async () => ({
          data: [invoice("in_initial", "paid")],
          has_more: false,
        })),
        create: createInvoice,
        finalizeInvoice,
        pay: payInvoice,
        retrieve: retrieveInvoice,
      },
      invoiceItems: { create: createInvoiceItem },
      paymentIntents: {
        retrieve: vi.fn(async () => ({
          id: "pi_sandbox",
          livemode: false,
          status: "succeeded",
          amount_received: 89_900,
          currency: "usd",
        })),
      },
      refunds: {
        list: vi.fn(async () => ({ data: [], has_more: false })),
        create: vi.fn(async () => ({
          id: "re_sandbox",
          status: "succeeded",
          amount: 89_900,
          currency: "usd",
        })),
      },
      paymentMethods: {
        list: vi.fn(async () => ({
          data: [{
            id: "pm_good",
            livemode: false,
            metadata: {},
          }],
          has_more: false,
        })),
        create: vi.fn(async () => ({
          id: "pm_declined",
          livemode: false,
        })),
        attach: vi.fn(async () => ({ id: "pm_declined" })),
        detach,
      },
      events: { list: listEvents },
    };
    const stripeFactory = vi.fn(() => operator as unknown as Stripe);
    const fetchImplementationMock = vi.fn(async () =>
      Response.json({ received: true, status: "applied" }));
    const provider = new RealStripeSandboxJourneyProvider({
      stripeFactory,
      fetchImplementation: fetchImplementationMock as typeof fetch,
      now: () => 1_800_000_000_000,
      sleep: vi.fn(async () => undefined),
      eventWaitTimeoutMs: 10,
      webhookFetchTimeoutMs: 10,
    });

    await expect(
      provider.validateForAnchorRecovery(config, state),
    ).resolves.toBeUndefined();
    await expect(
      provider.recoverAnchorNoInvoice(config, state),
    ).resolves.toEqual({ realEventsProjected: 5 });

    expect(createInvoice).toHaveBeenCalledTimes(2);
    expect(createInvoice.mock.calls[0][0]).toMatchObject({
      subscription: "sub_sandbox",
      auto_advance: false,
    });
    expect(createInvoice.mock.calls[0][0]).not.toHaveProperty(
      "pending_invoice_items_behavior",
    );
    expect(createInvoiceItem).toHaveBeenCalledTimes(2);
    expect(finalizeInvoice).toHaveBeenCalledTimes(2);
    expect(payInvoice).toHaveBeenCalledTimes(2);
    expect(subscriptionUpdates).toHaveBeenCalledWith(
      "sub_sandbox",
      { default_payment_method: "pm_declined" },
      expect.objectContaining({
        idempotencyKey: expect.stringContaining("failed-payment-default"),
      }),
    );
    expect(operator.subscriptions.cancel).toHaveBeenCalledTimes(1);
    expect(operator.refunds.create).toHaveBeenCalledWith(
      expect.objectContaining({ payment_intent: "pi_sandbox" }),
      expect.objectContaining({
        idempotencyKey: expect.stringContaining("lifetime-refund"),
      }),
    );
    expect(fetchImplementationMock).toHaveBeenCalledTimes(5);
    expect(detach).toHaveBeenCalledTimes(1);
    const mutationKeys = [
      ...createInvoice.mock.calls,
      ...createInvoiceItem.mock.calls,
      ...finalizeInvoice.mock.calls,
      ...payInvoice.mock.calls,
    ].map((call) => (
      call.at(-1) as { idempotencyKey: string }
    ).idempotencyKey);
    expect(new Set(mutationKeys).size).toBe(mutationKeys.length);
    expect(mutationKeys.every((key) => key.length <= 255)).toBe(true);
  });

  it("refuses anchor recovery when the subscription invoice set is not exact", async () => {
    const config = readStripeSandboxJourneyConfig(readyEnvironment());
    const state = failedAnchorState();
    const monthly = completedSession("cs_test_monthly", true);
    const lifetime = completedSession("cs_test_lifetime", false);
    const createInvoice = vi.fn();
    const operator = {
      prices: {
        retrieve: vi.fn(async (priceId: string) => {
          const plan = commercialPlans.find((candidate) =>
            config.priceIds[candidate.id] === priceId)!;
          return {
            id: priceId,
            active: true,
            currency: "usd",
            livemode: false,
            type: plan.billingInterval === "lifetime"
              ? "one_time"
              : "recurring",
            unit_amount: plan.priceUsd * 100,
            recurring: plan.billingInterval === "lifetime"
              ? null
              : { interval: plan.billingInterval, interval_count: 1 },
          };
        }),
      },
      checkout: {
        sessions: {
          retrieve: vi.fn(async (id: string) =>
            id === monthly.id ? monthly : lifetime),
        },
      },
      subscriptions: {
        retrieve: vi.fn(async () => ({
          id: "sub_sandbox",
          livemode: false,
          status: "active",
          cancel_at_period_end: false,
          canceled_at: null,
          created: 1_700_000_000,
          customer: "cus_sandbox",
          default_payment_method: "pm_good",
          latest_invoice: "in_initial",
          metadata: {
            account_id: state.accountId,
            workspace_id: state.workspaceId,
            commercial_offer_ref: "individual-monthly",
          },
          items: {
            data: [{
              quantity: 1,
              price: {
                id: config.priceIds["individual-monthly"],
              },
              current_period_start: 1_700_000_100,
              current_period_end: 1_702_678_500,
            }],
          },
        })),
      },
      invoices: {
        list: vi.fn(async () => ({
          data: [],
          has_more: true,
        })),
        create: createInvoice,
      },
    };
    const provider = new RealStripeSandboxJourneyProvider({
      stripeFactory: vi.fn(() => operator as unknown as Stripe),
    });

    await expect(
      provider.validateForAnchorRecovery(config, state),
    ).rejects.toMatchObject({
      code: "sandbox_anchor_recovery_invoice_state_invalid",
    });
    expect(createInvoice).not.toHaveBeenCalled();
  });

  it.each([
    [
      "live-subscription",
      "sandbox_anchor_recovery_subscription_invalid",
    ],
    [
      "wrong-metadata",
      "sandbox_anchor_recovery_subscription_invalid",
    ],
    [
      "existing-refund",
      "sandbox_anchor_recovery_refund_state_invalid",
    ],
    [
      "run-payment-method",
      "sandbox_anchor_recovery_payment_method_state_invalid",
    ],
    [
      "later-cancellation",
      "sandbox_anchor_recovery_lifecycle_already_advanced",
    ],
  ] as const)(
    "rejects unsafe %s recovery state before any mutation",
    async (variant, code) => {
      const fixture = anchorRecoveryPreflightFixture(variant);
      await expect(
        fixture.provider.validateForAnchorRecovery(
          fixture.config,
          fixture.state,
        ),
      ).rejects.toMatchObject({ code });
      expect(fixture.createInvoice).not.toHaveBeenCalled();
    },
  );

  it("finishes the real Managed Payments cancellation and refund path without invoices", async () => {
    const fixture = anchorRecoveryPreflightFixture("valid");

    await expect(
      fixture.provider.finishManagedLifecycle(
        fixture.config,
        fixture.state,
      ),
    ).resolves.toEqual({ realEventsProjected: 3 });

    expect(fixture.createInvoice).not.toHaveBeenCalled();
    expect(fixture.updateSubscription).toHaveBeenCalledWith(
      "sub_sandbox",
      { cancel_at_period_end: true },
      expect.objectContaining({
        idempotencyKey: expect.stringContaining("schedule-cancellation"),
      }),
    );
    expect(fixture.cancelSubscription).toHaveBeenCalledWith(
      "sub_sandbox",
      {},
      expect.objectContaining({
        idempotencyKey: expect.stringContaining("cancel-subscription"),
      }),
    );
    expect(fixture.createRefund).toHaveBeenCalledWith(
      expect.objectContaining({ payment_intent: "pi_sandbox" }),
      expect.objectContaining({
        idempotencyKey: expect.stringContaining("lifetime-refund"),
      }),
    );
    expect(fixture.fetchImplementation).toHaveBeenCalledTimes(3);
  });
});

describe("Stripe sandbox journey orchestration", () => {
  it("prepares both checkout modes and writes only a redacted result", async () => {
    const provider = fakeProvider();
    const stateStore = fakeStateStore();
    const output = vi.fn();

    const attestApplication = fakeAttestation();
    await runStripeSandboxJourney({
      argv: ["prepare", "--execute"],
      environment: readyEnvironment(),
      provider,
      stateStore,
      attestApplication,
      now: () => 1_800_000_000_000,
      randomId: () => "runidentifier123456",
      writeOutput: output,
    });

    expect(provider.prepare).toHaveBeenCalledTimes(1);
    expect(stateStore.create).toHaveBeenCalledWith(
      expect.stringMatching(/work\/stripe-sandbox\/journey\.json$/),
      expect.objectContaining({
        schemaVersion: 6,
        phase: "preparing",
        runId: "gummyui-sandbox-runidentifier123456",
        createdAt: 1_800_000_000_000,
        resumeAttemptedAt: null,
        recoveryAttemptedAt: null,
        checkouts: [],
      }),
    );
    expect(stateStore.replace).toHaveBeenCalledWith(
      expect.stringMatching(/work\/stripe-sandbox\/journey\.json$/),
      expect.objectContaining({
        schemaVersion: 6,
        phase: "ready",
        checkouts: expect.arrayContaining([
          expect.objectContaining({ planId: "individual-monthly" }),
          expect.objectContaining({ planId: "individual-lifetime" }),
        ]),
      }),
    );
    const serialized = output.mock.calls[0][0] as string;
    expect(JSON.parse(serialized)).toEqual({
      mode: "executed",
      operation: "prepare",
      sandboxOnly: true,
      pricesVerified: 9,
      checkoutsCreated: 2,
      checkoutModes: ["subscription", "payment"],
      isolatedConvexAttested: true,
      continuationState: "work/stripe-sandbox/journey.json",
    });
    expect(serialized).not.toContain(runtimeKey);
    expect(serialized).not.toContain(operatorKey);
    expect(serialized).not.toContain(webhookSecret);
    expect(serialized).not.toContain("checkout.stripe.com");
    expect(serialized).not.toContain("cs_test_");
  });

  it("reserves private continuation state before creating Stripe sessions", async () => {
    const provider = fakeProvider();
    const stateStore = fakeStateStore();
    stateStore.create.mockRejectedValueOnce(
      new StripeSandboxJourneyError("sandbox_state_create_failed"),
    );

    await expect(runStripeSandboxJourney({
      argv: ["prepare", "--execute"],
      environment: readyEnvironment(),
      provider,
      stateStore,
      attestApplication: fakeAttestation(),
      now: () => 1_800_000_000_000,
      randomId: () => "reservationidentifier",
    })).rejects.toMatchObject({
      code: "sandbox_state_create_failed",
    });
    expect(provider.prepare).not.toHaveBeenCalled();
  });

  it("resumes only matching state, projects the full lifecycle and removes it", async () => {
    const provider = fakeProvider();
    const state = continuationState();
    const stateStore = fakeStateStore(state);
    const output = vi.fn();
    const attestApplication = fakeAttestation();

    await runStripeSandboxJourney({
      argv: ["resume", "--execute"],
      environment: readyEnvironment(),
      provider,
      stateStore,
      attestApplication,
      now: () => 1_800_000_100_000,
      writeOutput: output,
    });

    expect(provider.validateForResume).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationOrigin: "http://127.0.0.1:3000",
      }),
      state,
    );
    expect(stateStore.replace).toHaveBeenCalledWith(
      expect.stringMatching(/work\/stripe-sandbox\/journey\.json$/),
      expect.objectContaining({
        resumeAttemptedAt: 1_800_000_100_000,
      }),
    );
    expect(provider.resume).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationOrigin: "http://127.0.0.1:3000",
      }),
      expect.objectContaining({
        resumeAttemptedAt: 1_800_000_100_000,
      }),
      expect.objectContaining({
        afterPurchasesProjected: expect.any(Function),
      }),
    );
    expect(attestApplication.mock.calls.map((call) => call[1])).toEqual([
      "identity",
      "access-granted",
      "access-revoked",
    ]);
    expect(stateStore.remove).toHaveBeenCalledTimes(1);
    expect(JSON.parse(output.mock.calls[0][0] as string)).toEqual({
      mode: "executed",
      operation: "resume",
      sandboxOnly: true,
      realEventsProjected: 5,
      lifecycle: [
        "purchase",
        "cancellation",
        "refund",
      ],
      renewalEvidence: "separate-test-clock-required",
      mutatingResumeRetryable: false,
      isolatedConvexAttested: true,
      accessGrantVerified: true,
      accessRevocationVerified: true,
      continuationRemoved: true,
    });
  });

  it("journals a failed mutation attempt and categorically refuses retry", async () => {
    const provider = fakeProvider();
    provider.resume.mockRejectedValueOnce(
      new StripeSandboxJourneyError("sandbox_webhook_projection_rejected"),
    );
    const stateStore = fakeStateStore(continuationState());

    await expect(runStripeSandboxJourney({
      argv: ["resume", "--execute"],
      environment: readyEnvironment(),
      provider,
      stateStore,
      attestApplication: fakeAttestation(),
      now: () => 1_800_000_100_000,
    })).rejects.toMatchObject({
      code: "sandbox_webhook_projection_rejected",
    });
    expect(stateStore.remove).not.toHaveBeenCalled();
    expect(stateStore.replace).toHaveBeenCalledTimes(1);

    await expect(runStripeSandboxJourney({
      argv: ["resume", "--execute"],
      environment: readyEnvironment(),
      provider,
      stateStore,
      attestApplication: fakeAttestation(),
      now: () => 1_800_000_200_000,
    })).rejects.toMatchObject({
      code: "sandbox_resume_already_attempted",
    });
    expect(provider.resume).toHaveBeenCalledTimes(1);
  });

  it("keeps checkout readiness validation safely repeatable", async () => {
    const provider = fakeProvider();
    provider.validateForResume.mockRejectedValueOnce(
      new StripeSandboxJourneyError(
        "sandbox_checkout_completion_required",
      ),
    );
    const stateStore = fakeStateStore(continuationState());

    await expect(runStripeSandboxJourney({
      argv: ["resume", "--execute"],
      environment: readyEnvironment(),
      provider,
      stateStore,
      attestApplication: fakeAttestation(),
    })).rejects.toMatchObject({
      code: "sandbox_checkout_completion_required",
    });
    expect(stateStore.replace).not.toHaveBeenCalled();
    expect(provider.resume).not.toHaveBeenCalled();
  });

  it("retains continuation state when lifecycle evidence is incomplete", async () => {
    const provider = fakeProvider();
    provider.resume.mockResolvedValueOnce({ realEventsProjected: 4 });
    const stateStore = fakeStateStore(continuationState());

    await expect(runStripeSandboxJourney({
      argv: ["resume", "--execute"],
      environment: readyEnvironment(),
      provider,
      stateStore,
      attestApplication: fakeAttestation(),
    })).rejects.toMatchObject({
      code: "sandbox_journey_evidence_incomplete",
    });
    expect(stateStore.remove).not.toHaveBeenCalled();
    expect(stateStore.replace).toHaveBeenCalledTimes(1);
  });

  it("refuses evidence when a provider omits the access-grant hook", async () => {
    const provider = fakeProvider();
    provider.resume.mockImplementationOnce(async () => ({
      realEventsProjected: 5,
    }));
    const stateStore = fakeStateStore(continuationState());

    await expect(runStripeSandboxJourney({
      argv: ["resume", "--execute"],
      environment: readyEnvironment(),
      provider,
      stateStore,
      attestApplication: fakeAttestation(),
    })).rejects.toMatchObject({
      code: "sandbox_journey_evidence_incomplete",
    });
    expect(stateStore.remove).not.toHaveBeenCalled();
  });

  it("recovers only the five remaining events after exact purchase access is attested", async () => {
    const provider = fakeProvider();
    const state = failedAnchorState();
    const stateStore = fakeStateStore(state);
    const attestApplication = fakeAttestation();
    const output = vi.fn();

    await runStripeSandboxJourney({
      argv: ["recover-anchor-no-invoice", "--execute"],
      environment: readyEnvironment(),
      provider,
      stateStore,
      attestApplication,
      now: () => 1_700_000_200_000,
      writeOutput: output,
    });

    expect(provider.resume).not.toHaveBeenCalled();
    expect(provider.validateForResume).toHaveBeenCalledWith(
      expect.any(Object),
      state,
    );
    expect(provider.validateForAnchorRecovery).toHaveBeenCalledWith(
      expect.any(Object),
      state,
    );
    expect(stateStore.replace).toHaveBeenCalledWith(
      expect.stringMatching(/work\/stripe-sandbox\/journey\.json$/),
      expect.objectContaining({
        schemaVersion: 6,
        phase: "purchases-attested",
        resumeAttemptedAt: 1_700_000_100_000,
        recoveryAttemptedAt: 1_700_000_200_000,
      }),
    );
    expect(provider.recoverAnchorNoInvoice).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        schemaVersion: 6,
        phase: "purchases-attested",
      }),
    );
    expect(attestApplication.mock.calls.map((call) => call[1])).toEqual([
      "identity",
      "access-granted",
      "access-revoked",
    ]);
    expect(
      provider.validateForAnchorRecovery.mock.invocationCallOrder[0],
    ).toBeLessThan(stateStore.replace.mock.invocationCallOrder[0]);
    expect(
      stateStore.replace.mock.invocationCallOrder[0],
    ).toBeLessThan(provider.recoverAnchorNoInvoice.mock.invocationCallOrder[0]);
    expect(stateStore.remove).toHaveBeenCalledTimes(1);
    expect(JSON.parse(output.mock.calls[0][0] as string)).toEqual({
      mode: "executed",
      operation: "recover-anchor-no-invoice",
      sandboxOnly: true,
      realEventsProjected: 5,
      purchaseEventsPreviouslyAttested: 2,
      lifecycle: [
        "purchase",
        "subscription_invoice_paid",
        "failed_payment",
        "cancellation",
        "refund",
      ],
      recovery: "anchor-no-invoice",
      mutatingResumeRetryable: false,
      mutatingRecoveryRetryable: false,
      isolatedConvexAttested: true,
      accessGrantVerified: true,
      accessRevocationVerified: true,
      continuationRemoved: true,
    });
  });

  it("performs no recovery mutation when exact preflight fails", async () => {
    const provider = fakeProvider();
    provider.validateForAnchorRecovery.mockRejectedValueOnce(
      new StripeSandboxJourneyError(
        "sandbox_anchor_recovery_invoice_state_invalid",
      ),
    );
    const stateStore = fakeStateStore(failedAnchorState());

    await expect(runStripeSandboxJourney({
      argv: ["recover-anchor-no-invoice", "--execute"],
      environment: readyEnvironment(),
      provider,
      stateStore,
      attestApplication: fakeAttestation(),
    })).rejects.toMatchObject({
      code: "sandbox_anchor_recovery_invoice_state_invalid",
    });
    expect(stateStore.replace).not.toHaveBeenCalled();
    expect(provider.recoverAnchorNoInvoice).not.toHaveBeenCalled();
    expect(stateStore.remove).not.toHaveBeenCalled();
  });

  it("latches an incomplete recovery and refuses every replay", async () => {
    const provider = fakeProvider();
    provider.recoverAnchorNoInvoice.mockResolvedValueOnce({
      realEventsProjected: 4,
    });
    const stateStore = fakeStateStore(failedAnchorState());

    await expect(runStripeSandboxJourney({
      argv: ["recover-anchor-no-invoice", "--execute"],
      environment: readyEnvironment(),
      provider,
      stateStore,
      attestApplication: fakeAttestation(),
      now: () => 1_700_000_200_000,
    })).rejects.toMatchObject({
      code: "sandbox_journey_evidence_incomplete",
    });
    expect(stateStore.replace).toHaveBeenCalledTimes(1);
    expect(stateStore.remove).not.toHaveBeenCalled();

    await expect(runStripeSandboxJourney({
      argv: ["recover-anchor-no-invoice", "--execute"],
      environment: readyEnvironment(),
      provider,
      stateStore,
      attestApplication: fakeAttestation(),
      now: () => 1_700_000_300_000,
    })).rejects.toMatchObject({
      code: "sandbox_anchor_recovery_state_invalid",
    });
    expect(provider.recoverAnchorNoInvoice).toHaveBeenCalledTimes(1);
  });

  it("repairs only the rejected invoice-create attempt after exact preflight", async () => {
    const provider = fakeProvider();
    const state = rejectedInvoiceCreateState();
    const stateStore = fakeStateStore(state);
    const attestApplication = fakeAttestation();
    const output = vi.fn();

    await runStripeSandboxJourney({
      argv: ["repair-invoice-create-rejected", "--execute"],
      environment: readyEnvironment(),
      provider,
      stateStore,
      attestApplication,
      now: () => 1_700_000_300_000,
      writeOutput: output,
    });

    expect(provider.resume).not.toHaveBeenCalled();
    expect(provider.validateForResume).toHaveBeenCalledWith(
      expect.any(Object),
      state,
    );
    expect(provider.validateForAnchorRecovery).toHaveBeenCalledWith(
      expect.any(Object),
      state,
    );
    expect(stateStore.replace).toHaveBeenCalledWith(
      expect.stringMatching(/work\/stripe-sandbox\/journey\.json$/),
      expect.objectContaining({
        schemaVersion: 6,
        phase: "repair-attempted",
        resumeAttemptedAt: 1_700_000_100_000,
        recoveryAttemptedAt: 1_700_000_200_000,
        repairAttemptedAt: 1_700_000_300_000,
      }),
    );
    expect(provider.recoverAnchorNoInvoice).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        schemaVersion: 6,
        phase: "repair-attempted",
      }),
    );
    expect(attestApplication.mock.calls.map((call) => call[1])).toEqual([
      "identity",
      "access-granted",
      "access-revoked",
    ]);
    expect(
      provider.validateForAnchorRecovery.mock.invocationCallOrder[0],
    ).toBeLessThan(stateStore.replace.mock.invocationCallOrder[0]);
    expect(
      stateStore.replace.mock.invocationCallOrder[0],
    ).toBeLessThan(provider.recoverAnchorNoInvoice.mock.invocationCallOrder[0]);
    expect(stateStore.remove).toHaveBeenCalledTimes(1);
    expect(JSON.parse(output.mock.calls[0][0] as string)).toEqual({
      mode: "executed",
      operation: "repair-invoice-create-rejected",
      sandboxOnly: true,
      realEventsProjected: 5,
      purchaseEventsPreviouslyAttested: 2,
      lifecycle: [
        "purchase",
        "subscription_invoice_paid",
        "failed_payment",
        "cancellation",
        "refund",
      ],
      recovery: "invoice-create-rejected",
      mutatingResumeRetryable: false,
      mutatingRecoveryRetryable: false,
      mutatingRepairRetryable: false,
      isolatedConvexAttested: true,
      accessGrantVerified: true,
      accessRevocationVerified: true,
      continuationRemoved: true,
    });
  });

  it("performs no repair mutation when the exact provider preflight fails", async () => {
    const provider = fakeProvider();
    provider.validateForAnchorRecovery.mockRejectedValueOnce(
      new StripeSandboxJourneyError(
        "sandbox_anchor_recovery_invoice_state_invalid",
      ),
    );
    const stateStore = fakeStateStore(rejectedInvoiceCreateState());

    await expect(runStripeSandboxJourney({
      argv: ["repair-invoice-create-rejected", "--execute"],
      environment: readyEnvironment(),
      provider,
      stateStore,
      attestApplication: fakeAttestation(),
    })).rejects.toMatchObject({
      code: "sandbox_anchor_recovery_invoice_state_invalid",
    });
    expect(stateStore.replace).not.toHaveBeenCalled();
    expect(provider.recoverAnchorNoInvoice).not.toHaveBeenCalled();
    expect(stateStore.remove).not.toHaveBeenCalled();
  });

  it("latches an incomplete invoice-create repair and refuses replay", async () => {
    const provider = fakeProvider();
    provider.recoverAnchorNoInvoice.mockResolvedValueOnce({
      realEventsProjected: 4,
    });
    const stateStore = fakeStateStore(rejectedInvoiceCreateState());

    await expect(runStripeSandboxJourney({
      argv: ["repair-invoice-create-rejected", "--execute"],
      environment: readyEnvironment(),
      provider,
      stateStore,
      attestApplication: fakeAttestation(),
      now: () => 1_700_000_300_000,
    })).rejects.toMatchObject({
      code: "sandbox_journey_evidence_incomplete",
    });
    expect(stateStore.replace).toHaveBeenCalledTimes(1);
    expect(stateStore.remove).not.toHaveBeenCalled();

    await expect(runStripeSandboxJourney({
      argv: ["repair-invoice-create-rejected", "--execute"],
      environment: readyEnvironment(),
      provider,
      stateStore,
      attestApplication: fakeAttestation(),
      now: () => 1_700_000_400_000,
    })).rejects.toMatchObject({
      code: "sandbox_invoice_repair_state_invalid",
    });
    expect(provider.recoverAnchorNoInvoice).toHaveBeenCalledTimes(1);
  });

  it("finishes only cancellation and refund after Managed Payments rejects invoices", async () => {
    const provider = fakeProvider();
    const state = managedInvoiceUnsupportedState();
    const stateStore = fakeStateStore(state);
    const attestApplication = fakeAttestation();
    const output = vi.fn();

    await runStripeSandboxJourney({
      argv: ["finish-managed-lifecycle", "--execute"],
      environment: readyEnvironment(),
      provider,
      stateStore,
      attestApplication,
      now: () => 1_700_000_400_000,
      writeOutput: output,
    });

    expect(provider.resume).not.toHaveBeenCalled();
    expect(provider.recoverAnchorNoInvoice).not.toHaveBeenCalled();
    expect(provider.validateForResume).toHaveBeenCalledWith(
      expect.any(Object),
      state,
    );
    expect(provider.validateForAnchorRecovery).toHaveBeenCalledWith(
      expect.any(Object),
      state,
    );
    expect(stateStore.replace).toHaveBeenCalledWith(
      expect.stringMatching(/work\/stripe-sandbox\/journey\.json$/),
      expect.objectContaining({
        schemaVersion: 6,
        phase: "managed-lifecycle-attempted",
        resumeAttemptedAt: 1_700_000_100_000,
        recoveryAttemptedAt: 1_700_000_200_000,
        repairAttemptedAt: 1_700_000_300_000,
        managedFinishAttemptedAt: 1_700_000_400_000,
      }),
    );
    expect(provider.finishManagedLifecycle).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        schemaVersion: 6,
        phase: "managed-lifecycle-attempted",
      }),
    );
    expect(attestApplication.mock.calls.map((call) => call[1])).toEqual([
      "identity",
      "access-granted",
      "access-revoked",
    ]);
    expect(
      provider.validateForAnchorRecovery.mock.invocationCallOrder[0],
    ).toBeLessThan(stateStore.replace.mock.invocationCallOrder[0]);
    expect(
      stateStore.replace.mock.invocationCallOrder[0],
    ).toBeLessThan(provider.finishManagedLifecycle.mock.invocationCallOrder[0]);
    expect(stateStore.remove).toHaveBeenCalledTimes(1);
    expect(JSON.parse(output.mock.calls[0][0] as string)).toEqual({
      mode: "executed",
      operation: "finish-managed-lifecycle",
      sandboxOnly: true,
      realEventsProjected: 3,
      purchaseEventsPreviouslyAttested: 2,
      lifecycle: [
        "purchase",
        "cancellation",
        "refund",
      ],
      renewalEvidence: "separate-test-clock-required",
      mutatingResumeRetryable: false,
      mutatingRecoveryRetryable: false,
      mutatingRepairRetryable: false,
      mutatingManagedFinishRetryable: false,
      isolatedConvexAttested: true,
      accessGrantVerified: true,
      accessRevocationVerified: true,
      continuationRemoved: true,
    });
  });

  it("performs no managed finish mutation when exact preflight fails", async () => {
    const provider = fakeProvider();
    provider.validateForAnchorRecovery.mockRejectedValueOnce(
      new StripeSandboxJourneyError(
        "sandbox_anchor_recovery_invoice_state_invalid",
      ),
    );
    const stateStore = fakeStateStore(managedInvoiceUnsupportedState());

    await expect(runStripeSandboxJourney({
      argv: ["finish-managed-lifecycle", "--execute"],
      environment: readyEnvironment(),
      provider,
      stateStore,
      attestApplication: fakeAttestation(),
    })).rejects.toMatchObject({
      code: "sandbox_anchor_recovery_invoice_state_invalid",
    });
    expect(stateStore.replace).not.toHaveBeenCalled();
    expect(provider.finishManagedLifecycle).not.toHaveBeenCalled();
    expect(stateStore.remove).not.toHaveBeenCalled();
  });

  it("latches an incomplete managed finish and refuses replay", async () => {
    const provider = fakeProvider();
    provider.finishManagedLifecycle.mockResolvedValueOnce({
      realEventsProjected: 2,
    });
    const stateStore = fakeStateStore(managedInvoiceUnsupportedState());

    await expect(runStripeSandboxJourney({
      argv: ["finish-managed-lifecycle", "--execute"],
      environment: readyEnvironment(),
      provider,
      stateStore,
      attestApplication: fakeAttestation(),
      now: () => 1_700_000_400_000,
    })).rejects.toMatchObject({
      code: "sandbox_journey_evidence_incomplete",
    });
    expect(stateStore.replace).toHaveBeenCalledTimes(1);
    expect(stateStore.remove).not.toHaveBeenCalled();

    await expect(runStripeSandboxJourney({
      argv: ["finish-managed-lifecycle", "--execute"],
      environment: readyEnvironment(),
      provider,
      stateStore,
      attestApplication: fakeAttestation(),
      now: () => 1_700_000_500_000,
    })).rejects.toMatchObject({
      code: "sandbox_managed_finish_state_invalid",
    });
    expect(provider.finishManagedLifecycle).toHaveBeenCalledTimes(1);
  });

  it.each([
    "docs/stripe-checkout-secrets.json",
    "work/stripe-sandbox/nested/journey.json",
  ])("refuses unsafe continuation path %s", async (statePath) => {
    await expect(runStripeSandboxJourney({
      argv: [
        "prepare",
        "--execute",
        "--state",
        statePath,
      ],
      environment: readyEnvironment(),
      provider: fakeProvider(),
      stateStore: fakeStateStore(),
      attestApplication: fakeAttestation(),
    })).rejects.toMatchObject({ code: "sandbox_state_path_refused" });
  });

  it("recognizes and refuses an interrupted schema-5 preparation journal", async () => {
    const statePath =
      `work/stripe-sandbox/journey-preparing-${process.pid}-${Date.now()}.json`;
    const absoluteStatePath = resolve(statePath);
    const provider = fakeProvider();
    provider.prepare.mockRejectedValueOnce(
      new StripeSandboxJourneyError("sandbox_prepare_provider_failed"),
    );
    await rm(absoluteStatePath, { force: true });

    try {
      await expect(runStripeSandboxJourney({
        argv: ["prepare", "--execute", "--state", statePath],
        environment: readyEnvironment(),
        provider,
        attestApplication: fakeAttestation(),
        now: () => 1_800_000_000_000,
        randomId: () => "interruptedpreparation",
      })).rejects.toMatchObject({
        code: "sandbox_prepare_provider_failed",
      });

      await expect(runStripeSandboxJourney({
        argv: ["resume", "--execute", "--state", statePath],
        environment: readyEnvironment(),
        provider: fakeProvider(),
        attestApplication: fakeAttestation(),
      })).rejects.toMatchObject({
        code: "sandbox_prepare_incomplete",
      });
    } finally {
      await rm(absoluteStatePath, { force: true });
    }
  });

  it("protects real continuation storage and refuses a symlink", async () => {
    const statePath =
      `work/stripe-sandbox/journey-test-${process.pid}-${Date.now()}.json`;
    const absoluteStatePath = resolve(statePath);
    const output = vi.fn();
    await rm(absoluteStatePath, { force: true });

    try {
      await runStripeSandboxJourney({
        argv: ["prepare", "--execute", "--state", statePath],
        environment: readyEnvironment(),
        provider: fakeProvider(),
        attestApplication: fakeAttestation(),
        now: () => 1_800_000_000_000,
        randomId: () => "filesystemrunidentifier",
        writeOutput: output,
      });

      expect((await lstat(absoluteStatePath)).mode & 0o077).toBe(0);
      expect((await lstat(dirname(absoluteStatePath))).mode & 0o077).toBe(0);
      expect(await readFile(absoluteStatePath, "utf8")).toContain(
        "cs_test_monthly",
      );

      await runStripeSandboxJourney({
        argv: ["resume", "--execute", "--state", statePath],
        environment: readyEnvironment(),
        provider: fakeProvider(),
        attestApplication: fakeAttestation(),
        now: () => 1_800_000_100_000,
        writeOutput: output,
      });
      await expect(lstat(absoluteStatePath)).rejects.toMatchObject({
        code: "ENOENT",
      });

      await mkdir(dirname(absoluteStatePath), {
        recursive: true,
        mode: 0o700,
      });
      await chmod(dirname(absoluteStatePath), 0o700);
      await symlink(resolve("package.json"), absoluteStatePath);
      await expect(runStripeSandboxJourney({
        argv: ["resume", "--execute", "--state", statePath],
        environment: readyEnvironment(),
        provider: fakeProvider(),
        attestApplication: fakeAttestation(),
      })).rejects.toMatchObject({
        code: "sandbox_state_permissions_invalid",
      });
    } finally {
      await rm(absoluteStatePath, { force: true });
    }
  });
});

function readyEnvironment(): Record<string, string> {
  return Object.fromEntries([
    ["STRIPE_SANDBOX_RUNTIME_KEY", runtimeKey],
    ["STRIPE_SANDBOX_OPERATOR_KEY", operatorKey],
    ["STRIPE_SANDBOX_WEBHOOK_SECRET", webhookSecret],
    [
      "STRIPE_SANDBOX_EXECUTION_CONFIRMATION",
      "RUN_GUMMYUI_STRIPE_SANDBOX_JOURNEY",
    ],
    ["STRIPE_SANDBOX_APP_ORIGIN", "http://127.0.0.1:3000"],
    [
      "STRIPE_SANDBOX_CONVEX_URL",
      "https://isolated-sandbox.convex.cloud",
    ],
    ["STRIPE_SANDBOX_ACCOUNT_ID", "account:sandbox-test"],
    ["STRIPE_SANDBOX_WORKSPACE_ID", "workspace:sandbox-test"],
    ...commercialPlans.map((plan, index) => [
      `STRIPE_SANDBOX_PRICE_${plan.id.replaceAll("-", "_").toUpperCase()}`,
      `price_Sandbox${index}`,
    ]),
  ]);
}

function continuationState(): StripeSandboxJourneyState {
  return {
    schemaVersion: 2,
    runId: "gummyui-sandbox-runidentifier123456",
    createdAt: 1_700_000_000_000,
    applicationOrigin: "http://127.0.0.1:3000",
    accountId: "account:sandbox-test",
    workspaceId: "workspace:sandbox-test",
    resumeAttemptedAt: null,
    checkouts: [
      {
        planId: "individual-monthly",
        sessionId: "cs_test_monthly",
        checkoutUrl: "https://checkout.stripe.com/c/pay/test-monthly",
      },
      {
        planId: "individual-lifetime",
        sessionId: "cs_test_lifetime",
        checkoutUrl: "https://checkout.stripe.com/c/pay/test-lifetime",
      },
    ],
  };
}

function failedAnchorState(): StripeSandboxJourneyState {
  return {
    ...continuationState(),
    schemaVersion: 3,
    phase: "ready",
    resumeAttemptedAt: 1_700_000_100_000,
    recoveryAttemptedAt: null,
  };
}

function rejectedInvoiceCreateState(): StripeSandboxJourneyState {
  return {
    ...failedAnchorState(),
    schemaVersion: 4,
    phase: "purchases-attested",
    recoveryAttemptedAt: 1_700_000_200_000,
    repairAttemptedAt: null,
  };
}

function managedInvoiceUnsupportedState(): StripeSandboxJourneyState {
  return {
    ...rejectedInvoiceCreateState(),
    schemaVersion: 5,
    phase: "repair-attempted",
    repairAttemptedAt: 1_700_000_300_000,
    managedFinishAttemptedAt: null,
  };
}

function completedSession(
  id: string,
  monthly: boolean,
): Stripe.Checkout.Session {
  return {
    id,
    object: "checkout.session",
    livemode: false,
    status: "complete",
    payment_status: "paid",
    amount_total: monthly ? 4_900 : 89_900,
    currency: "usd",
    customer: monthly ? "cus_sandbox" : "cus_lifetime",
    payment_intent: monthly ? null : "pi_sandbox",
    subscription: monthly
      ? {
          id: "sub_sandbox",
          object: "subscription",
          latest_invoice: "in_initial",
        }
      : null,
    metadata: {
      commercial_offer_ref:
        monthly ? "individual-monthly" : "individual-lifetime",
      immediate_supply_requested: "true",
      cancellation_loss_acknowledged: "true",
    },
  } as unknown as Stripe.Checkout.Session;
}

function event(
  id: string,
  type: string,
  object: Record<string, unknown>,
): Stripe.Event {
  return {
    id,
    object: "event",
    livemode: false,
    type,
    data: { object },
  } as unknown as Stripe.Event;
}

function anchorRecoveryPreflightFixture(
  variant:
    | "valid"
    | "live-subscription"
    | "wrong-metadata"
    | "existing-refund"
    | "run-payment-method"
    | "later-cancellation",
) {
  const config = readStripeSandboxJourneyConfig(readyEnvironment());
  const state = failedAnchorState();
  const monthly = completedSession("cs_test_monthly", true);
  const lifetime = completedSession("cs_test_lifetime", false);
  const subscription = {
    id: "sub_sandbox",
    livemode: variant === "live-subscription",
    status: "active",
    cancel_at_period_end: false,
    canceled_at: null,
    created: 1_700_000_000,
    customer: "cus_sandbox",
    default_payment_method: "pm_good",
    latest_invoice: "in_initial",
    metadata: {
      account_id: state.accountId,
      workspace_id: variant === "wrong-metadata"
        ? "workspace:sandbox-wrong"
        : state.workspaceId,
      commercial_offer_ref: "individual-monthly",
    },
    items: {
      data: [{
        quantity: 1,
        price: { id: config.priceIds["individual-monthly"] },
        current_period_start: 1_700_000_100,
        current_period_end: 1_702_678_500,
      }],
    },
  };
  const initialInvoice = {
    id: "in_initial",
    livemode: false,
    status: "paid",
    billing_reason: "subscription_create",
    customer: "cus_sandbox",
    parent: {
      subscription_details: { subscription: "sub_sandbox" },
    },
  };
  const createInvoice = vi.fn();
  const updateSubscription = vi.fn(async (
    _id: string,
    params: { cancel_at_period_end?: boolean },
  ) => ({
    ...subscription,
    cancel_at_period_end: params.cancel_at_period_end ?? false,
  }));
  const cancelSubscription = vi.fn(async () => ({
    ...subscription,
    status: "canceled",
  }));
  const createRefund = vi.fn(async () => ({
    id: "re_sandbox",
    status: "succeeded",
    amount: 89_900,
    currency: "usd",
  }));
  const lifecycleEvents = new Map<string, Stripe.Event>([
    [
      "customer.subscription.updated",
      event("evt_scheduled", "customer.subscription.updated", {
        id: "sub_sandbox",
        cancel_at_period_end: true,
      }),
    ],
    [
      "customer.subscription.deleted",
      event("evt_deleted", "customer.subscription.deleted", {
        id: "sub_sandbox",
      }),
    ],
    [
      "refund.created",
      event("evt_refund", "refund.created", {
        id: "re_sandbox",
      }),
    ],
  ]);
  const operator = {
    prices: {
      retrieve: vi.fn(async (priceId: string) => {
        const plan = commercialPlans.find((candidate) =>
          config.priceIds[candidate.id] === priceId)!;
        return {
          id: priceId,
          active: true,
          currency: "usd",
          livemode: false,
          type: plan.billingInterval === "lifetime"
            ? "one_time"
            : "recurring",
          unit_amount: plan.priceUsd * 100,
          recurring: plan.billingInterval === "lifetime"
            ? null
            : { interval: plan.billingInterval, interval_count: 1 },
        };
      }),
    },
    checkout: {
      sessions: {
        retrieve: vi.fn(async (id: string) =>
          id === monthly.id ? monthly : lifetime),
      },
    },
    subscriptions: {
      retrieve: vi.fn(async () => subscription),
      update: updateSubscription,
      cancel: cancelSubscription,
    },
    invoices: {
      list: vi.fn(async () => ({
        data: [initialInvoice],
        has_more: false,
      })),
      create: createInvoice,
    },
    paymentIntents: {
      retrieve: vi.fn(async () => ({
        id: "pi_sandbox",
        livemode: false,
        status: "succeeded",
        amount_received: 89_900,
        currency: "usd",
      })),
    },
    refunds: {
      list: vi.fn(async () => ({
        data: variant === "existing-refund"
          ? [{ id: "re_existing" }]
          : [],
        has_more: false,
      })),
      create: createRefund,
    },
    paymentMethods: {
      list: vi.fn(async () => ({
        data: [{
          id: "pm_good",
          livemode: false,
          metadata: variant === "run-payment-method"
            ? { gummyui_sandbox_run_id: state.runId }
            : {},
        }],
        has_more: false,
      })),
    },
    events: {
      list: vi.fn(async (params: { types: string[] }) => ({
        data: params.types.length > 1
          ? (
              variant === "later-cancellation"
                ? [lifecycleEvents.get("customer.subscription.updated")!]
                : []
            )
          : [lifecycleEvents.get(params.types[0])!],
        has_more: false,
      })),
    },
  };
  const fetchImplementation = vi.fn(async () =>
    Response.json({ received: true, status: "applied" }));
  return {
    config,
    state,
    createInvoice,
    updateSubscription,
    cancelSubscription,
    createRefund,
    fetchImplementation,
    provider: new RealStripeSandboxJourneyProvider({
      stripeFactory: vi.fn(() => operator as unknown as Stripe),
      fetchImplementation: fetchImplementation as typeof fetch,
      now: () => 1_800_000_000_000,
      sleep: vi.fn(async () => undefined),
      eventWaitTimeoutMs: 10,
      webhookFetchTimeoutMs: 10,
    }),
  };
}

function fakeProvider() {
  return {
    prepare: vi.fn(async () => ({
      pricesVerified: 9,
      checkouts: continuationState().checkouts,
    })),
    validateForResume: vi.fn(async () => undefined),
    resume: vi.fn(async (
      _config,
      _state,
      hooks: { afterPurchasesProjected(): Promise<void> },
    ) => {
      await hooks.afterPurchasesProjected();
      return { realEventsProjected: 5 };
    }),
    validateForAnchorRecovery: vi.fn(async () => undefined),
    recoverAnchorNoInvoice: vi.fn(async () => ({
      realEventsProjected: 5,
    })),
    finishManagedLifecycle: vi.fn(async () => ({
      realEventsProjected: 3,
    })),
  } satisfies StripeSandboxJourneyProvider;
}

function fakeAttestation() {
  const attestation = vi.fn<typeof attestSandboxApplication>();
  attestation.mockResolvedValue(undefined);
  return attestation;
}

function fakeStateStore(state = continuationState()) {
  let currentState = state;
  return {
    read: vi.fn(async () => currentState),
    create: vi.fn(async () => undefined),
    replace: vi.fn(async (
      _path: string,
      replacement: StripeSandboxJourneyState,
    ) => {
      currentState = replacement;
    }),
    remove: vi.fn(async () => undefined),
  };
}
