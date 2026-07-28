import type Stripe from "stripe";
import {
  commercialPlans,
  type CommercialPlan,
} from "../../app/data/commercial";
import type { CommercialPlanId } from "./stripe-managed-payments";
import type { NormalizedProviderEvent } from "./webhooks";

export type LocalSubscriptionStatus =
  | "pending"
  | "active"
  | "past_due"
  | "paused"
  | "canceled"
  | "expired";

export type LocalAccessStatus =
  | "active"
  | "suspended"
  | "expired";

interface StripeLifecycleBase {
  providerEventId: string;
  providerEventType: string;
  providerOccurredAt: number;
  receivedAt: number;
  payloadHash: string;
  accountId: string;
  workspaceId: string;
  planId: Exclude<CommercialPlanId, `${string}-lifetime`>;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  subscriptionStatus: LocalSubscriptionStatus;
  accessStatus: LocalAccessStatus;
  currentPeriodStartsAt: number;
  currentPeriodEndsAt: number;
  cancelAtPeriodEnd: boolean;
  canceledAt: number | null;
}

export interface StripeSubscriptionLifecycleProjection
  extends StripeLifecycleBase {
  kind: "subscription";
}

export interface StripeInvoiceLifecycleProjection
  extends StripeLifecycleBase {
  kind: "invoice";
  stripeInvoiceId: string;
  stripePaymentIntentId: string | null;
  invoiceStatus: "open" | "paid";
  currency: "USD";
  totalMinor: number;
  issuedAt: number;
  paidAt: number | null;
}

export type StripeLifecycleProjection =
  | StripeSubscriptionLifecycleProjection
  | StripeInvoiceLifecycleProjection;

export interface StripeLifecycleInput {
  event: NormalizedProviderEvent<Stripe.Event>;
  payloadHash: string;
  receivedAt: number;
  priceIds: Readonly<Record<CommercialPlanId, string>>;
  invoice?: Stripe.Invoice;
  invoicePaymentIntentId?: string | null;
}

export interface StripeLifecycleStore {
  apply(
    projection: StripeLifecycleProjection,
  ): Promise<"applied" | "duplicate" | "ignored">;
}

const plansById = new Map<CommercialPlanId, CommercialPlan>(
  commercialPlans.map((plan) => [plan.id, plan]),
);

export function buildStripeLifecycleProjection(
  input: StripeLifecycleInput,
): StripeLifecycleProjection {
  if (input.event.aggregateType === "subscription") {
    const subscription = input.event.payload.data
      .object as Stripe.Subscription;
    if (
      input.event.aggregateId !== subscription.id
      || !input.event.eventType.startsWith("customer.subscription.")
    ) {
      throw new Error("Stripe subscription event identity is invalid");
    }
    return {
      kind: "subscription",
      ...buildSubscriptionState(
        subscription,
        input.event,
        input.payloadHash,
        input.receivedAt,
        input.priceIds,
      ),
    };
  }

  if (input.event.aggregateType !== "invoice" || !input.invoice) {
    throw new Error("Stripe lifecycle resource is unavailable");
  }
  const invoice = input.invoice;
  const invoicePaymentIntentId = optionalPaymentIntentId(
    input.invoicePaymentIntentId,
  );
  if (
    invoice.id !== input.event.aggregateId
    || (
      input.event.eventType !== "invoice.paid"
      && input.event.eventType !== "invoice.payment_failed"
    )
  ) {
    throw new Error("Stripe invoice event identity is invalid");
  }
  const subscription = expandedInvoiceSubscription(invoice);
  const subscriptionState = buildSubscriptionState(
    subscription,
    input.event,
    input.payloadHash,
    input.receivedAt,
    input.priceIds,
  );
  const paid = input.event.eventType === "invoice.paid";
  if (
    invoice.currency.toUpperCase() !== "USD"
    || !Number.isSafeInteger(invoice.total)
    || invoice.total < 0
    || !Number.isSafeInteger(invoice.created)
    || (
      paid
        ? invoice.status !== "paid"
        : invoice.status !== "open"
    )
    || (paid && subscriptionState.subscriptionStatus !== "active")
    || (paid && !invoicePaymentIntentId)
  ) {
    throw new Error("Stripe invoice state failed lifecycle validation");
  }

  const paidAt = paid
    ? unixSecondsOrFallback(
        invoice.status_transitions.paid_at,
        input.event.occurredAt,
      )
    : null;
  return {
    kind: "invoice",
    ...subscriptionState,
    subscriptionStatus: paid
      ? "active"
      : normalizeFailedInvoiceSubscriptionStatus(
          subscriptionState.subscriptionStatus,
        ),
    accessStatus: paid ? "active" : "suspended",
    stripeInvoiceId: invoice.id,
    stripePaymentIntentId: invoicePaymentIntentId,
    invoiceStatus: paid ? "paid" : "open",
    currency: "USD",
    totalMinor: invoice.total,
    issuedAt: unixSecondsOrFallback(
      invoice.effective_at,
      invoice.created * 1_000,
    ),
    paidAt,
  };
}

