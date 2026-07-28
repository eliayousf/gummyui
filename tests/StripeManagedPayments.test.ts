import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { opaqueId } from "../lib/commerce";

vi.mock("server-only", () => ({}));
vi.mock("@workos-inc/authkit-nextjs", () => ({
  withAuth: vi.fn(),
}));

import {
  paidProductRefs,
  buildStripeFulfillmentProjection,
} from "../lib/commerce/stripe-fulfillment";
import {
  isValidStripeServerApiKey,
  normalizeStripeCheckoutEvent,
  readStripeManagedPaymentsConfig,
  STRIPE_MANAGED_PAYMENTS_API_VERSION,
  StripeCheckoutSessionRetriever,
  StripeAdjustmentRetriever,
  StripeInvoicePaymentIntentRetriever,
  StripeCheckoutWebhookAdapter,
  StripeInvoiceLifecycleRetriever,
  StripeManagedPaymentsService,
  type StripeManagedPaymentsConfig,
} from "../lib/commerce/stripe-managed-payments";
import { buildStripeLifecycleProjection } from "../lib/commerce/stripe-lifecycle";
import { POST as checkoutPost } from "../app/api/checkout/route";
import { POST as stripeWebhookPost } from "../app/api/webhooks/stripe/route";

const accountId = opaqueId("account:stripe:test:001", "account");
const workspaceId = opaqueId("workspace:stripe:test:001", "workspace");
const restrictedStripeKey = `rk_live_${"a".repeat(24)}`;
const config: StripeManagedPaymentsConfig = {
  secretKey: "sk_test_not-a-real-key",
  applicationOrigin: "https://gummyui.dev",
  priceIds: {
    "individual-monthly": "price_IndividualMonthly",
    "individual-yearly": "price_IndividualYearly",
    "individual-lifetime": "price_IndividualLifetime",
    "team-monthly": "price_TeamMonthly",
    "team-yearly": "price_TeamYearly",
    "team-lifetime": "price_TeamLifetime",
    "organization-monthly": "price_OrganizationMonthly",
    "organization-yearly": "price_OrganizationYearly",
    "organization-lifetime": "price_OrganizationLifetime",
  },
};

function checkoutRequest(overrides: Record<string, unknown> = {}) {
  return {
    idempotencyKey: "checkout:request:stripe:001",
    accountId,
    workspaceId,
    commercialOfferRef: "individual-lifetime",
    returnPath: "/account/purchases",
    consent: {
      immediateSupplyRequested: true,
      cancellationLossAcknowledged: true,
      policyVersion: "2026-07-27",
      capturedAt: 1_800_000_000_000,
    },
    ...overrides,
  };
}

