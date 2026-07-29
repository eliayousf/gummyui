import Stripe from "stripe";
import {
  commercialPlans,
  type CommercialPlan,
} from "../../app/data/commercial";

export interface StripePriceReader {
  retrieve(id: string): Promise<Stripe.Price>;
}

export interface StripeProductionReadiness {
  status: "ready";
  credential: "restricted-live";
  checkout: "disabled";
  verifiedPrices: number;
}

interface ReadinessDependencies {
  environment?: Readonly<Record<string, string | undefined>>;
  prices?: StripePriceReader;
}

export type StripeReadinessFailureCode =
  | "restricted_key_unavailable"
  | "restricted_key_rejected"
  | "checkout_enabled"
  | "price_configuration_invalid"
  | "price_configuration_duplicate"
  | "price_permission_denied"
  | "price_resource_missing"
  | "price_read_failed"
  | "price_contract_mismatch"
  | "billing_contract_mismatch"
  | "provider_unavailable";

export class StripeProductionReadinessError extends Error {
  constructor(
    readonly code: Exclude<
      StripeReadinessFailureCode,
      "provider_unavailable"
    >,
    message: string,
  ) {
    super(message);
    this.name = "StripeProductionReadinessError";
  }
}

const RESTRICTED_LIVE_KEY = /^rk_live_[A-Za-z0-9]{24,}$/;
const PRICE_ID = /^price_[A-Za-z0-9]+$/;

export async function verifyStripeProductionReadiness(
  dependencies: ReadinessDependencies = {},
): Promise<StripeProductionReadiness> {
  const environment = dependencies.environment ?? process.env;
  const restrictedKey = environment.STRIPE_RESTRICTED_KEY?.trim();

  if (!restrictedKey || !RESTRICTED_LIVE_KEY.test(restrictedKey)) {
    throw new StripeProductionReadinessError(
      "restricted_key_unavailable",
      "Production restricted Stripe key is unavailable",
    );
  }
  if (environment.STRIPE_CHECKOUT_ENABLED === "true") {
    throw new StripeProductionReadinessError(
      "checkout_enabled",
      "Checkout must remain disabled during readiness proof",
    );
  }

  const prices = dependencies.prices ?? new Stripe(restrictedKey, {
    maxNetworkRetries: 2,
    timeout: 20_000,
    typescript: true,
  }).prices;
  const configuredPrices = new Set<string>();
  const configuredPlans: Array<{
    plan: CommercialPlan;
    priceId: string;
  }> = [];

  for (const plan of commercialPlans) {
    const environmentKey = priceEnvironmentKey(plan);
    const priceId = environment[environmentKey]?.trim();
    if (!priceId || !PRICE_ID.test(priceId)) {
      throw new StripeProductionReadinessError(
        "price_configuration_invalid",
        `Invalid configured Stripe price for ${plan.id}`,
      );
    }
    if (configuredPrices.has(priceId)) {
      throw new StripeProductionReadinessError(
        "price_configuration_duplicate",
        "Configured Stripe prices must be unique",
      );
    }
    configuredPrices.add(priceId);
    configuredPlans.push({ plan, priceId });
  }

  for (const { plan, priceId } of configuredPlans) {
    let price: Stripe.Price;
    try {
      price = await prices.retrieve(priceId);
    } catch (error) {
      throw new StripeProductionReadinessError(
        classifyPriceReadFailure(error),
        `Unable to verify Stripe price for ${plan.id}`,
      );
    }
    assertPriceMatchesPlan(price, plan, priceId);
  }

  return {
    status: "ready",
    credential: "restricted-live",
    checkout: "disabled",
    verifiedPrices: configuredPrices.size,
  };
}

function priceEnvironmentKey(plan: CommercialPlan): string {
  return `STRIPE_PRICE_${plan.id.replaceAll("-", "_").toUpperCase()}`;
}

function assertPriceMatchesPlan(
  price: Stripe.Price,
  plan: CommercialPlan,
  expectedId: string,
): void {
  const expectedAmount = plan.priceUsd * 100;
  const expectedRecurringInterval = plan.billingInterval === "month"
    ? "month"
    : plan.billingInterval === "year"
      ? "year"
      : null;
  if (
    price.id !== expectedId
    || price.livemode !== true
    || price.active !== true
    || price.currency.toLowerCase() !== "usd"
    || price.unit_amount !== expectedAmount
  ) {
    throw new StripeProductionReadinessError(
      "price_contract_mismatch",
      `Stripe price does not match ${plan.id}`,
    );
  }
  if (expectedRecurringInterval) {
    if (
      price.type !== "recurring"
      || price.recurring?.interval !== expectedRecurringInterval
      || price.recurring.interval_count !== 1
    ) {
      throw new StripeProductionReadinessError(
        "billing_contract_mismatch",
        `Stripe billing interval does not match ${plan.id}`,
      );
    }
    return;
  }
  if (price.type !== "one_time" || price.recurring !== null) {
    throw new StripeProductionReadinessError(
      "billing_contract_mismatch",
      `Stripe billing mode does not match ${plan.id}`,
    );
  }
}

function classifyPriceReadFailure(
  error: unknown,
):
  | "restricted_key_rejected"
  | "price_permission_denied"
  | "price_resource_missing"
  | "price_read_failed" {
  if (!error || typeof error !== "object") return "price_read_failed";
  const record = error as {
    code?: unknown;
    raw?: unknown;
    statusCode?: unknown;
    type?: unknown;
  };
  const raw = record.raw && typeof record.raw === "object"
    ? record.raw as {
      code?: unknown;
      statusCode?: unknown;
      type?: unknown;
    }
    : undefined;
  const code = record.code ?? raw?.code;
  const statusCode = record.statusCode ?? raw?.statusCode;
  const type = record.type ?? raw?.type;
  if (type === "StripeAuthenticationError" || statusCode === 401) {
    return "restricted_key_rejected";
  }
  if (code === "resource_missing") return "price_resource_missing";
  if (
    type === "StripePermissionError"
    || statusCode === 403
  ) {
    return "price_permission_denied";
  }
  return "price_read_failed";
}

export function stripeReadinessFailureCode(
  error: unknown,
): StripeReadinessFailureCode {
  return error instanceof StripeProductionReadinessError
    ? error.code
    : "provider_unavailable";
}
