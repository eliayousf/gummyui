import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { evaluateCommerceHealth } from "../lib/commerce/health-readiness";

describe("commerce health readiness", () => {
  it("does not require commerce dependencies before checkout is enabled", async () => {
    const probe = vi.fn();
    await expect(evaluateCommerceHealth({}, probe)).resolves.toEqual({
      mode: "disabled",
      readiness: "not_required",
    });
    expect(probe).not.toHaveBeenCalled();
  });

  it("fails closed without exposing which production setting is absent", async () => {
    const probe = vi.fn();
    await expect(evaluateCommerceHealth({
      STRIPE_CHECKOUT_ENABLED: "true",
    }, probe)).resolves.toEqual({
      mode: "enabled",
      readiness: "unavailable",
    });
    expect(probe).not.toHaveBeenCalled();
  });

  it("requires the safe Convex probe after aggregate configuration passes", async () => {
    const environment = readyEnvironment();
    const probe = vi.fn(async () => ({ ok: true }));
    await expect(evaluateCommerceHealth(environment, probe))
      .resolves.toEqual({
        mode: "enabled",
        readiness: "ready",
      });
    expect(probe).toHaveBeenCalledTimes(1);

    probe.mockResolvedValueOnce({ ok: false });
    await expect(evaluateCommerceHealth(environment, probe))
      .resolves.toEqual({
        mode: "enabled",
        readiness: "unavailable",
      });
  });
});

function readyEnvironment(): Record<string, string> {
  const environment: Record<string, string> = {
    STRIPE_CHECKOUT_ENABLED: "true",
    STRIPE_WEBHOOK_ENABLED: "true",
    WORKOS_WEBHOOK_ENABLED: "true",
    RESEND_WEBHOOK_ENABLED: "true",
    GUMMYUI_ORIGIN: "https://gummyui.dev",
    NEXT_PUBLIC_CONVEX_URL: "https://test.convex.cloud",
    CONVEX_SERVER_SECRET: "c".repeat(32),
    WORKOS_CLIENT_ID: "client_notreal",
    WORKOS_API_KEY: "sk_test_notreal",
    WORKOS_COOKIE_PASSWORD: "w".repeat(32),
    WORKOS_WEBHOOK_SECRET: "workos_webhook_secret_not_real",
    WORKOS_REDIRECT_URI:
      "https://gummyui.dev/auth/callback",
    NEXT_PUBLIC_WORKOS_REDIRECT_URI:
      "https://gummyui.dev/auth/callback",
    STRIPE_SECRET_KEY: "sk_test_notreal",
    STRIPE_WEBHOOK_SECRET: "whsec_not_real",
    DOWNLOAD_GRANT_SECRET: "d".repeat(32),
    DOWNLOAD_GRANT_TTL_SECONDS: "300",
    BACKBLAZE_B2_ENDPOINT:
      "https://s3.eu-central-003.backblazeb2.com",
    BACKBLAZE_B2_REGION: "eu-central-003",
    BACKBLAZE_B2_BUCKET: "gummyui-pro-releases",
    BACKBLAZE_B2_KEY_ID: "key_id_not_real",
    BACKBLAZE_B2_APPLICATION_KEY: "a".repeat(24),
    RESEND_API_KEY: "re_test_not_real",
    RESEND_FROM_EMAIL: "Gummy UI <support@kreydlabs.com>",
    RESEND_REPLY_TO_EMAIL: "support@kreydlabs.com",
    RESEND_WEBHOOK_SECRET:
      `whsec_${btoa("not-a-real-resend-webhook-secret")}`,
    CRON_SECRET: "r".repeat(32),
    RATE_LIMIT_KEY_SECRET: "l".repeat(32),
    ACCOUNT_DELETION_PEPPER: "p".repeat(32),
    BETTER_STACK_SOURCE_TOKEN: "better_stack_token_not_real",
    BETTER_STACK_INGESTING_HOST: "in.logs.betterstack.com",
  };
  for (const plan of [
    "INDIVIDUAL_MONTHLY",
    "INDIVIDUAL_YEARLY",
    "INDIVIDUAL_LIFETIME",
    "TEAM_MONTHLY",
    "TEAM_YEARLY",
    "TEAM_LIFETIME",
    "ORGANIZATION_MONTHLY",
    "ORGANIZATION_YEARLY",
    "ORGANIZATION_LIFETIME",
  ]) {
    environment[`STRIPE_PRICE_${plan}`] =
      `price_${plan.replaceAll("_", "")}`;
  }
  return environment;
}
