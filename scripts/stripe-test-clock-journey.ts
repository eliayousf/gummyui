import {
  chmod,
  lstat,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import {
  projectSandboxEvent,
  readStripeSandboxJourneyConfig,
  StripeSandboxJourneyError,
  type StripeSandboxJourneyConfig,
} from "./stripe-sandbox-journey";
import { STRIPE_MANAGED_PAYMENTS_API_VERSION } from
  "../lib/commerce/stripe-managed-payments";

const STATE_PATH = "work/stripe-sandbox/test-clock.json";
const CONFIRMATION = "RUN_GUMMYUI_STRIPE_SANDBOX_JOURNEY";
const WAIT_TIMEOUT_MS = 120_000;
const POLL_INTERVAL_MS = 1_000;

export type TestClockPhase =
  | "preparing"
  | "clock-created"
  | "customer-created"
  | "ready"
  | "checkout-projected"
  | "renewal-cycle-planned"
  | "renewal-invoice-observed"
  | "renewal-invoice-finalized"
  | "renewal-projected"
  | "failure-payment-disabled"
  | "failure-cycle-planned"
  | "failure-invoice-observed"
  | "failure-invoice-finalized"
  | "failure-projected"
  | "cancellation-requested"
  | "canceled-projected"
  | "cleanup-requested";

export interface TestClockState {
  schemaVersion: 2;
  phase: TestClockPhase;
  runId: string;
  createdAt: number;
  accountId: string;
  workspaceId: string;
  clockId?: string;
  customerId?: string;
  sessionId?: string;
  checkoutUrl?: string;
  subscriptionId?: string;
  initialInvoiceId?: string;
  renewalInvoiceId?: string;
  failedInvoiceId?: string;
  renewalCycleTarget?: number;
  renewalFinalizeTarget?: number;
  failureCycleTarget?: number;
  failureFinalizeTarget?: number;
}

interface TestClockConfig extends StripeSandboxJourneyConfig {
  restoreSecret: string;
}

function idempotencyKey(runId: string, step: string): string {
  return `gummyui:${runId}:${step}`;
}

function testClockIdentity(runId: string): {
  accountId: string;
  workspaceId: string;
} {
  const suffix = runId.slice("gummyui-clock-".length, -8);
  return {
    accountId: `account:sandbox-test-clock-${suffix}`,
    workspaceId: `workspace:sandbox-test-clock-${suffix}`,
  };
}

async function main(): Promise<void> {
  const [operation, execute] = process.argv.slice(2);
  if (
    (operation !== "prepare" && operation !== "resume")
    || (execute !== undefined && execute !== "--execute")
  ) {
    throw new StripeSandboxJourneyError("sandbox_test_clock_usage_invalid");
  }
  if (execute !== "--execute") {
    process.stdout.write(`${JSON.stringify({
      mode: "dry-run",
      operation,
      sandboxOnly: true,
      externalMutation: false,
      continuationState: STATE_PATH,
    })}\n`);
    return;
  }
  const config = readConfig(process.env);
  if (operation === "prepare") {
    await prepare(config);
  } else {
    await resume(config);
  }
}

async function prepare(config: TestClockConfig): Promise<void> {
  const stripe = stripeClient(config.operatorKey);
  const statePath = safeStatePath();
  let state = await readStateIfPresent(statePath);
  if (!state) {
    const runId =
      `gummyui-clock-${crypto.randomUUID().replaceAll("-", "")}`;
    const identity = testClockIdentity(runId);
    state = {
      schemaVersion: 2,
      phase: "preparing",
      runId,
      createdAt: Date.now(),
      ...identity,
    };
    await createState(statePath, state);
  }
  assertTestClockState(state);

  const price = await stripe.prices.retrieve(
    config.priceIds["individual-monthly"],
  );
  if (
    price.livemode
    || !price.active
    || price.currency.toLowerCase() !== "usd"
    || price.unit_amount !== 4_900
    || price.type !== "recurring"
    || price.recurring?.interval !== "month"
    || price.recurring.interval_count !== 1
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_test_clock_price_invalid",
    );
  }

  if (!state.clockId) {
    const clock = await stripe.testHelpers.testClocks.create({
      frozen_time: Math.floor(state.createdAt / 1_000),
      name: `Gummy UI ${state.runId}`,
    }, {
      idempotencyKey: idempotencyKey(state.runId, "clock-create"),
    });
    if (clock.livemode || clock.status !== "ready") {
      throw new StripeSandboxJourneyError(
        "sandbox_test_clock_invalid",
      );
    }
    state = { ...state, phase: "clock-created", clockId: clock.id };
    await replaceState(statePath, state);
  }

  if (!state.customerId) {
    const customer = await stripe.customers.create({
      test_clock: state.clockId,
      email: `gummyui+location_US-${state.runId}@example.com`,
      metadata: {
        gummyui_sandbox_run_id: state.runId,
      },
    }, {
      idempotencyKey: idempotencyKey(state.runId, "customer-create"),
    });
    if (customer.livemode || expandableId(customer.test_clock) !== state.clockId) {
      throw new StripeSandboxJourneyError(
        "sandbox_test_clock_customer_invalid",
      );
    }
    state = {
      ...state,
      phase: "customer-created",
      customerId: customer.id,
    };
    await replaceState(statePath, state);
  }

  if (!state.sessionId) {
    const metadata = {
      account_id: state.accountId,
      workspace_id: state.workspaceId,
      commercial_offer_ref: "individual-monthly",
      consent_policy_version: "2026-07-27",
      consent_captured_at: String(state.createdAt),
      immediate_supply_requested: "true",
      cancellation_loss_acknowledged: "true",
      gummyui_sandbox_run_id: state.runId,
    };
    const session = await stripe.checkout.sessions.create({
      customer: state.customerId,
      mode: "subscription",
      line_items: [{
        price: config.priceIds["individual-monthly"],
        quantity: 1,
      }],
      managed_payments: { enabled: true },
      billing_address_collection: "auto",
      consent_collection: { terms_of_service: "required" },
      client_reference_id: state.workspaceId,
      metadata,
      subscription_data: { metadata },
      success_url:
        `${config.applicationOrigin}/account/purchases`
        + "?checkout=success&session_id={CHECKOUT_SESSION_ID}",
      cancel_url:
        `${config.applicationOrigin}/checkout?plan=individual-monthly`,
      submit_type: "subscribe",
    }, {
      apiVersion: STRIPE_MANAGED_PAYMENTS_API_VERSION,
      idempotencyKey: idempotencyKey(state.runId, "checkout-create"),
    });
    if (
      session.livemode
      || session.status !== "open"
      || !session.url
      || !isStripeCheckoutUrl(session.url)
    ) {
      throw new StripeSandboxJourneyError(
        "sandbox_test_clock_checkout_invalid",
      );
    }
    state = {
      ...state,
      phase: "ready",
      sessionId: session.id,
      checkoutUrl: session.url,
    };
    await replaceState(statePath, state);
  }

  process.stdout.write(`${JSON.stringify({
    mode: "executed",
    operation: "prepare",
    sandboxOnly: true,
    testClockCreated: true,
    checkoutCreated: true,
    continuationState: relative(process.cwd(), statePath),
  })}\n`);
}

