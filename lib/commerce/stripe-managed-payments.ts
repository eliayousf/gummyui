import "server-only";
import Stripe from "stripe";
import {
  commercialPlans,
  type CommercialPlanId,
} from "../../app/data/commercial";
import type { CheckoutRequest } from "./providers";
import type {
  NormalizedProviderEvent,
  WebhookSignatureAdapter,
  WebhookVerificationInput,
  WebhookVerificationResult,
} from "./webhooks";
import { ProviderUnavailableError } from "./providers";

export const STRIPE_MANAGED_PAYMENTS_API_VERSION =
  "2026-03-04.preview" as const;

const STRIPE_SERVER_API_KEY =
  /^(?:sk|rk)_(?:test|live)_[A-Za-z0-9][A-Za-z0-9_-]{5,}$/u;

export type { CommercialPlanId } from "../../app/data/commercial";

const priceEnvironmentKeys: Readonly<
  Record<CommercialPlanId, string>
> = {
  "individual-monthly": "STRIPE_PRICE_INDIVIDUAL_MONTHLY",
  "individual-yearly": "STRIPE_PRICE_INDIVIDUAL_YEARLY",
  "individual-lifetime": "STRIPE_PRICE_INDIVIDUAL_LIFETIME",
  "team-monthly": "STRIPE_PRICE_TEAM_MONTHLY",
  "team-yearly": "STRIPE_PRICE_TEAM_YEARLY",
  "team-lifetime": "STRIPE_PRICE_TEAM_LIFETIME",
  "organization-monthly": "STRIPE_PRICE_ORGANIZATION_MONTHLY",
  "organization-yearly": "STRIPE_PRICE_ORGANIZATION_YEARLY",
  "organization-lifetime": "STRIPE_PRICE_ORGANIZATION_LIFETIME",
};

const commercialPlanIds = new Set<string>(
  commercialPlans.map((plan) => plan.id),
);
const commercialPlansById = new Map(
  commercialPlans.map((plan) => [plan.id, plan]),
);

export interface StripeManagedPaymentsConfig {
  secretKey: string;
  applicationOrigin: string;
  priceIds: Readonly<Record<CommercialPlanId, string>>;
}

export interface StripeCheckoutWebhookConfig
  extends StripeManagedPaymentsConfig {
  endpointSecret: string;
}

export interface StripeHostedCheckout {
  checkoutRef: string;
  checkoutUrl: string;
}

export function isValidStripeServerApiKey(value: string): boolean {
  return STRIPE_SERVER_API_KEY.test(value);
}

interface StripeSessionCreator {
  create(
    params: Stripe.Checkout.SessionCreateParams,
    options?: Stripe.RequestOptions,
  ): Promise<Stripe.Checkout.Session>;
}

interface StripeSessionRetriever {
  retrieve(
    id: string,
    params?: Stripe.Checkout.SessionRetrieveParams,
    options?: Stripe.RequestOptions,
  ): Promise<Stripe.Checkout.Session>;
}

interface StripeInvoiceRetriever {
  retrieve(
    id: string,
    params?: Stripe.InvoiceRetrieveParams,
    options?: Stripe.RequestOptions,
  ): Promise<Stripe.Invoice>;
}

interface StripeInvoicePaymentLister {
  list(
    params?: Stripe.InvoicePaymentListParams,
    options?: Stripe.RequestOptions,
  ): Stripe.ApiListPromise<Stripe.InvoicePayment>;
}

interface StripeRefundRetriever {
  retrieve(
    id: string,
    params?: Stripe.RefundRetrieveParams,
    options?: Stripe.RequestOptions,
  ): Promise<Stripe.Refund>;
}

interface StripeDisputeRetriever {
  retrieve(
    id: string,
    params?: Stripe.DisputeRetrieveParams,
    options?: Stripe.RequestOptions,
  ): Promise<Stripe.Dispute>;
}

interface StripeWebhookVerifier {
  constructEventAsync(
    payload: string | Uint8Array,
    header: string | string[] | Uint8Array,
    secret: string,
    tolerance?: number,
    cryptoProvider?: Stripe.CryptoProvider,
    receivedAt?: number,
  ): Promise<Stripe.Event>;
}

export function readStripeManagedPaymentsConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): StripeManagedPaymentsConfig | null {
  const secretKey = environment.STRIPE_RESTRICTED_KEY?.trim()
    || environment.STRIPE_SECRET_KEY?.trim();
  const applicationOrigin = environment.GUMMYUI_ORIGIN?.trim();
  if (!secretKey || !applicationOrigin) {
    return null;
  }
  if (!isValidStripeServerApiKey(secretKey)) {
    throw new Error("Invalid Stripe server-key format");
  }

  const priceIds = Object.fromEntries(
    Object.entries(priceEnvironmentKeys).map(([planId, environmentKey]) => {
      const priceId = environment[environmentKey]?.trim();
      if (!priceId) {
        throw new ProviderUnavailableError("billing");
      }
      if (!/^price_[A-Za-z0-9]+$/.test(priceId)) {
        throw new Error(`Invalid Stripe price for ${planId}`);
      }
      return [planId, priceId];
    }),
  ) as Record<CommercialPlanId, string>;

  return {
    secretKey,
    applicationOrigin: normalizeApplicationOrigin(applicationOrigin),
    priceIds,
  };
}

