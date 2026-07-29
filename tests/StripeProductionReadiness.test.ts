import type Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";
import { commercialPlans } from "../app/data/commercial";
import {
  runStripeProductionReadiness,
} from "../scripts/stripe-production-readiness";
import {
  StripeProductionReadinessError,
  verifyStripeProductionReadiness,
} from "../lib/commerce/stripe-production-readiness";

const restrictedKey = `rk_live_${"a".repeat(24)}`;

describe("Stripe production readiness operator", () => {
  it("verifies all nine live prices without enabling checkout", async () => {
    const environment = readyEnvironment();
    const writeOutput = vi.fn();
    const retrieve = vi.fn(async (id: string) => {
      const plan = commercialPlans.find(
        (candidate) => environment[priceEnvironmentKey(candidate.id)] === id,
      );
      if (!plan) throw new Error("missing fixture");
      return priceFixture(plan);
    });

    await runStripeProductionReadiness({
      environment,
      prices: { retrieve },
      writeOutput,
    });

    expect(retrieve).toHaveBeenCalledTimes(9);
    expect(writeOutput).toHaveBeenCalledWith(JSON.stringify({
      status: "ready",
      credential: "restricted-live",
      checkout: "disabled",
      verifiedPrices: 9,
    }));
  });

  it("rejects a full-scope key and enabled checkout", async () => {
    await expect(runStripeProductionReadiness({
      environment: {
        ...readyEnvironment(),
        STRIPE_RESTRICTED_KEY: `sk_live_${"a".repeat(24)}`,
      },
      prices: { retrieve: vi.fn() },
    })).rejects.toThrow("restricted Stripe key");

    await expect(runStripeProductionReadiness({
      environment: {
        ...readyEnvironment(),
        STRIPE_CHECKOUT_ENABLED: "true",
      },
      prices: { retrieve: vi.fn() },
    })).rejects.toThrow("Checkout must remain disabled");
  });

  it("fails closed on duplicate, mismatched, or unreadable prices", async () => {
    const duplicateEnvironment = readyEnvironment();
    duplicateEnvironment.STRIPE_PRICE_TEAM_MONTHLY =
      duplicateEnvironment.STRIPE_PRICE_INDIVIDUAL_MONTHLY;
    await expect(runStripeProductionReadiness({
      environment: duplicateEnvironment,
      prices: { retrieve: vi.fn() },
    })).rejects.toThrow("must be unique");

    const mismatched = priceFixture(commercialPlans[0]);
    mismatched.unit_amount = 1;
    await expect(runStripeProductionReadiness({
      environment: readyEnvironment(),
      prices: { retrieve: vi.fn(async () => mismatched) },
    })).rejects.toThrow("does not match");

    await expect(runStripeProductionReadiness({
      environment: readyEnvironment(),
      prices: {
        retrieve: vi.fn(async () => {
          throw new Error("provider response must not escape");
        }),
      },
    })).rejects.toThrow("Unable to verify Stripe price");
  });

  it("classifies provider denial without exposing its diagnostic", async () => {
    for (const [providerError, expectedCode] of [
      [{ code: "resource_missing" }, "price_resource_missing"],
      [{ type: "StripePermissionError" }, "price_permission_denied"],
      [{ statusCode: 403 }, "price_permission_denied"],
      [
        {
          raw: {
            statusCode: 401,
            type: "invalid_request_error",
          },
          type: "StripeAuthenticationError",
        },
        "restricted_key_rejected",
      ],
      [{ statusCode: 500 }, "price_read_failed"],
    ] as const) {
      let failure: unknown;
      try {
        await verifyStripeProductionReadiness({
          environment: readyEnvironment(),
          prices: {
            retrieve: vi.fn(async () => {
              throw providerError;
            }),
          },
        });
      } catch (error) {
        failure = error;
      }
      expect(failure).toBeInstanceOf(StripeProductionReadinessError);
      expect((failure as StripeProductionReadinessError).code)
        .toBe(expectedCode);
    }
  });
});

function readyEnvironment(): Record<string, string> {
  return Object.fromEntries([
    ["STRIPE_RESTRICTED_KEY", restrictedKey],
    ["STRIPE_CHECKOUT_ENABLED", "false"],
    ...commercialPlans.map((plan) => [
      priceEnvironmentKey(plan.id),
      `price_${plan.id.replaceAll("-", "")}`,
    ]),
  ]);
}

function priceEnvironmentKey(id: string): string {
  return `STRIPE_PRICE_${id.replaceAll("-", "_").toUpperCase()}`;
}

function priceFixture(
  plan: (typeof commercialPlans)[number],
): Stripe.Price {
  const recurring = plan.billingInterval === "lifetime"
    ? null
    : {
        interval: plan.billingInterval,
        interval_count: 1,
        meter: null,
        trial_period_days: null,
        usage_type: "licensed",
      };
  return {
    id: `price_${plan.id.replaceAll("-", "")}`,
    object: "price",
    active: true,
    billing_scheme: "per_unit",
    created: 0,
    currency: "usd",
    custom_unit_amount: null,
    livemode: true,
    lookup_key: plan.id,
    metadata: {},
    nickname: null,
    product: "prod_test",
    recurring,
    tax_behavior: "unspecified",
    tiers_mode: null,
    transform_quantity: null,
    type: recurring ? "recurring" : "one_time",
    unit_amount: plan.priceUsd * 100,
    unit_amount_decimal: String(plan.priceUsd * 100),
  } as unknown as Stripe.Price;
}