async function resume(config: TestClockConfig): Promise<void> {
  const stripe = stripeClient(config.operatorKey);
  const statePath = safeStatePath();
  let state = await readState(statePath);
  assertTestClockState(state);
  if (
    !state.clockId
    || !state.customerId
    || !state.sessionId
    || !state.checkoutUrl
    || state.phase === "preparing"
    || state.phase === "clock-created"
    || state.phase === "customer-created"
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_test_clock_state_invalid",
    );
  }
  const clockId = state.clockId;
  const customerId = state.customerId;
  const sessionId = state.sessionId;
  const convex = new ConvexHttpClient(config.convexTargetUrl, {
    logger: false,
  });
  if (state.phase === "cleanup-requested") {
    await finishTestClockCleanup(stripe, statePath, state);
    writeCompletedEvidence();
    return;
  }

  const checkout = await stripe.checkout.sessions.retrieve(
    sessionId,
    {
      expand: [
        "line_items.data.price",
        "subscription",
      ],
    },
    { apiVersion: STRIPE_MANAGED_PAYMENTS_API_VERSION },
  );
  const subscription = expandableObject<Stripe.Subscription>(
    checkout.subscription,
  );
  if (
    checkout.livemode
    || checkout.status !== "complete"
    || checkout.payment_status !== "paid"
    || expandableId(checkout.customer) !== customerId
    || checkout.metadata?.account_id !== state.accountId
    || checkout.metadata?.workspace_id !== state.workspaceId
    || checkout.metadata?.commercial_offer_ref !== "individual-monthly"
    || checkout.line_items?.data.length !== 1
    || checkout.line_items.data[0].price?.id
      !== config.priceIds["individual-monthly"]
    || !subscription
    || subscription.livemode
    || !testClockSubscriptionStatusAllowed(
      state.phase,
      subscription.status,
    )
    || expandableId(subscription.customer) !== customerId
    || expandableId(subscription.test_clock) !== clockId
    || subscription.metadata?.account_id !== state.accountId
    || subscription.metadata?.workspace_id !== state.workspaceId
    || subscription.metadata?.commercial_offer_ref !== "individual-monthly"
    || subscription.items.data.length !== 1
    || subscription.items.data[0]?.quantity !== 1
    || subscription.items.data[0]?.price.id
      !== config.priceIds["individual-monthly"]
    || (
      state.subscriptionId != null
      && state.subscriptionId !== subscription.id
    )
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_test_clock_checkout_incomplete",
    );
  }
  const initialInvoiceId = state.initialInvoiceId
    ?? (
      state.phase === "ready"
        ? expandableId(subscription.latest_invoice)
        : null
    );
  if (!initialInvoiceId) {
    throw new StripeSandboxJourneyError(
      "sandbox_test_clock_initial_invoice_unavailable",
    );
  }

  if (state.phase === "ready") {
    const checkoutEvent = await waitForEvent(
      stripe,
      ["checkout.session.completed"],
      checkout.id,
      Math.floor(state.createdAt / 1_000) - 5,
    );
    await projectTestClockEvent(config, checkoutEvent);
    await attest(
      convex,
      config,
      state,
      subscription.id,
      "checkout-active",
    );
    state = {
      ...state,
      phase: "checkout-projected",
      subscriptionId: subscription.id,
      initialInvoiceId,
    };
    await replaceState(statePath, state);
  }

  if (state.phase === "checkout-projected") {
    const current = await stripe.subscriptions.retrieve(subscription.id);
    if (
      current.status !== "active"
      || expandableId(current.latest_invoice) !== initialInvoiceId
    ) {
      throw new StripeSandboxJourneyError(
        "sandbox_test_clock_renewal_preflight_invalid",
      );
    }
    const periodEnd = subscriptionPeriodEnd(current);
    state = {
      ...state,
      phase: "renewal-cycle-planned",
      renewalCycleTarget: periodEnd + 60,
    };
    await replaceState(statePath, state);
  }

  if (state.phase === "renewal-cycle-planned") {
    const excluded = new Set([initialInvoiceId]);
    let draft = await findCycleInvoice(
      stripe,
      subscription.id,
      excluded,
    );
    if (!draft) {
      await advanceClock(
        stripe,
        state,
        state.renewalCycleTarget!,
        "renewal-cycle",
      );
      draft = await waitForCycleInvoice(
        stripe,
        subscription.id,
        excluded,
      );
    }
    assertCycleInvoiceIdentity(
      draft,
      subscription.id,
      customerId,
    );
    const finalizesAt =
      draft.automatically_finalizes_at
      ?? (await readyClock(stripe, clockId)).frozen_time + 3_600;
    state = {
      ...state,
      phase: "renewal-invoice-observed",
      renewalInvoiceId: draft.id,
      renewalFinalizeTarget: finalizesAt + 60,
    };
    await replaceState(statePath, state);
  }

  if (state.phase === "renewal-invoice-observed") {
    let paid: Stripe.Invoice = await stripe.invoices.retrieve(
      state.renewalInvoiceId!,
    );
    if (paid.status !== "paid" || paid.amount_paid <= 0) {
      await advanceClock(
        stripe,
        state,
        state.renewalFinalizeTarget!,
        "renewal-finalize",
      );
      paid = await waitForInvoice(
        stripe,
        state.renewalInvoiceId!,
        (invoice) => invoice.status === "paid" && invoice.amount_paid > 0,
      );
    }
    assertCycleInvoice(paid, subscription.id, customerId, "paid");
    state = {
      ...state,
      phase: "renewal-invoice-finalized",
    };
    await replaceState(statePath, state);
  }

  if (state.phase === "renewal-invoice-finalized") {
    const paid = await stripe.invoices.retrieve(state.renewalInvoiceId!);
    assertCycleInvoice(paid, subscription.id, customerId, "paid");
    const paidEvent = await waitForEvent(
      stripe,
      ["invoice.paid"],
      paid.id,
      Math.floor(state.createdAt / 1_000) - 5,
    );
    await projectTestClockEvent(config, paidEvent);
    await attest(
      convex,
      config,
      state,
      subscription.id,
      "renewal-paid",
    );
    state = {
      ...state,
      phase: "renewal-projected",
    };
    await replaceState(statePath, state);
  }

  if (state.phase === "renewal-projected") {
    // Managed Payments subscriptions deliberately reject direct
    // default_payment_method updates. Model a genuine customer failure by
    // removing the saved checkout card before the next natural cycle instead.
    // Also clean up a tagged method from an interrupted legacy attempt.
    const preflight = await inspectRenewalFailurePreflight(
      stripe,
      state,
      subscription.id,
      customerId,
      config.priceIds["individual-monthly"],
    );
    for (const methodId of preflight.legacyFailureMethodIds) {
      await stripe.paymentMethods.detach(methodId, {}, {
        idempotencyKey: idempotencyKey(
          state.runId,
          `legacy-failure-method-detach-${methodId}`,
        ),
      });
    }

    const activePaymentMethodId = preflight.activePaymentMethodId;
    if (activePaymentMethodId) {
      const activePaymentMethod = await stripe.paymentMethods.retrieve(
        activePaymentMethodId,
      );
      const activePaymentMethodCustomer = expandableId(
        activePaymentMethod.customer,
      );
      if (
        activePaymentMethod.livemode
        || (
          activePaymentMethodCustomer
          && activePaymentMethodCustomer !== customerId
        )
      ) {
        throw new StripeSandboxJourneyError(
          "sandbox_test_clock_payment_method_detach_invalid",
        );
      }
      if (activePaymentMethodCustomer === customerId) {
        const detached = await stripe.paymentMethods.detach(
          activePaymentMethodId,
          {},
          {
            idempotencyKey: idempotencyKey(
              state.runId,
              "checkout-payment-method-detach",
            ),
          },
        );
        if (detached.livemode || expandableId(detached.customer)) {
          throw new StripeSandboxJourneyError(
            "sandbox_test_clock_payment_method_detach_invalid",
          );
        }
      }
    }

    const updated = await stripe.subscriptions.retrieve(subscription.id);
    const retainedPaymentMethodId = expandableId(
      updated.default_payment_method,
    );
    const retainedPaymentMethod = retainedPaymentMethodId
      ? await stripe.paymentMethods.retrieve(retainedPaymentMethodId)
      : null;
    if (
      (
        retainedPaymentMethod
        && (
          retainedPaymentMethod.livemode
          || expandableId(retainedPaymentMethod.customer)
        )
      )
      || expandableId(updated.latest_invoice) !== state.renewalInvoiceId
      || subscriptionPeriodEnd(updated) !== preflight.periodEnd
    ) {
      throw new StripeSandboxJourneyError(
        "sandbox_test_clock_payment_method_detach_invalid",
      );
    }
    await assertNoCustomerPaymentFallback(stripe, customerId);
    state = {
      ...state,
      phase: "failure-payment-disabled",
    };
    await replaceState(statePath, state);
  }

  if (state.phase === "failure-payment-disabled") {
    const current = await stripe.subscriptions.retrieve(subscription.id);
    if (
      current.status !== "active"
      || expandableId(current.latest_invoice) !== state.renewalInvoiceId
    ) {
      throw new StripeSandboxJourneyError(
        "sandbox_test_clock_failure_preflight_invalid",
      );
    }
    await assertNoCustomerPaymentFallback(stripe, customerId);
    const periodEnd = subscriptionPeriodEnd(current);
    state = {
      ...state,
      phase: "failure-cycle-planned",
      failureCycleTarget: periodEnd + 60,
    };
    await replaceState(statePath, state);
  }

  if (state.phase === "failure-cycle-planned") {
    const excluded = new Set([
      initialInvoiceId,
      state.renewalInvoiceId!,
    ]);
    let draft = await findCycleInvoice(
      stripe,
      subscription.id,
      excluded,
    );
    if (!draft) {
      await advanceClock(
        stripe,
        state,
        state.failureCycleTarget!,
        "failure-cycle",
      );
      draft = await waitForCycleInvoice(
        stripe,
        subscription.id,
        excluded,
      );
    }
    assertCycleInvoiceIdentity(
      draft,
      subscription.id,
      customerId,
    );
    const clock = await readyClock(stripe, clockId);
    const finalizesAt =
      draft.automatically_finalizes_at ?? clock.frozen_time + 3_600;
    state = {
      ...state,
      phase: "failure-invoice-observed",
      failedInvoiceId: draft.id,
      failureFinalizeTarget: finalizesAt + 60,
    };
    await replaceState(statePath, state);
  }

  if (state.phase === "failure-invoice-observed") {
    let failed: Stripe.Invoice = await stripe.invoices.retrieve(
      state.failedInvoiceId!,
    );
    if (!isAttemptedFailedInvoice(failed)) {
      await advanceClock(
        stripe,
        state,
        state.failureFinalizeTarget!,
        "failure-finalize",
      );
      failed = await waitForInvoice(
        stripe,
        state.failedInvoiceId!,
        isAttemptedFailedInvoice,
      );
    }
    assertCycleInvoice(failed, subscription.id, customerId, "open");
    state = {
      ...state,
      phase: "failure-invoice-finalized",
    };
    await replaceState(statePath, state);
  }

  if (state.phase === "failure-invoice-finalized") {
    const failed = await stripe.invoices.retrieve(state.failedInvoiceId!);
    if (!isAttemptedFailedInvoice(failed)) {
      throw new StripeSandboxJourneyError(
        "sandbox_test_clock_failed_invoice_invalid",
      );
    }
    assertCycleInvoice(failed, subscription.id, customerId, "open");
    const failedEvent = await waitForEvent(
      stripe,
      ["invoice.payment_failed"],
      failed.id,
      Math.floor(state.createdAt / 1_000) - 5,
    );
    await projectTestClockEvent(config, failedEvent);
    await attest(
      convex,
      config,
      state,
      subscription.id,
      "payment-failed",
    );
    state = {
      ...state,
      phase: "failure-projected",
    };
    await replaceState(statePath, state);
  }

  if (state.phase === "failure-projected") {
    state = { ...state, phase: "cancellation-requested" };
    await replaceState(statePath, state);
  }

  if (state.phase === "cancellation-requested") {
    const current = await stripe.subscriptions.retrieve(subscription.id);
    if (current.status !== "canceled") {
      await stripe.subscriptions.cancel(
        subscription.id,
        {},
        {
          idempotencyKey: idempotencyKey(
            state.runId,
            "subscription-cancel",
          ),
        },
      );
    }
    const canceledEvent = await waitForEvent(
      stripe,
      ["customer.subscription.deleted"],
      subscription.id,
      Math.floor(state.createdAt / 1_000) - 5,
    );
    await projectTestClockEvent(config, canceledEvent);
    await attest(
      convex,
      config,
      state,
      subscription.id,
      "canceled",
    );
    state = { ...state, phase: "canceled-projected" };
    await replaceState(statePath, state);
  }

  if (state.phase !== "canceled-projected") {
    throw new StripeSandboxJourneyError(
      "sandbox_test_clock_state_invalid",
    );
  }
  state = { ...state, phase: "cleanup-requested" };
  await replaceState(statePath, state);
  await finishTestClockCleanup(stripe, statePath, state);
  writeCompletedEvidence();
}