export function createStripeManagedPaymentsService(
  config: StripeManagedPaymentsConfig,
): StripeManagedPaymentsService {
  const stripe = new Stripe(config.secretKey, {
    maxNetworkRetries: 2,
    timeout: 20_000,
    typescript: true,
  });
  return new StripeManagedPaymentsService(stripe.checkout.sessions, config);
}

export function readStripeCheckoutWebhookConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): StripeCheckoutWebhookConfig | null {
  const base = readStripeManagedPaymentsConfig(environment);
  const endpointSecret = environment.STRIPE_WEBHOOK_SECRET?.trim();
  if (!base || !endpointSecret) {
    return null;
  }
  if (!endpointSecret.startsWith("whsec_")) {
    throw new Error("Invalid Stripe webhook-secret format");
  }
  return { ...base, endpointSecret };
}

export function createStripeCheckoutWebhookRuntime(
  config: StripeCheckoutWebhookConfig,
): {
  adapter: StripeCheckoutWebhookAdapter;
  sessions: StripeCheckoutSessionRetriever;
  invoices: StripeInvoiceLifecycleRetriever;
  invoicePayments: StripeInvoicePaymentIntentRetriever;
  adjustments: StripeAdjustmentRetriever;
} {
  const stripe = new Stripe(config.secretKey, {
    maxNetworkRetries: 2,
    timeout: 20_000,
    typescript: true,
  });
  return {
    adapter: new StripeCheckoutWebhookAdapter(
      stripe.webhooks,
      config.endpointSecret,
    ),
    sessions: new StripeCheckoutSessionRetriever(
      stripe.checkout.sessions,
    ),
    invoices: new StripeInvoiceLifecycleRetriever(stripe.invoices),
    invoicePayments: new StripeInvoicePaymentIntentRetriever(
      stripe.invoicePayments,
    ),
    adjustments: new StripeAdjustmentRetriever(
      stripe.refunds,
      stripe.disputes,
    ),
  };
}

export class StripeManagedPaymentsService {
  constructor(
    private readonly sessions: StripeSessionCreator,
    private readonly config: StripeManagedPaymentsConfig,
  ) {}

  async createHostedCheckout(
    request: CheckoutRequest,
  ): Promise<StripeHostedCheckout> {
    assertCheckoutRequest(request);
    const planId = request.commercialOfferRef as CommercialPlanId;
    const plan = commercialPlansById.get(planId);
    if (!plan) {
      throw new Error("Unknown commercial offer");
    }
    const metadata = {
      account_id: request.accountId,
      workspace_id: request.workspaceId,
      commercial_offer_ref: planId,
      consent_policy_version: request.consent!.policyVersion,
      consent_captured_at: String(request.consent!.capturedAt),
      immediate_supply_requested: "true",
      cancellation_loss_acknowledged: "true",
    };

    const checkoutParams: Stripe.Checkout.SessionCreateParams = {
      mode: plan.checkoutMode,
      line_items: [
        {
          price: this.config.priceIds[planId],
          quantity: 1,
        },
      ],
      managed_payments: { enabled: true },
      billing_address_collection: "auto",
      consent_collection: { terms_of_service: "required" },
      client_reference_id: request.workspaceId,
      metadata,
      success_url: buildReturnUrl(
        this.config.applicationOrigin,
        request.returnPath,
        "success",
      ),
      cancel_url: buildReturnUrl(
        this.config.applicationOrigin,
        `/checkout?plan=${encodeURIComponent(planId)}`,
        "cancelled",
      ),
      submit_type: plan.checkoutMode === "subscription" ? "subscribe" : "pay",
    };
    if (plan.checkoutMode === "subscription") {
      checkoutParams.subscription_data = { metadata };
    } else {
      checkoutParams.customer_creation = "always";
      checkoutParams.payment_intent_data = { metadata };
    }

    const session = await this.sessions.create(
      checkoutParams,
      {
        apiVersion: STRIPE_MANAGED_PAYMENTS_API_VERSION,
        idempotencyKey: request.idempotencyKey,
      },
    );

    if (!session.id || !session.url) {
      throw new Error("Stripe did not return a hosted Checkout Session");
    }
    const checkoutUrl = new URL(session.url);
    if (
      checkoutUrl.protocol !== "https:"
      || (
        checkoutUrl.hostname !== "stripe.com"
        && !checkoutUrl.hostname.endsWith(".stripe.com")
      )
    ) {
      throw new Error("Stripe returned an unexpected checkout URL");
    }

    return {
      checkoutRef: session.id,
      checkoutUrl: checkoutUrl.toString(),
    };
  }
}