describe("Stripe Managed Payments checkout boundary", () => {
  let calls: Array<{
    params: Stripe.Checkout.SessionCreateParams;
    options: Stripe.RequestOptions | undefined;
  }>;

  beforeEach(() => {
    calls = [];
  });

  it("uses the server allowlist, one-time mode, Managed Payments and consent evidence for lifetime", async () => {
    const service = new StripeManagedPaymentsService(
      {
        async create(params, options) {
          calls.push({ params, options });
          return {
            id: "cs_test_approved",
            url: "https://checkout.stripe.com/c/pay/cs_test_approved",
          } as Stripe.Checkout.Session;
        },
      },
      config,
    );

    await expect(
      service.createHostedCheckout(checkoutRequest()),
    ).resolves.toEqual({
      checkoutRef: "cs_test_approved",
      checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_approved",
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      params: {
        mode: "payment",
        line_items: [{ price: "price_IndividualLifetime", quantity: 1 }],
        managed_payments: { enabled: true },
        customer_creation: "always",
        consent_collection: { terms_of_service: "required" },
        client_reference_id: workspaceId,
        metadata: {
          account_id: accountId,
          workspace_id: workspaceId,
          commercial_offer_ref: "individual-lifetime",
          immediate_supply_requested: "true",
          cancellation_loss_acknowledged: "true",
        },
        success_url:
          "https://gummyui.dev/account/purchases?checkout=success&session_id={CHECKOUT_SESSION_ID}",
        cancel_url:
          "https://gummyui.dev/checkout?plan=individual-lifetime&checkout=cancelled",
      },
      options: {
        apiVersion: STRIPE_MANAGED_PAYMENTS_API_VERSION,
        idempotencyKey: "checkout:request:stripe:001",
      },
    });
  });

  it("uses subscription mode and subscription metadata for monthly and yearly plans", async () => {
    const service = new StripeManagedPaymentsService(
      {
        async create(params, options) {
          calls.push({ params, options });
          return {
            id: "cs_test_subscription",
            url: "https://checkout.stripe.com/c/pay/cs_test_subscription",
          } as Stripe.Checkout.Session;
        },
      },
      config,
    );

    await service.createHostedCheckout(
      checkoutRequest({ commercialOfferRef: "team-yearly" }),
    );

    expect(calls[0]).toMatchObject({
      params: {
        mode: "subscription",
        line_items: [{ price: "price_TeamYearly", quantity: 1 }],
        submit_type: "subscribe",
        subscription_data: {
          metadata: {
            commercial_offer_ref: "team-yearly",
            account_id: accountId,
            workspace_id: workspaceId,
          },
        },
      },
    });
    expect(calls[0].params).not.toHaveProperty("customer_creation");
    expect(calls[0].params).not.toHaveProperty("payment_intent_data");
  });

  it("rejects unknown offers, missing consent and unsafe return paths before Stripe", async () => {
    const service = new StripeManagedPaymentsService(
      {
        async create() {
          throw new Error("Stripe must not be called");
        },
      },
      config,
    );

    await expect(
      service.createHostedCheckout(
        checkoutRequest({ commercialOfferRef: "client-supplied-price" }),
      ),
    ).rejects.toThrow("Unknown commercial offer");
    await expect(
      service.createHostedCheckout(checkoutRequest({ consent: undefined })),
    ).rejects.toThrow("Immediate digital-supply consent is required");
    await expect(
      service.createHostedCheckout(
        checkoutRequest({ returnPath: "//attacker.example" }),
      ),
    ).rejects.toThrow("Invalid checkout return path");
  });

  it("rejects a non-Stripe redirect even after a provider response", async () => {
    const service = new StripeManagedPaymentsService(
      {
        async create() {
          return {
            id: "cs_test_wrong_host",
            url: "https://attacker.example/checkout",
          } as Stripe.Checkout.Session;
        },
      },
      config,
    );

    await expect(
      service.createHostedCheckout(checkoutRequest()),
    ).rejects.toThrow("unexpected checkout URL");
  });

  it("requires a complete server-only configuration", () => {
    expect(readStripeManagedPaymentsConfig({})).toBeNull();
    expect(() =>
      readStripeManagedPaymentsConfig({
        STRIPE_SECRET_KEY: "sk_test_present",
        GUMMYUI_ORIGIN: "https://gummyui.dev",
      })).toThrow("billing provider is unavailable");

    expect(
      readStripeManagedPaymentsConfig({
        STRIPE_SECRET_KEY: restrictedStripeKey,
        GUMMYUI_ORIGIN: "https://gummyui.dev",
        STRIPE_PRICE_INDIVIDUAL_MONTHLY: "price_IndividualMonthly",
        STRIPE_PRICE_INDIVIDUAL_YEARLY: "price_IndividualYearly",
        STRIPE_PRICE_INDIVIDUAL_LIFETIME: "price_IndividualLifetime",
        STRIPE_PRICE_TEAM_MONTHLY: "price_TeamMonthly",
        STRIPE_PRICE_TEAM_YEARLY: "price_TeamYearly",
        STRIPE_PRICE_TEAM_LIFETIME: "price_TeamLifetime",
        STRIPE_PRICE_ORGANIZATION_MONTHLY: "price_OrganizationMonthly",
        STRIPE_PRICE_ORGANIZATION_YEARLY: "price_OrganizationYearly",
        STRIPE_PRICE_ORGANIZATION_LIFETIME: "price_OrganizationLifetime",
      }),
    ).toEqual({
      ...config,
      secretKey: restrictedStripeKey,
    });
  });

  it("accepts secret and least-privilege restricted server-key shapes", () => {
    for (const prefix of [
      "sk_test_",
      "sk_live_",
      "rk_test_",
      "rk_live_",
    ]) {
      expect(
        isValidStripeServerApiKey(`${prefix}${"a".repeat(24)}`),
      ).toBe(true);
    }
    for (const value of [
      `pk_live_${"a".repeat(24)}`,
      `sk_${"a".repeat(24)}`,
      `rk_live_${"a".repeat(4)}`,
      `rk_live_${"a".repeat(12)} value`,
      `rk_live_${"a".repeat(12)}\nvalue`,
    ]) {
      expect(isValidStripeServerApiKey(value)).toBe(false);
    }
  });

  it("keeps the HTTP checkout route closed until identity is configured", async () => {
    const response = await checkoutPost(
      new Request("https://gummyui.dev/api/checkout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://gummyui.dev",
        },
        body: JSON.stringify({
          planId: "individual-monthly",
          requestId: "request:browser:0001",
          immediateSupplyRequested: true,
          cancellationLossAcknowledged: true,
        }),
      }),
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual({
      error: "not_found_or_forbidden",
    });
  });
});