async function finishTestClockCleanup(
  stripe: Stripe,
  statePath: string,
  state: TestClockState,
): Promise<void> {
  try {
    await stripe.testHelpers.testClocks.del(
      state.clockId!,
      {},
      {
        idempotencyKey: idempotencyKey(state.runId, "clock-delete"),
      },
    );
  } catch (error) {
    if (!isStripeResourceMissing(error)) throw error;
  }
  await rm(statePath);
}

function writeCompletedEvidence(): void {
  process.stdout.write(`${JSON.stringify({
    mode: "executed",
    operation: "resume",
    sandboxOnly: true,
    managedPaymentsCheckout: true,
    testClock: true,
    lifecycle: [
      "purchase",
      "subscription_cycle_paid",
      "subscription_cycle_payment_failed",
      "cancellation",
    ],
    realEventsProjected: 4,
    accessStatesAttested: [
      "active",
      "renewed",
      "suspended",
      "expired",
    ],
    cleanupCompleted: true,
    continuationRemoved: true,
  })}\n`);
}

async function attest(
  convex: ConvexHttpClient,
  config: TestClockConfig,
  state: TestClockState,
  subscriptionId: string,
  phase:
    | "checkout-active"
    | "renewal-paid"
    | "payment-failed"
    | "canceled",
): Promise<void> {
  const result = await convex.query(
    anyApi.backup.attestStripeTestClockCheckout,
    {
      restoreSecret: config.restoreSecret,
      accountId: state.accountId,
      workspaceId: state.workspaceId,
      checkoutSessionId: state.sessionId,
      phase,
    },
  ) as Record<string, unknown>;
  const expectedAccess = phase === "payment-failed"
    ? "suspended"
    : phase === "canceled"
      ? "expired"
      : "active";
  if (
    result.targetClass !== "isolated-test"
    || result.attested !== true
    || result.phase !== phase
    || result.accessStatus !== expectedAccess
    || result.exactPurchaseCount !== 1
    || result.exactLicenceCount !== 3
    || result.exactEntitlementCount !== 3
    || result.exactSeatCount !== 3
    || (
      phase !== "checkout-active"
      && result.paidRenewalCount !== 1
    )
    || (
      (phase === "payment-failed" || phase === "canceled")
      && result.failedInvoiceCount !== 1
    )
    || !/^sub_[A-Za-z0-9_]+$/u.test(subscriptionId)
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_test_clock_attestation_invalid",
    );
  }
}