export class StripeCheckoutSessionRetriever {
  constructor(private readonly sessions: StripeSessionRetriever) {}

  async retrieve(checkoutSessionId: string): Promise<Stripe.Checkout.Session> {
    if (!/^cs_(?:test_|live_)?[A-Za-z0-9_]+$/.test(checkoutSessionId)) {
      throw new Error("Invalid Stripe Checkout Session identifier");
    }
    return this.sessions.retrieve(
      checkoutSessionId,
      { expand: ["line_items.data.price", "subscription"] },
      { apiVersion: STRIPE_MANAGED_PAYMENTS_API_VERSION },
    );
  }
}

export class StripeInvoiceLifecycleRetriever {
  constructor(private readonly invoices: StripeInvoiceRetriever) {}

  async retrieve(invoiceId: string): Promise<Stripe.Invoice> {
    if (!/^in_[A-Za-z0-9_]+$/.test(invoiceId)) {
      throw new Error("Invalid Stripe Invoice identifier");
    }
    return this.invoices.retrieve(
      invoiceId,
      {
        expand: [
          "parent.subscription_details.subscription",
          "parent.subscription_details.subscription.items.data.price",
        ],
      },
      { apiVersion: STRIPE_MANAGED_PAYMENTS_API_VERSION },
    );
  }
}

export class StripeInvoicePaymentIntentRetriever {
  constructor(private readonly invoicePayments: StripeInvoicePaymentLister) {}

  async retrieve(invoiceId: string): Promise<string | null> {
    if (!/^in_[A-Za-z0-9_]+$/.test(invoiceId)) {
      throw new Error("Invalid Stripe Invoice identifier");
    }
    const payments = await this.invoicePayments.list(
      {
        invoice: invoiceId,
        payment: { type: "payment_intent" },
        limit: 2,
      },
      { apiVersion: STRIPE_MANAGED_PAYMENTS_API_VERSION },
    );
    if (payments.has_more || payments.data.length > 1) {
      throw new Error("Stripe Invoice has ambiguous PaymentIntents");
    }
    const paymentIntent = payments.data[0]?.payment.payment_intent;
    if (!paymentIntent) {
      return null;
    }
    const id = typeof paymentIntent === "string"
      ? paymentIntent
      : paymentIntent.id;
    if (!/^pi_[A-Za-z0-9_]+$/.test(id)) {
      throw new Error("Stripe Invoice PaymentIntent is invalid");
    }
    return id;
  }
}

export class StripeAdjustmentRetriever {
  constructor(
    private readonly refunds: StripeRefundRetriever,
    private readonly disputes: StripeDisputeRetriever,
  ) {}

  async retrieve(
    eventType: string,
    adjustmentId: string,
  ): Promise<Stripe.Refund | Stripe.Dispute> {
    if (eventType.startsWith("refund.")) {
      if (!/^re_[A-Za-z0-9_]+$/.test(adjustmentId)) {
        throw new Error("Invalid Stripe Refund identifier");
      }
      return this.refunds.retrieve(
        adjustmentId,
        { expand: ["charge", "payment_intent"] },
        { apiVersion: STRIPE_MANAGED_PAYMENTS_API_VERSION },
      );
    }
    if (eventType.startsWith("charge.dispute.")) {
      if (!/^dp_[A-Za-z0-9_]+$/.test(adjustmentId)) {
        throw new Error("Invalid Stripe Dispute identifier");
      }
      return this.disputes.retrieve(
        adjustmentId,
        { expand: ["charge", "payment_intent"] },
        { apiVersion: STRIPE_MANAGED_PAYMENTS_API_VERSION },
      );
    }
    throw new Error("Unsupported Stripe adjustment event");
  }
}

export class StripeCheckoutWebhookAdapter
  implements WebhookSignatureAdapter<Stripe.Event>
{
  constructor(
    private readonly webhooks: StripeWebhookVerifier,
    private readonly endpointSecret: string,
    private readonly toleranceSeconds = 300,
  ) {
    if (!endpointSecret.startsWith("whsec_")) {
      throw new Error("Invalid Stripe webhook-secret format");
    }
  }

  async verify(
    input: WebhookVerificationInput,
  ): Promise<WebhookVerificationResult<Stripe.Event>> {
    const signature = input.headers.get("stripe-signature");
    if (!signature) {
      return { verified: false, reason: "missing_signature" };
    }

    let event: Stripe.Event;
    try {
      event = await this.webhooks.constructEventAsync(
        input.rawBody,
        signature,
        this.endpointSecret,
        this.toleranceSeconds,
        undefined,
        Math.floor(input.receivedAt / 1_000),
      );
    } catch {
      return { verified: false, reason: "invalid_signature" };
    }

    const normalized = normalizeStripeManagedPaymentsEvent(event);
    if (!normalized) {
      return { verified: false, reason: "invalid_payload" };
    }

    return {
      verified: true,
      event: normalized,
      payloadHash: await sha256Hex(input.rawBody),
    };
  }
}