describe("Stripe webhook verification boundary", () => {
  const rawBody = new TextEncoder().encode('{"id":"evt_test"}');
  const stripeEvent = {
    id: "evt_test_checkout",
    type: "checkout.session.completed",
    created: 1_800_000_000,
    data: {
      object: {
        id: "cs_test_completed",
        object: "checkout.session",
      },
    },
  } as Stripe.Event;

  it("normalizes only supported checkout, subscription and invoice lifecycle events", () => {
    expect(normalizeStripeCheckoutEvent(stripeEvent)).toMatchObject({
      providerKind: "stripe",
      eventId: "evt_test_checkout",
      eventType: "checkout.session.completed",
      aggregateType: "purchase",
      aggregateId: "cs_test_completed",
      occurredAt: 1_800_000_000_000,
    });
    expect(
      normalizeStripeCheckoutEvent({
        ...stripeEvent,
        type: "customer.created",
      } as Stripe.Event),
    ).toBeNull();
    expect(
      normalizeStripeCheckoutEvent({
        ...stripeEvent,
        id: "evt_test_subscription",
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_test_subscription",
            object: "subscription",
          },
        },
      } as Stripe.Event),
    ).toMatchObject({
      eventType: "customer.subscription.updated",
      aggregateType: "subscription",
      aggregateId: "sub_test_subscription",
    });
    expect(
      normalizeStripeCheckoutEvent({
        ...stripeEvent,
        id: "evt_test_invoice",
        type: "invoice.paid",
        data: {
          object: {
            id: "in_test_invoice",
            object: "invoice",
          },
        },
      } as Stripe.Event),
    ).toMatchObject({
      eventType: "invoice.paid",
      aggregateType: "invoice",
      aggregateId: "in_test_invoice",
    });
    expect(
      normalizeStripeCheckoutEvent({
        ...stripeEvent,
        id: "evt_test_refund",
        type: "refund.updated",
        data: {
          object: {
            id: "re_test_refund",
            object: "refund",
          },
        },
      } as Stripe.Event),
    ).toMatchObject({
      eventType: "refund.updated",
      aggregateType: "adjustment",
      aggregateId: "re_test_refund",
    });
  });

  it("retrieves provider-authoritative line items with the Managed Payments version", async () => {
    const retrieve = vi.fn(async () => ({
      id: "cs_test_completed",
    }) as Stripe.Checkout.Session);
    const sessions = new StripeCheckoutSessionRetriever({ retrieve });

    await expect(
      sessions.retrieve("cs_test_completed"),
    ).resolves.toMatchObject({ id: "cs_test_completed" });
    expect(retrieve).toHaveBeenCalledWith(
      "cs_test_completed",
      { expand: ["line_items.data.price", "subscription"] },
      { apiVersion: STRIPE_MANAGED_PAYMENTS_API_VERSION },
    );
    await expect(
      sessions.retrieve("attacker-controlled"),
    ).rejects.toThrow("Invalid Stripe Checkout Session identifier");
  });

  it("retrieves invoices with their subscription and price expanded", async () => {
    const retrieve = vi.fn(async () => ({
      id: "in_test_renewal",
    }) as Stripe.Invoice);
    const invoices = new StripeInvoiceLifecycleRetriever({ retrieve });

    await expect(
      invoices.retrieve("in_test_renewal"),
    ).resolves.toMatchObject({ id: "in_test_renewal" });
    expect(retrieve).toHaveBeenCalledWith(
      "in_test_renewal",
      {
        expand: [
          "parent.subscription_details.subscription",
          "parent.subscription_details.subscription.items.data.price",
        ],
      },
      { apiVersion: STRIPE_MANAGED_PAYMENTS_API_VERSION },
    );
    await expect(
      invoices.retrieve("attacker-controlled"),
    ).rejects.toThrow("Invalid Stripe Invoice identifier");
  });

  it("resolves the single invoice PaymentIntent and authoritative adjustments", async () => {
    const list = vi.fn(async () => ({
      object: "list" as const,
      data: [
        {
          payment: {
            type: "payment_intent",
            payment_intent: "pi_test_renewal",
          },
        },
      ],
      has_more: false,
      url: "/v1/invoice_payments",
    }));
    const invoicePayments = new StripeInvoicePaymentIntentRetriever({
      list: list as never,
    });
    await expect(
      invoicePayments.retrieve("in_test_renewal"),
    ).resolves.toBe("pi_test_renewal");
    expect(list).toHaveBeenCalledWith(
      {
        invoice: "in_test_renewal",
        payment: { type: "payment_intent" },
        limit: 2,
      },
      { apiVersion: STRIPE_MANAGED_PAYMENTS_API_VERSION },
    );

    const refundRetrieve = vi.fn(async () => ({
      id: "re_test_refund",
      object: "refund",
    }) as Stripe.Refund);
    const disputeRetrieve = vi.fn(async () => ({
      id: "dp_test_dispute",
      object: "dispute",
    }) as Stripe.Dispute);
    const adjustments = new StripeAdjustmentRetriever(
      { retrieve: refundRetrieve },
      { retrieve: disputeRetrieve },
    );
    await adjustments.retrieve("refund.updated", "re_test_refund");
    await adjustments.retrieve(
      "charge.dispute.updated",
      "dp_test_dispute",
    );
    expect(refundRetrieve).toHaveBeenCalledWith(
      "re_test_refund",
      { expand: ["charge", "payment_intent"] },
      { apiVersion: STRIPE_MANAGED_PAYMENTS_API_VERSION },
    );
    expect(disputeRetrieve).toHaveBeenCalledWith(
      "dp_test_dispute",
      { expand: ["charge", "payment_intent"] },
      { apiVersion: STRIPE_MANAGED_PAYMENTS_API_VERSION },
    );
  });

  it("passes the exact raw body and timestamp to Stripe signature verification", async () => {
    const verifier = {
      constructEventAsync: vi.fn(async () => stripeEvent),
    };
    const adapter = new StripeCheckoutWebhookAdapter(
      verifier,
      "whsec_test_only",
    );
    const result = await adapter.verify({
      rawBody,
      headers: new Headers({ "stripe-signature": "t=1,v1=test" }),
      receivedAt: 1_800_000_000_999,
    });

    expect(result).toMatchObject({
      verified: true,
      event: {
        eventId: "evt_test_checkout",
        aggregateId: "cs_test_completed",
      },
    });
    expect(verifier.constructEventAsync).toHaveBeenCalledWith(
      rawBody,
      "t=1,v1=test",
      "whsec_test_only",
      300,
      undefined,
      1_800_000_000,
    );
    if (result.verified) {
      expect(result.payloadHash).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("rejects missing signatures and unsupported payloads", async () => {
    const adapter = new StripeCheckoutWebhookAdapter(
      {
        async constructEventAsync() {
          return {
            ...stripeEvent,
            type: "customer.created",
          } as Stripe.Event;
        },
      },
      "whsec_test_only",
    );

    await expect(
      adapter.verify({
        rawBody,
        headers: new Headers(),
        receivedAt: 1_800_000_000_000,
      }),
    ).resolves.toEqual({
      verified: false,
      reason: "missing_signature",
    });
    await expect(
      adapter.verify({
        rawBody,
        headers: new Headers({ "stripe-signature": "t=1,v1=test" }),
        receivedAt: 1_800_000_000_000,
      }),
    ).resolves.toEqual({
      verified: false,
      reason: "invalid_payload",
    });
  });

  it("keeps the HTTP webhook route retryable until explicitly enabled", async () => {
    const previous = process.env.STRIPE_WEBHOOK_ENABLED;
    delete process.env.STRIPE_WEBHOOK_ENABLED;
    try {
      const response = await stripeWebhookPost(
        new Request("https://gummyui.dev/api/webhooks/stripe", {
          method: "POST",
          body: rawBody,
        }),
      );

      expect(response.status).toBe(503);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      await expect(response.json()).resolves.toEqual({
        error: "service_unavailable",
      });
    } finally {
      if (previous === undefined) {
        delete process.env.STRIPE_WEBHOOK_ENABLED;
      } else {
        process.env.STRIPE_WEBHOOK_ENABLED = previous;
      }
    }
  });
});

describe("Stripe durable fulfillment projection", () => {
  const event = {
    providerKind: "stripe",
    eventId: "evt_test_checkout",
    eventType: "checkout.session.completed",
    aggregateType: "purchase",
    aggregateId: "cs_test_completed",
    occurredAt: 1_800_000_001_000,
    payload: {} as Stripe.Event,
  };

  function session(
    overrides: Partial<Stripe.Checkout.Session> = {},
  ): Stripe.Checkout.Session {
    return {
      id: "cs_test_completed",
      object: "checkout.session",
      amount_subtotal: 89_900,
      amount_total: 89_900,
      client_reference_id: workspaceId,
      consent: { terms_of_service: "accepted" },
      created: 1_800_000_000,
      currency: "usd",
      customer: "cus_test_customer",
      line_items: {
        object: "list",
        data: [
          {
            id: "li_test",
            object: "item",
            amount_discount: 0,
            amount_subtotal: 89_900,
            amount_tax: 0,
            amount_total: 89_900,
            currency: "usd",
            description: "Individual Lifetime",
            discounts: [],
            price: {
              id: "price_IndividualLifetime",
              object: "price",
              active: true,
              billing_scheme: "per_unit",
              created: 1_800_000_000,
              currency: "usd",
              custom_unit_amount: null,
              livemode: false,
              lookup_key: null,
              metadata: {},
              nickname: null,
              product: "prod_test",
              recurring: null,
              tax_behavior: "exclusive",
              tiers_mode: null,
              transform_quantity: null,
              type: "one_time",
              unit_amount: 89_900,
              unit_amount_decimal: "89900",
            },
            quantity: 1,
            taxes: [],
          } as unknown as Stripe.LineItem,
        ],
        has_more: false,
        url: "/v1/checkout/sessions/cs_test_completed/line_items",
      },
      livemode: false,
      metadata: {
        account_id: accountId,
        workspace_id: workspaceId,
        commercial_offer_ref: "individual-lifetime",
        consent_policy_version: "2026-07-27",
        consent_captured_at: "1800000000000",
        immediate_supply_requested: "true",
        cancellation_loss_acknowledged: "true",
      },
      mode: "payment",
      payment_intent: "pi_test_payment",
      payment_status: "paid",
      status: "complete",
      ...overrides,
    } as Stripe.Checkout.Session;
  }

  function subscription(
    priceId = "price_TeamYearly",
  ): Stripe.Subscription {
    return {
      id: "sub_test_team_yearly",
      object: "subscription",
      status: "active",
      cancel_at_period_end: false,
      items: {
        object: "list",
        data: [
          {
            id: "si_test_team_yearly",
            object: "subscription_item",
            current_period_start: 1_800_000_000,
            current_period_end: 1_831_536_000,
            price: { id: priceId } as Stripe.Price,
          },
        ],
        has_more: false,
        url: "/v1/subscription_items?subscription=sub_test_team_yearly",
      },
    } as unknown as Stripe.Subscription;
  }

  it("derives all-access Individual lifetime entitlements from a paid authoritative Session", () => {
    expect(
      buildStripeFulfillmentProjection({
        event,
        checkout: session(),
        payloadHash: "a".repeat(64),
        receivedAt: 1_800_000_001_500,
        priceIds: config.priceIds,
      }),
    ).toMatchObject({
      providerEventId: "evt_test_checkout",
      checkoutSessionId: "cs_test_completed",
      accountId,
      workspaceId,
      planId: "individual-lifetime",
      billingInterval: "lifetime",
      purchaseStatus: "completed",
      currency: "USD",
      amountMinor: 89_900,
      seatLimit: 1,
      entitlementScope: "account",
      stripeSubscriptionId: null,
      updatesUntil: null,
      productRefs: [
        paidProductRefs.blocks,
        paidProductRefs.templates,
        paidProductRefs.designKit,
      ],
    });
  });

  it("derives a bounded update window for the approved Team yearly subscription", () => {
    const teamEvent = {
      ...event,
      aggregateId: "cs_test_team",
    };
    const checkout = session({
      id: "cs_test_team",
      amount_subtotal: 78_900,
      amount_total: 78_900,
      metadata: {
        ...session().metadata,
        commercial_offer_ref: "team-yearly",
      },
      mode: "subscription",
      payment_intent: null,
      subscription: subscription(),
      line_items: {
        ...session().line_items!,
        data: [
          {
            ...session().line_items!.data[0],
            amount_subtotal: 78_900,
            amount_total: 78_900,
            price: {
              ...(session().line_items!.data[0].price as Stripe.Price),
              id: "price_TeamYearly",
              type: "recurring",
              recurring: {
                interval: "year",
                interval_count: 1,
                meter: null,
                trial_period_days: null,
                usage_type: "licensed",
              },
              unit_amount: 78_900,
              unit_amount_decimal: "78900",
            } as unknown as Stripe.Price,
          },
        ],
      },
    });

    expect(
      buildStripeFulfillmentProjection({
        event: teamEvent,
        checkout,
        payloadHash: "b".repeat(64),
        receivedAt: 1_800_000_001_500,
        priceIds: config.priceIds,
      }),
    ).toMatchObject({
      purchaseStatus: "completed",
      billingInterval: "year",
      seatLimit: 5,
      entitlementScope: "workspace",
      stripeSubscriptionId: "sub_test_team_yearly",
      subscriptionCurrentPeriodStartsAt: 1_800_000_000_000,
      subscriptionCurrentPeriodEndsAt: 1_831_536_000_000,
      updatesUntil: 1_831_536_000_000,
      productRefs: [
        paidProductRefs.blocks,
        paidProductRefs.templates,
        paidProductRefs.designKit,
      ],
    });
  });

  it("rejects a tampered price, workspace, terms or consent before persistence", () => {
    for (const checkout of [
      session({
        line_items: {
          ...session().line_items!,
          data: [
            {
              ...session().line_items!.data[0],
              price: {
                ...(session().line_items!.data[0].price as Stripe.Price),
                id: "price_Attacker",
              },
            },
          ],
        },
      }),
      session({ client_reference_id: "workspace:wrong" }),
      session({
        consent: {
          terms_of_service: null,
        } as Stripe.Checkout.Session.Consent,
      }),
      session({
        metadata: {
          ...session().metadata,
          immediate_supply_requested: "false",
        },
      }),
    ]) {
      expect(() =>
        buildStripeFulfillmentProjection({
          event,
          checkout,
          payloadHash: "c".repeat(64),
          receivedAt: 1_800_000_001_500,
          priceIds: config.priceIds,
        })).toThrow();
    }
  });

  it("records delayed methods as pending and async failures as void without granting access", () => {
    const pending = buildStripeFulfillmentProjection({
      event,
      checkout: session({ payment_status: "unpaid" }),
      payloadHash: "d".repeat(64),
      receivedAt: 1_800_000_001_500,
      priceIds: config.priceIds,
    });
    const failed = buildStripeFulfillmentProjection({
      event: {
        ...event,
        eventType: "checkout.session.async_payment_failed",
      },
      checkout: session({ payment_status: "unpaid" }),
      payloadHash: "e".repeat(64),
      receivedAt: 1_800_000_001_500,
      priceIds: config.priceIds,
    });

    expect(pending.purchaseStatus).toBe("pending");
    expect(failed.purchaseStatus).toBe("void");
  });
});

describe("Stripe subscription and invoice lifecycle projection", () => {
  function subscription(
    overrides: Partial<Stripe.Subscription> = {},
  ): Stripe.Subscription {
    return {
      id: "sub_test_team_yearly",
      object: "subscription",
      status: "active",
      cancel_at_period_end: false,
      canceled_at: null,
      customer: "cus_test_customer",
      metadata: {
        account_id: accountId,
        workspace_id: workspaceId,
        commercial_offer_ref: "team-yearly",
      },
      items: {
        object: "list",
        data: [
          {
            id: "si_test_team_yearly",
            object: "subscription_item",
            current_period_start: 1_831_536_000,
            current_period_end: 1_863_072_000,
            quantity: 1,
            price: {
              id: "price_TeamYearly",
              object: "price",
              currency: "usd",
              type: "recurring",
              unit_amount: 78_900,
              recurring: {
                interval: "year",
                interval_count: 1,
              },
            } as Stripe.Price,
          } as Stripe.SubscriptionItem,
        ],
        has_more: false,
        url: "/v1/subscription_items?subscription=sub_test_team_yearly",
      },
      ...overrides,
    } as unknown as Stripe.Subscription;
  }

  function lifecycleEvent(
    type: Stripe.Event.Type,
    object: Stripe.Subscription | Stripe.Invoice,
  ) {
    return {
      providerKind: "stripe",
      eventId: `evt_test_${type.replaceAll(".", "_")}`,
      eventType: type,
      aggregateType: type.startsWith("invoice.")
        ? "invoice"
        : "subscription",
      aggregateId: object.id,
      occurredAt: 1_831_536_001_000,
      payload: {
        id: `evt_test_${type.replaceAll(".", "_")}`,
        type,
        created: 1_831_536_001,
        data: { object },
      } as Stripe.Event,
    };
  }

  function invoice(
    type: "invoice.paid" | "invoice.payment_failed",
    subscriptionValue = subscription(),
  ): Stripe.Invoice {
    const paid = type === "invoice.paid";
    return {
      id: "in_test_renewal",
      object: "invoice",
      created: 1_831_536_000,
      effective_at: 1_831_536_000,
      currency: "usd",
      total: 78_900,
      status: paid ? "paid" : "open",
      status_transitions: {
        finalized_at: 1_831_536_000,
        marked_uncollectible_at: null,
        paid_at: paid ? 1_831_536_001 : null,
        voided_at: null,
      },
      parent: {
        type: "subscription_details",
        quote_details: null,
        subscription_details: {
          metadata: subscriptionValue.metadata,
          subscription: subscriptionValue,
        },
      },
    } as unknown as Stripe.Invoice;
  }

  it("projects active, scheduled-cancellation and ended subscription state", () => {
    const scheduled = subscription({ cancel_at_period_end: true });
    expect(
      buildStripeLifecycleProjection({
        event: lifecycleEvent(
          "customer.subscription.updated",
          scheduled,
        ),
        payloadHash: "f".repeat(64),
        receivedAt: 1_831_536_001_500,
        priceIds: config.priceIds,
      }),
    ).toMatchObject({
      kind: "subscription",
      planId: "team-yearly",
      subscriptionStatus: "active",
      accessStatus: "active",
      cancelAtPeriodEnd: true,
      currentPeriodStartsAt: 1_831_536_000_000,
      currentPeriodEndsAt: 1_863_072_000_000,
    });

    const canceled = subscription({
      status: "canceled",
      canceled_at: 1_831_536_001,
    });
    expect(
      buildStripeLifecycleProjection({
        event: lifecycleEvent(
          "customer.subscription.deleted",
          canceled,
        ),
        payloadHash: "a".repeat(64),
        receivedAt: 1_831_536_001_500,
        priceIds: config.priceIds,
      }),
    ).toMatchObject({
      subscriptionStatus: "canceled",
      accessStatus: "expired",
      canceledAt: 1_831_536_001_000,
    });
  });

  it("projects paid renewals and failed renewal access states", () => {
    const paidInvoice = invoice("invoice.paid");
    expect(
      buildStripeLifecycleProjection({
        event: lifecycleEvent("invoice.paid", paidInvoice),
        invoice: paidInvoice,
        invoicePaymentIntentId: "pi_test_renewal",
        payloadHash: "b".repeat(64),
        receivedAt: 1_831_536_001_500,
        priceIds: config.priceIds,
      }),
    ).toMatchObject({
      kind: "invoice",
      invoiceStatus: "paid",
      subscriptionStatus: "active",
      accessStatus: "active",
      currency: "USD",
      totalMinor: 78_900,
      paidAt: 1_831_536_001_000,
      stripePaymentIntentId: "pi_test_renewal",
    });

    const failedSubscription = subscription({ status: "past_due" });
    const failedInvoice = invoice(
      "invoice.payment_failed",
      failedSubscription,
    );
    expect(
      buildStripeLifecycleProjection({
        event: lifecycleEvent(
          "invoice.payment_failed",
          failedInvoice,
        ),
        invoice: failedInvoice,
        payloadHash: "c".repeat(64),
        receivedAt: 1_831_536_001_500,
        priceIds: config.priceIds,
      }),
    ).toMatchObject({
      invoiceStatus: "open",
      subscriptionStatus: "past_due",
      accessStatus: "suspended",
      paidAt: null,
    });
  });

  it("rejects an unexpanded invoice subscription and a tampered recurring price", () => {
    const paidInvoice = invoice("invoice.paid");
    const unexpanded = {
      ...paidInvoice,
      parent: {
        ...paidInvoice.parent!,
        subscription_details: {
          ...paidInvoice.parent!.subscription_details!,
          subscription: "sub_test_team_yearly",
        },
      },
    } as Stripe.Invoice;
    expect(() =>
      buildStripeLifecycleProjection({
        event: lifecycleEvent("invoice.paid", paidInvoice),
        invoice: unexpanded,
        payloadHash: "d".repeat(64),
        receivedAt: 1_831_536_001_500,
        priceIds: config.priceIds,
      })).toThrow("must be expanded");

    const tampered = subscription({
      items: {
        ...subscription().items,
        data: [
          {
            ...subscription().items.data[0],
            price: {
              ...subscription().items.data[0].price,
              id: "price_Attacker",
            },
          },
        ],
      },
    });
    expect(() =>
      buildStripeLifecycleProjection({
        event: lifecycleEvent(
          "customer.subscription.updated",
          tampered,
        ),
        payloadHash: "e".repeat(64),
        receivedAt: 1_831_536_001_500,
        priceIds: config.priceIds,
      })).toThrow("allowlist validation");
  });
});