async function projectTestClockEvent(
  config: TestClockConfig,
  event: Stripe.Event,
): Promise<void> {
  await projectSandboxEvent(
    config,
    event,
    fetch,
    undefined,
    ["applied", "duplicate"],
  );
}

export function testClockSubscriptionStatusAllowed(
  phase: TestClockPhase,
  status: Stripe.Subscription.Status,
): boolean {
  if (
    phase === "canceled-projected"
    || phase === "cleanup-requested"
  ) {
    return status === "canceled";
  }
  if (phase === "cancellation-requested") {
    return status === "active"
      || status === "past_due"
      || status === "unpaid"
      || status === "canceled";
  }
  if (
    phase === "failure-invoice-observed"
    || phase === "failure-invoice-finalized"
    || phase === "failure-projected"
  ) {
    return status === "active"
      || status === "past_due"
      || status === "unpaid";
  }
  return status === "active";
}

interface RenewalFailurePreflight {
  activePaymentMethodId: string;
  legacyFailureMethodIds: string[];
  periodEnd: number;
}

async function inspectRenewalFailurePreflight(
  stripe: Stripe,
  state: TestClockState,
  subscriptionId: string,
  customerId: string,
  expectedPriceId: string,
): Promise<RenewalFailurePreflight> {
  if (
    !state.initialInvoiceId
    || !state.renewalInvoiceId
    || state.initialInvoiceId === state.renewalInvoiceId
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_test_clock_failure_preflight_invalid",
    );
  }
  const [subscription, invoices, attachedCards, customer, laterEvents] =
    await Promise.all([
      stripe.subscriptions.retrieve(subscriptionId),
      stripe.invoices.list({ subscription: subscriptionId, limit: 100 }),
      stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
        limit: 100,
      }),
      stripe.customers.retrieve(customerId),
      stripe.events.list({
        created: { gte: Math.floor(state.createdAt / 1_000) - 5 },
        types: [
          "invoice.payment_failed",
          "customer.subscription.deleted",
        ],
        limit: 100,
      }),
    ]);
  const item = subscription.items.data[0];
  const activePaymentMethodId = expandableId(
    subscription.default_payment_method,
  );
  const initial = invoices.data.find(
    (invoice) => invoice.id === state.initialInvoiceId,
  );
  const renewal = invoices.data.find(
    (invoice) => invoice.id === state.renewalInvoiceId,
  );
  if (
    subscription.livemode
    || subscription.status !== "active"
    || expandableId(subscription.customer) !== customerId
    || expandableId(subscription.latest_invoice) !== state.renewalInvoiceId
    || subscription.items.data.length !== 1
    || item?.quantity !== 1
    || item?.price.id !== expectedPriceId
    || !activePaymentMethodId
    || invoices.has_more
    || invoices.data.length !== 2
    || !initial
    || initial.livemode
    || initial.status !== "paid"
    || initial.billing_reason !== "subscription_create"
    || invoiceSubscriptionId(initial) !== subscriptionId
    || expandableId(initial.customer) !== customerId
    || !renewal
    || renewal.livemode
    || renewal.status !== "paid"
    || renewal.billing_reason !== "subscription_cycle"
    || renewal.amount_paid <= 0
    || invoiceSubscriptionId(renewal) !== subscriptionId
    || expandableId(renewal.customer) !== customerId
    || attachedCards.has_more
    || laterEvents.has_more
    || laterEvents.data.some((event) =>
      event.livemode
      || containsIdentifier(event.data.object, subscriptionId)
      || containsIdentifier(event.data.object, state.runId))
    || (
      "deleted" in customer
      && customer.deleted === true
    )
    || (
      !("deleted" in customer)
      && (
        expandableId(customer.invoice_settings.default_payment_method)
        || expandableId(customer.default_source)
      )
    )
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_test_clock_failure_preflight_invalid",
    );
  }
  const activePaymentMethod = await stripe.paymentMethods.retrieve(
    activePaymentMethodId,
  );
  const activePaymentMethodCustomer = expandableId(
    activePaymentMethod.customer,
  );
  const legacyFailureMethods = attachedCards.data.filter((method) =>
    method.metadata?.gummyui_sandbox_run_id === state.runId
    && method.metadata?.gummyui_sandbox_step === "renewal-failure"
  );
  const allowedIds = new Set([
    ...(activePaymentMethodCustomer === customerId
      ? [activePaymentMethodId]
      : []),
    ...legacyFailureMethods.map((method) => method.id),
  ]);
  if (
    activePaymentMethod.livemode
    || (
      activePaymentMethodCustomer !== null
      && activePaymentMethodCustomer !== customerId
    )
    || legacyFailureMethods.length > 1
    || attachedCards.data.some((method) =>
      method.livemode || !allowedIds.has(method.id))
    || attachedCards.data.length !== allowedIds.size
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_test_clock_failure_preflight_invalid",
    );
  }
  return {
    activePaymentMethodId,
    legacyFailureMethodIds: legacyFailureMethods.map((method) => method.id),
    periodEnd: subscriptionPeriodEnd(subscription),
  };
}