export function normalizeStripeCheckoutEvent(
  event: Stripe.Event,
): NormalizedProviderEvent<Stripe.Event> | null {
  return normalizeStripeManagedPaymentsEvent(event);
}

export function normalizeStripeManagedPaymentsEvent(
  event: Stripe.Event,
): NormalizedProviderEvent<Stripe.Event> | null {
  if (!event.id || !Number.isSafeInteger(event.created)) {
    return null;
  }

  const value = event.data.object as {
    id?: unknown;
    object?: unknown;
  };
  if (typeof value.id !== "string") {
    return null;
  }

  let aggregateType: "purchase" | "subscription" | "invoice" | "adjustment";
  if (
    event.type === "checkout.session.completed"
    || event.type === "checkout.session.async_payment_succeeded"
    || event.type === "checkout.session.async_payment_failed"
  ) {
    if (value.object !== "checkout.session") {
      return null;
    }
    aggregateType = "purchase";
  } else if (
    event.type === "customer.subscription.created"
    || event.type === "customer.subscription.updated"
    || event.type === "customer.subscription.deleted"
    || event.type === "customer.subscription.paused"
    || event.type === "customer.subscription.resumed"
  ) {
    if (value.object !== "subscription") {
      return null;
    }
    aggregateType = "subscription";
  } else if (
    event.type === "invoice.paid"
    || event.type === "invoice.payment_failed"
  ) {
    if (value.object !== "invoice") {
      return null;
    }
    aggregateType = "invoice";
  } else if (
    event.type === "refund.created"
    || event.type === "refund.updated"
    || event.type === "refund.failed"
  ) {
    if (value.object !== "refund") {
      return null;
    }
    aggregateType = "adjustment";
  } else if (
    event.type === "charge.dispute.created"
    || event.type === "charge.dispute.updated"
    || event.type === "charge.dispute.closed"
  ) {
    if (value.object !== "dispute") {
      return null;
    }
    aggregateType = "adjustment";
  } else {
    return null;
  }

  return {
    providerKind: "stripe",
    eventId: event.id,
    eventType: event.type,
    aggregateType,
    aggregateId: value.id,
    occurredAt: event.created * 1_000,
    payload: event,
  };
}

function assertCheckoutRequest(request: CheckoutRequest): void {
  if (!commercialPlanIds.has(request.commercialOfferRef)) {
    throw new Error("Unknown commercial offer");
  }
  if (
    !request.consent
    || request.consent.immediateSupplyRequested !== true
    || request.consent.cancellationLossAcknowledged !== true
    || request.consent.policyVersion !== "2026-07-27"
    || !Number.isSafeInteger(request.consent.capturedAt)
  ) {
    throw new Error("Immediate digital-supply consent is required");
  }
  if (
    !/^[A-Za-z0-9][A-Za-z0-9._:-]{15,255}$/.test(request.idempotencyKey)
  ) {
    throw new Error("Invalid checkout idempotency key");
  }
  assertSafeReturnPath(request.returnPath);
}

function normalizeApplicationOrigin(value: string): string {
  const url = new URL(value);
  const localDevelopment =
    url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (
    (url.protocol !== "https:" && !(localDevelopment && url.protocol === "http:"))
    || url.username
    || url.password
    || url.pathname !== "/"
    || url.search
    || url.hash
  ) {
    throw new Error("Invalid Gummy UI application origin");
  }
  return url.origin;
}

function assertSafeReturnPath(value: string): void {
  if (
    !value.startsWith("/")
    || value.startsWith("//")
    || value.includes("\\")
    || /[\u0000-\u001f]/.test(value)
  ) {
    throw new Error("Invalid checkout return path");
  }
}

function buildReturnUrl(
  origin: string,
  path: string,
  status: "success" | "cancelled",
): string {
  assertSafeReturnPath(path);
  const url = new URL(path, origin);
  url.searchParams.set("checkout", status);
  if (status === "success") {
    url.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");
  }
  return url.toString().replace("%7BCHECKOUT_SESSION_ID%7D", "{CHECKOUT_SESSION_ID}");
}

async function sha256Hex(value: Uint8Array): Promise<string> {
  const copy = new Uint8Array(value.byteLength);
  copy.set(value);
  const digest = await crypto.subtle.digest("SHA-256", copy.buffer);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")).join("");
}