function optionalPaymentIntentId(
  value: string | null | undefined,
): string | null {
  if (value == null) {
    return null;
  }
  if (!/^pi_[A-Za-z0-9_]+$/.test(value)) {
    throw new Error("Stripe invoice PaymentIntent is invalid");
  }
  return value;
}

function buildSubscriptionState(
  subscription: Stripe.Subscription,
  event: NormalizedProviderEvent<Stripe.Event>,
  payloadHash: string,
  receivedAt: number,
  priceIds: Readonly<Record<CommercialPlanId, string>>,
): StripeLifecycleBase {
  const metadata = subscription.metadata ?? {};
  const planId = metadata.commercial_offer_ref as CommercialPlanId;
  const plan = plansById.get(planId);
  if (!plan || plan.billingInterval === "lifetime") {
    throw new Error("Stripe subscription has an unknown recurring offer");
  }
  const accountId = requireOpaqueMetadata(metadata.account_id, "account");
  const workspaceId = requireOpaqueMetadata(
    metadata.workspace_id,
    "workspace",
  );
  const customerId = getExpandableId(
    subscription.customer,
    "Stripe customer",
  );
  const item = requireSubscriptionItem(
    subscription,
    plan,
    priceIds[planId],
  );
  const startsAt = requireUnixSeconds(
    item.current_period_start,
    "subscription item current_period_start",
  );
  const endsAt = requireUnixSeconds(
    item.current_period_end,
    "subscription item current_period_end",
  );
  if (endsAt <= startsAt) {
    throw new Error("Stripe subscription period is invalid");
  }
  const subscriptionStatus = event.eventType === "customer.subscription.deleted"
    ? "canceled"
    : normalizeSubscriptionStatus(subscription.status);

  return {
    providerEventId: event.eventId,
    providerEventType: event.eventType,
    providerOccurredAt: event.occurredAt,
    receivedAt,
    payloadHash: requireSha256(payloadHash),
    accountId,
    workspaceId,
    planId: planId as StripeLifecycleBase["planId"],
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerId,
    subscriptionStatus,
    accessStatus: accessStatusForSubscription(subscriptionStatus),
    currentPeriodStartsAt: startsAt,
    currentPeriodEndsAt: endsAt,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    canceledAt: optionalUnixSeconds(subscription.canceled_at),
  };
}

function requireSubscriptionItem(
  subscription: Stripe.Subscription,
  plan: CommercialPlan,
  expectedPriceId: string,
): Stripe.SubscriptionItem {
  if (
    subscription.items.has_more
    || subscription.items.data.length !== 1
  ) {
    throw new Error("Stripe subscription items are invalid");
  }
  const item = subscription.items.data[0];
  const price = item.price;
  if (
    item.quantity !== 1
    || price.id !== expectedPriceId
    || price.currency.toUpperCase() !== "USD"
    || price.type !== "recurring"
    || price.unit_amount !== plan.priceUsd * 100
    || price.recurring?.interval !== plan.billingInterval
    || price.recurring.interval_count !== 1
  ) {
    throw new Error("Stripe subscription price failed allowlist validation");
  }
  return item;
}

function expandedInvoiceSubscription(
  invoice: Stripe.Invoice,
): Stripe.Subscription {
  const value = invoice.parent?.subscription_details?.subscription;
  if (!value || typeof value === "string") {
    throw new Error("Stripe invoice subscription must be expanded");
  }
  return value;
}

function normalizeSubscriptionStatus(
  status: Stripe.Subscription.Status,
): LocalSubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "paused":
      return "paused";
    case "canceled":
      return "canceled";
    case "incomplete_expired":
      return "expired";
    case "incomplete":
      return "pending";
  }
}

function normalizeFailedInvoiceSubscriptionStatus(
  status: LocalSubscriptionStatus,
): LocalSubscriptionStatus {
  return status === "canceled" || status === "expired"
    ? status
    : "past_due";
}

function accessStatusForSubscription(
  status: LocalSubscriptionStatus,
): LocalAccessStatus {
  if (status === "active") {
    return "active";
  }
  if (status === "canceled" || status === "expired") {
    return "expired";
  }
  return "suspended";
}

function requireOpaqueMetadata(
  value: string | undefined,
  label: string,
): string {
  if (!value || !/^[A-Za-z0-9][A-Za-z0-9._:-]{5,255}$/.test(value)) {
    throw new Error(`Stripe subscription ${label} metadata is invalid`);
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

function optionalUnixSeconds(value: number | null): number | null {
  return value === null ? null : requireUnixSeconds(value, "timestamp");
}

function unixSecondsOrFallback(
  value: number | null,
  fallbackMs: number,
): number {
  return value === null
    ? fallbackMs
    : requireUnixSeconds(value, "timestamp");
}

function requireSha256(value: string): string {
  if (!/^[a-f0-9]{64}$/.test(value)) {
    throw new Error("Stripe webhook payload hash is invalid");
  }
  return value;
}