async function assertNoCustomerPaymentFallback(
  stripe: Stripe,
  customerId: string,
): Promise<void> {
  const [customer, cards] = await Promise.all([
    stripe.customers.retrieve(customerId),
    stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
      limit: 100,
    }),
  ]);
  if (
    ("deleted" in customer && customer.deleted === true)
    || (
      !("deleted" in customer)
      && (
        expandableId(customer.invoice_settings.default_payment_method)
        || expandableId(customer.default_source)
      )
    )
    || cards.has_more
    || cards.data.length !== 0
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_test_clock_payment_fallback_present",
    );
  }
}

async function advanceClock(
  stripe: Stripe,
  state: TestClockState,
  frozenTime: number,
  step: string,
): Promise<void> {
  const current = await readyClock(stripe, state.clockId!);
  if (current.frozen_time >= frozenTime) return;
  await stripe.testHelpers.testClocks.advance(
    state.clockId!,
    { frozen_time: frozenTime },
    {
      idempotencyKey: idempotencyKey(
        state.runId,
        `${step}-${frozenTime}`,
      ),
    },
  );
  await waitForClock(stripe, state.clockId!, frozenTime);
}

async function readyClock(
  stripe: Stripe,
  clockId: string,
): Promise<Stripe.TestHelpers.TestClock> {
  const clock = await stripe.testHelpers.testClocks.retrieve(clockId);
  if (clock.livemode || clock.status !== "ready") {
    throw new StripeSandboxJourneyError(
      "sandbox_test_clock_not_ready",
    );
  }
  return clock;
}

