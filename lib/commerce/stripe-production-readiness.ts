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

const RESTRICTED_LIVE_KEY = /^rk_live_[A-Za-z0-9]{24,}$/;
const PRICE_ID = /^price_[A-Za-z0-9]+$/;

export async function verifyStripeProductionReadiness(
  dependencies: ReadinessDependencies = {},
): Promise<StripeProductionReadiness> {
  const environment = dependencies.environment ?? process.env;
  const restrictedKey = environment.STRIPE_RESTRICTED_KEY?.trim();

  if (!restrictedKey || !RESTRICTED_LIVE_KEY.test(restrictedKey)) {
    throw new Error("Production restricted Stripe key is unavailable");
  }
  if (environment.STRIPE_CHECKOUT_ENABLED === "true") {
    throw new Error("Checkout must remain disabled during readiness proof");
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
      throw new Error(`Invalid configured Stripe price for ${plan.id}`);
    }
    if (configuredPrices.has(priceId)) {
      throw new Error("Configured Stripe prices must be unique");
    }
    configuredPrices.add(priceId);
    configuredPlans.push({ plan, priceId });
  }

  for (const { plan, priceId } of configuredPlans) {
    let price: Stripe.Price;
    try {
      price = await prices.retrieve(priceId);
    } catch {
      throw new Error(`Unable to verify Stripe price for ${plan.id}`);
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
    throw new Error(`Stripe price does not match ${plan.id}`);
  }
  if (expectedRecurringInterval) {
    if (
      price.type !== "recurring"
      || price.recurring?.interval !== expectedRecurringInterval
      || price.recurring.interval_count !== 1
    ) {
      throw new Error(`Stripe billing interval does not match ${plan.id}`);
    }
    return;
  }
  if (price.type !== "one_time" || price.recurring !== null) {
    throw new Error(`Stripe billing mode does not match ${plan.id}`);
  }
}
