import type Stripe from "stripe";
import {
  commercialPlans,
  type CommercialBillingInterval,
  type CommercialPlan,
} from "../../app/data/commercial";
import type { CommercialPlanId } from "./stripe-managed-payments";
import type { NormalizedProviderEvent } from "./webhooks";

export const paidProductRefs = {
  blocks: "gummy-ui-pro-blocks",
  templates: "gummy-ui-pro-templates",
  designKit: "gummy-ui-pro-design-kit",
} as const;

export type PaidProductRef =
  (typeof paidProductRefs)[keyof typeof paidProductRefs];

export type StripePurchaseStatus = "pending" | "completed" | "void";

export interface StripeFulfillmentProjection {
  providerEventId: string;
  providerEventType: string;
  providerOccurredAt: number;
  receivedAt: number;
  payloadHash: string;
  checkoutSessionId: string;
  stripeCustomerId: string;
  stripePaymentIntentId: string | null;
  stripeSubscriptionId: string | null;
  accountId: string;
  workspaceId: string;
  planId: CommercialPlanId;
  billingInterval: CommercialBillingInterval;
  purchaseStatus: StripePurchaseStatus;
  currency: "USD";
  amountMinor: number;
  purchasedAt: number;
  consentCapturedAt: number;
  consentPolicyVersion: "2026-07-27";
  seatLimit: 1 | 5 | null;
  entitlementScope: "account" | "workspace";
  subscriptionCurrentPeriodStartsAt: number | null;
  subscriptionCurrentPeriodEndsAt: number | null;
  subscriptionCancelAtPeriodEnd: boolean;
  updatesUntil: number | null;
  productRefs: readonly PaidProductRef[];
}

export interface StripeFulfillmentInput {
  event: NormalizedProviderEvent<Stripe.Event>;
  checkout: Stripe.Checkout.Session;
  payloadHash: string;
  receivedAt: number;
  priceIds: Readonly<Record<CommercialPlanId, string>>;
}

export interface StripeFulfillmentStore {
  apply(
    projection: StripeFulfillmentProjection,
  ): Promise<"applied" | "duplicate">;
}

const plansById = new Map<CommercialPlanId, CommercialPlan>(
  commercialPlans.map((plan) => [plan.id, plan]),
);

export function buildStripeFulfillmentProjection(
  input: StripeFulfillmentInput,
): StripeFulfillmentProjection {
  const checkout = input.checkout;
  const metadata = checkout.metadata ?? {};
  const planId = metadata.commercial_offer_ref as CommercialPlanId;
  const plan = plansById.get(planId);
  if (!plan) {
    throw new Error("Stripe Checkout Session has an unknown offer");
  }

  const accountId = requireOpaqueMetadata(metadata.account_id, "account");
  const workspaceId = requireOpaqueMetadata(
    metadata.workspace_id,
    "workspace",
  );
  const customerId = getExpandableId(checkout.customer, "Stripe customer");
  const paymentIntentId = checkout.payment_intent
    ? getExpandableId(checkout.payment_intent, "Stripe PaymentIntent")
    : null;
  const subscription = plan.checkoutMode === "subscription"
    ? requireExpandedSubscription(
        checkout.subscription,
        input.priceIds[planId],
      )
    : null;
  const purchasedAt = requireUnixSeconds(checkout.created, "checkout.created");
  const consentCapturedAt = Number(metadata.consent_captured_at);

  if (
    checkout.id !== input.event.aggregateId
    || checkout.client_reference_id !== workspaceId
    || checkout.mode !== plan.checkoutMode
    || checkout.status !== "complete"
    || checkout.currency?.toUpperCase() !== "USD"
    || metadata.immediate_supply_requested !== "true"
    || metadata.cancellation_loss_acknowledged !== "true"
    || metadata.consent_policy_version !== "2026-07-27"
    || checkout.consent?.terms_of_service !== "accepted"
  ) {
    throw new Error("Stripe Checkout Session failed fulfillment validation");
  }
  if (
    !Number.isSafeInteger(consentCapturedAt)
    || consentCapturedAt < purchasedAt - 24 * 60 * 60 * 1_000
    || consentCapturedAt > purchasedAt + 5 * 60 * 1_000
  ) {
    throw new Error("Stripe Checkout consent timestamp is invalid");
  }

  const expectedAmountMinor = plan.priceUsd * 100;
  const lineItems = checkout.line_items;
  const lineItem = lineItems?.data[0];
  const price = lineItem?.price;
  if (
    !lineItems
    || lineItems.has_more
    || lineItems.data.length !== 1
    || lineItem?.quantity !== 1
    || lineItem.amount_subtotal !== expectedAmountMinor
    || !stripePriceMatchesPlan(
      price,
      input.priceIds[planId],
      plan,
      expectedAmountMinor,
    )
    || checkout.amount_subtotal !== expectedAmountMinor
    || !Number.isSafeInteger(checkout.amount_total)
    || checkout.amount_total! < expectedAmountMinor
  ) {
    throw new Error("Stripe Checkout line item failed allowlist validation");
  }

  return {
    providerEventId: input.event.eventId,
    providerEventType: input.event.eventType,
    providerOccurredAt: input.event.occurredAt,
    receivedAt: input.receivedAt,
    payloadHash: requireSha256(input.payloadHash),
    checkoutSessionId: checkout.id,
    stripeCustomerId: customerId,
    stripePaymentIntentId: paymentIntentId,
    stripeSubscriptionId: subscription?.id ?? null,
    accountId,
    workspaceId,
    planId,
    billingInterval: plan.billingInterval,
    purchaseStatus: resolvePurchaseStatus(
      input.event.eventType,
      checkout.payment_status,
    ),
    currency: "USD",
    amountMinor: checkout.amount_total!,
    purchasedAt,
    consentCapturedAt,
    consentPolicyVersion: "2026-07-27",
    seatLimit: plan.seats,
    entitlementScope: plan.seats === 1 ? "account" : "workspace",
    subscriptionCurrentPeriodStartsAt:
      subscription?.currentPeriodStartsAt ?? null,
    subscriptionCurrentPeriodEndsAt:
      subscription?.currentPeriodEndsAt ?? null,
    subscriptionCancelAtPeriodEnd:
      subscription?.cancelAtPeriodEnd ?? false,
    updatesUntil: subscription?.currentPeriodEndsAt ?? null,
    productRefs: plan.includesTemplatesAndDesignKit
      ? [
          paidProductRefs.blocks,
          paidProductRefs.templates,
          paidProductRefs.designKit,
        ]
      : [paidProductRefs.blocks],
  };
}