async function waitForClock(
  stripe: Stripe,
  clockId: string,
  expectedFrozenTime: number,
): Promise<void> {
  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  do {
    const clock = await stripe.testHelpers.testClocks.retrieve(clockId);
    if (clock.livemode || clock.status === "internal_failure") {
      throw new StripeSandboxJourneyError(
        "sandbox_test_clock_advance_failed",
      );
    }
    if (
      clock.status === "ready"
      && clock.frozen_time >= expectedFrozenTime
    ) {
      return;
    }
    await sleep(POLL_INTERVAL_MS);
  } while (Date.now() < deadline);
  throw new StripeSandboxJourneyError(
    "sandbox_test_clock_wait_timeout",
  );
}

async function waitForCycleInvoice(
  stripe: Stripe,
  subscriptionId: string,
  excluded: Set<string>,
): Promise<Stripe.Invoice> {
  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  do {
    const match = await findCycleInvoice(
      stripe,
      subscriptionId,
      excluded,
    );
    if (match) return match;
    await sleep(POLL_INTERVAL_MS);
  } while (Date.now() < deadline);
  throw new StripeSandboxJourneyError(
    "sandbox_test_clock_invoice_unavailable",
  );
}

async function findCycleInvoice(
  stripe: Stripe,
  subscriptionId: string,
  excluded: Set<string>,
): Promise<Stripe.Invoice | null> {
  const invoices = await stripe.invoices.list({
    subscription: subscriptionId,
    limit: 100,
  });
  if (invoices.has_more) {
    throw new StripeSandboxJourneyError(
      "sandbox_test_clock_invoice_ambiguous",
    );
  }
  return selectExactCycleInvoice(invoices.data, excluded);
}

export function selectExactCycleInvoice(
  invoices: readonly Stripe.Invoice[],
  excluded: ReadonlySet<string>,
): Stripe.Invoice | null {
  const matches = invoices.filter((invoice) =>
    !invoice.livemode
    && !excluded.has(invoice.id)
    && invoice.billing_reason === "subscription_cycle");
  if (matches.length > 1) {
    throw new StripeSandboxJourneyError(
      "sandbox_test_clock_invoice_ambiguous",
    );
  }
  return matches[0] ?? null;
}

async function waitForInvoice(
  stripe: Stripe,
  invoiceId: string,
  predicate: (invoice: Stripe.Invoice) => boolean,
): Promise<Stripe.Invoice> {
  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  do {
    const invoice = await stripe.invoices.retrieve(invoiceId);
    if (!invoice.livemode && predicate(invoice)) return invoice;
    await sleep(POLL_INTERVAL_MS);
  } while (Date.now() < deadline);
  throw new StripeSandboxJourneyError(
    "sandbox_test_clock_invoice_wait_timeout",
  );
}

async function waitForEvent(
  stripe: Stripe,
  types: string[],
  targetId: string,
  createdAfter: number,
): Promise<Stripe.Event> {
  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  do {
    const events = await stripe.events.list({
      created: { gte: Math.max(0, createdAfter - 2) },
      types,
      limit: 100,
    });
    const match = events.data.find((event) =>
      !event.livemode && containsIdentifier(event.data.object, targetId));
    if (match) return match;
    await sleep(POLL_INTERVAL_MS);
  } while (Date.now() < deadline);
  throw new StripeSandboxJourneyError(
    "sandbox_test_clock_event_wait_timeout",
  );
}

function assertCycleInvoice(
  invoice: Stripe.Invoice,
  subscriptionId: string,
  customerId: string,
  status: "paid" | "open",
): void {
  if (
    invoice.livemode
    || invoice.billing_reason !== "subscription_cycle"
    || invoice.status !== status
    || invoice.currency.toLowerCase() !== "usd"
    || invoice.total < 4_900
    || expandableId(invoice.customer) !== customerId
    || invoiceSubscriptionId(invoice) !== subscriptionId
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_test_clock_invoice_invalid",
    );
  }
}

function assertCycleInvoiceIdentity(
  invoice: Stripe.Invoice,
  subscriptionId: string,
  customerId: string,
): void {
  if (
    invoice.livemode
    || invoice.billing_reason !== "subscription_cycle"
    || invoice.currency.toLowerCase() !== "usd"
    || invoice.total < 4_900
    || expandableId(invoice.customer) !== customerId
    || invoiceSubscriptionId(invoice) !== subscriptionId
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_test_clock_invoice_invalid",
    );
  }
}

export function isAttemptedFailedInvoice(
  invoice: Pick<
    Stripe.Invoice,
    "livemode" | "status" | "amount_paid" | "attempted"
  >,
): boolean {
  return !invoice.livemode
    && invoice.status === "open"
    && invoice.amount_paid === 0
    && invoice.attempted === true;
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  return expandableId(
    invoice.parent?.subscription_details?.subscription ?? null,
  );
}

function subscriptionPeriodEnd(subscription: Stripe.Subscription): number {
  const item = subscription.items.data[0];
  if (
    subscription.items.data.length !== 1
    || item?.quantity !== 1
    || !Number.isSafeInteger(item.current_period_end)
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_test_clock_subscription_invalid",
    );
  }
  return item.current_period_end;
}

function containsIdentifier(value: unknown, targetId: string): boolean {
  if (value === targetId) return true;
  if (Array.isArray(value)) {
    return value.some((item) => containsIdentifier(item, targetId));
  }
  if (!value || typeof value !== "object") return false;
  return Object.values(value as Record<string, unknown>).some((item) =>
    containsIdentifier(item, targetId));
}

function expandableId(
  value: string | { id: string } | null | undefined,
): string | null {
  return typeof value === "string" ? value : value?.id ?? null;
}

function expandableObject<T extends { id: string }>(
  value: string | T | null | undefined,
): T | null {
  return value && typeof value !== "string" ? value : null;
}

function readConfig(
  environment: Readonly<Record<string, string | undefined>>,
): TestClockConfig {
  const config = readStripeSandboxJourneyConfig(environment);
  const restoreSecret =
    environment.STRIPE_SANDBOX_RESTORE_SECRET?.trim();
  if (
    environment.STRIPE_SANDBOX_EXECUTION_CONFIRMATION !== CONFIRMATION
    || !restoreSecret
    || restoreSecret.length < 32
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_test_clock_configuration_unavailable",
    );
  }
  return { ...config, restoreSecret };
}

function stripeClient(key: string): Stripe {
  return new Stripe(key, {
    apiVersion: STRIPE_MANAGED_PAYMENTS_API_VERSION,
    appInfo: {
      name: "gummyui-stripe-test-clock-journey",
      version: "1.0.0",
    },
  });
}

function isStripeCheckoutUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && (
        url.hostname === "stripe.com"
        || url.hostname.endsWith(".stripe.com")
      );
  } catch {
    return false;
  }
}

function safeStatePath(): string {
  const root = resolve(process.cwd(), "work", "stripe-sandbox");
  const path = resolve(process.cwd(), STATE_PATH);
  if (dirname(path) !== root) {
    throw new StripeSandboxJourneyError(
      "sandbox_test_clock_state_path_refused",
    );
  }
  return path;
}

async function createState(
  path: string,
  state: TestClockState,
): Promise<void> {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  await chmod(dirname(path), 0o700);
  await writeFile(path, `${JSON.stringify(state)}\n`, {
    encoding: "utf8",
    flag: "wx",
    mode: 0o600,
  });
}

async function readStateIfPresent(
  path: string,
): Promise<TestClockState | null> {
  try {
    return await readState(path);
  } catch (error) {
    if (
      error instanceof StripeSandboxJourneyError
      && error.code === "sandbox_test_clock_state_unavailable"
    ) {
      return null;
    }
    throw error;
  }
}