function stripePriceMatchesPlan(
  value: string | Stripe.Price | null | undefined,
  expectedPriceId: string,
  plan: CommercialPlan,
  expectedAmountMinor: number,
): boolean {
  if (!value || typeof value === "string") {
    return false;
  }
  if (
    value.id !== expectedPriceId
    || value.currency.toUpperCase() !== "USD"
    || value.unit_amount !== expectedAmountMinor
  ) {
    return false;
  }
  if (plan.billingInterval === "lifetime") {
    return value.type === "one_time" && value.recurring === null;
  }
  return value.type === "recurring"
    && value.recurring?.interval === plan.billingInterval
    && value.recurring.interval_count === 1;
}

function requireExpandedSubscription(
  value: string | Stripe.Subscription | null,
  expectedPriceId: string,
): {
  id: string;
  currentPeriodStartsAt: number;
  currentPeriodEndsAt: number;
  cancelAtPeriodEnd: boolean;
} {
  if (!value || typeof value === "string") {
    throw new Error("Stripe subscription must be expanded");
  }
  if (value.status !== "active" || value.items.has_more) {
    throw new Error("Stripe subscription is not active");
  }
  const matchingItems = value.items.data.filter((item) => {
    const priceId = typeof item.price === "string"
      ? item.price
      : item.price.id;
    return priceId === expectedPriceId;
  });
  if (value.items.data.length !== 1 || matchingItems.length !== 1) {
    throw new Error("Stripe subscription item failed allowlist validation");
  }
  const item = matchingItems[0];
  const currentPeriodStartsAt = requireUnixSeconds(
    item.current_period_start,
    "subscription item current_period_start",
  );
  const currentPeriodEndsAt = requireUnixSeconds(
    item.current_period_end,
    "subscription item current_period_end",
  );
  if (currentPeriodEndsAt <= currentPeriodStartsAt) {
    throw new Error("Stripe subscription period is invalid");
  }
  return {
    id: getExpandableId(value, "Stripe subscription"),
    currentPeriodStartsAt,
    currentPeriodEndsAt,
    cancelAtPeriodEnd: value.cancel_at_period_end,
  };
}

function resolvePurchaseStatus(
  eventType: string,
  paymentStatus: Stripe.Checkout.Session.PaymentStatus,
): StripePurchaseStatus {
  if (paymentStatus === "paid") {
    return "completed";
  }
  if (eventType === "checkout.session.async_payment_failed") {
    return "void";
  }
  return "pending";
}

function requireOpaqueMetadata(
  value: string | undefined,
  label: string,
): string {
  if (!value || !/^[A-Za-z0-9][A-Za-z0-9._:-]{5,255}$/.test(value)) {
    throw new Error(`Stripe Checkout ${label} metadata is invalid`);
  }
  return value;
}

function getExpandableId(
  value: string | { id: string } | null,
  label: string,
): string {
  const id = typeof value === "string" ? value : value?.id;
  if (!id || !/^[A-Za-z0-9][A-Za-z0-9_:-]{5,255}$/.test(id)) {
    throw new Error(`${label} is invalid`);
  }
  return id;
}

function requireUnixSeconds(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${label} is invalid`);
  }
  return value * 1_000;
}

function requireSha256(value: string): string {
  if (!/^[a-f0-9]{64}$/.test(value)) {
    throw new Error("Stripe webhook payload hash is invalid");
  }
  return value;
}