async function readState(path: string): Promise<TestClockState> {
  let details;
  let raw;
  try {
    details = await lstat(path);
    raw = await readFile(path, "utf8");
  } catch {
    throw new StripeSandboxJourneyError(
      "sandbox_test_clock_state_unavailable",
    );
  }
  const directory = await lstat(dirname(path));
  if (
    !details.isFile()
    || details.isSymbolicLink()
    || (details.mode & 0o077) !== 0
    || !directory.isDirectory()
    || directory.isSymbolicLink()
    || (directory.mode & 0o077) !== 0
    || Buffer.byteLength(raw, "utf8") > 16_384
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_test_clock_state_permissions_invalid",
    );
  }
  try {
    return JSON.parse(raw) as TestClockState;
  } catch {
    throw new StripeSandboxJourneyError(
      "sandbox_test_clock_state_invalid",
    );
  }
}

async function replaceState(
  path: string,
  state: TestClockState,
): Promise<void> {
  assertTestClockState(state);
  const temporary =
    `${path}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(state)}\n`, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
    await rename(temporary, path);
    await chmod(path, 0o600);
  } catch {
    await rm(temporary, { force: true });
    throw new StripeSandboxJourneyError(
      "sandbox_test_clock_state_replace_failed",
    );
  }
}

export function assertTestClockState(state: TestClockState): void {
  if (
    state.schemaVersion !== 2
    || ![
      "preparing",
      "clock-created",
      "customer-created",
      "ready",
      "checkout-projected",
      "renewal-cycle-planned",
      "renewal-invoice-observed",
      "renewal-invoice-finalized",
      "renewal-projected",
      "failure-payment-disabled",
      "failure-cycle-planned",
      "failure-invoice-observed",
      "failure-invoice-finalized",
      "failure-projected",
      "cancellation-requested",
      "canceled-projected",
      "cleanup-requested",
    ].includes(state.phase)
    || !/^gummyui-clock-[a-f0-9]{32}$/u.test(state.runId)
    || !/^account:sandbox-[A-Za-z0-9._:-]{4,240}$/u.test(state.accountId)
    || !/^workspace:sandbox-[A-Za-z0-9._:-]{4,240}$/u.test(state.workspaceId)
    || !Number.isSafeInteger(state.createdAt)
    || state.createdAt <= 0
    || (state.clockId != null && !/^clock_[A-Za-z0-9_]+$/u.test(state.clockId))
    || (state.customerId != null && !/^cus_[A-Za-z0-9_]+$/u.test(state.customerId))
    || (state.sessionId != null && !/^cs_test_[A-Za-z0-9_]+$/u.test(state.sessionId))
    || (state.subscriptionId != null
      && !/^sub_[A-Za-z0-9_]+$/u.test(state.subscriptionId))
    || (state.initialInvoiceId != null
      && !/^in_[A-Za-z0-9_]+$/u.test(state.initialInvoiceId))
    || (state.renewalInvoiceId != null
      && !/^in_[A-Za-z0-9_]+$/u.test(state.renewalInvoiceId))
    || (state.failedInvoiceId != null
      && !/^in_[A-Za-z0-9_]+$/u.test(state.failedInvoiceId))
    || (
      phaseAtOrAfter(state.phase, "checkout-projected")
      && (!state.subscriptionId || !state.initialInvoiceId)
    )
    || (
      phaseAtOrAfter(state.phase, "renewal-cycle-planned")
      && !validClockTarget(state.renewalCycleTarget)
    )
    || (
      phaseAtOrAfter(state.phase, "renewal-invoice-observed")
      && (
        !state.renewalInvoiceId
        || !validClockTarget(state.renewalFinalizeTarget)
      )
    )
    || (
      phaseAtOrAfter(state.phase, "failure-cycle-planned")
      && !validClockTarget(state.failureCycleTarget)
    )
    || (
      phaseAtOrAfter(state.phase, "failure-invoice-observed")
      && (
        !state.failedInvoiceId
        || !validClockTarget(state.failureFinalizeTarget)
      )
    )
    || (state.checkoutUrl != null && !isStripeCheckoutUrl(state.checkoutUrl))
  ) {
    throw new StripeSandboxJourneyError(
      "sandbox_test_clock_state_invalid",
    );
  }
}

const TEST_CLOCK_PHASE_ORDER: readonly TestClockPhase[] = [
  "preparing",
  "clock-created",
  "customer-created",
  "ready",
  "checkout-projected",
  "renewal-cycle-planned",
  "renewal-invoice-observed",
  "renewal-invoice-finalized",
  "renewal-projected",
  "failure-payment-disabled",
  "failure-cycle-planned",
  "failure-invoice-observed",
  "failure-invoice-finalized",
  "failure-projected",
  "cancellation-requested",
  "canceled-projected",
  "cleanup-requested",
];

function phaseAtOrAfter(
  phase: TestClockPhase,
  minimum: TestClockPhase,
): boolean {
  return TEST_CLOCK_PHASE_ORDER.indexOf(phase)
    >= TEST_CLOCK_PHASE_ORDER.indexOf(minimum);
}

function validClockTarget(value: number | undefined): boolean {
  return Number.isSafeInteger(value) && (value ?? 0) > 0;
}

function isStripeResourceMissing(error: unknown): boolean {
  return Boolean(
    error
    && typeof error === "object"
    && (error as { code?: unknown }).code === "resource_missing",
  );
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolvePromise) =>
    setTimeout(resolvePromise, milliseconds));
}

if (
  process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    const code = error instanceof StripeSandboxJourneyError
      ? error.code
      : "sandbox_test_clock_provider_failed";
    process.stderr.write(`${JSON.stringify({ ok: false, error: code })}\n`);
    process.exitCode = 1;
  });
}
