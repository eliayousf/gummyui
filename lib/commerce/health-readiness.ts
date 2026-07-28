import "server-only";
import { executeConvex, readConvexConfig } from "../../db";
import { readBackblazeReleaseConfig } from "./backblaze-downloads";
import { readDownloadGrantConfig } from "./convex-downloads";
import { readBetterStackLogConfig } from "./operational-logging";
import { readPrivacyDeletionJobConfig } from "./privacy-operations";
import { readResendOutboxConfig } from "./resend-outbox";
import { readResendWebhookConfig } from "./resend-webhook";
import { readStripeCheckoutWebhookConfig } from "./stripe-managed-payments";
import { readWorkOSIdentityConfig } from "./workos-identity";
import { readWorkOSWebhookConfig } from "./workos-webhook";

const PROBE_TIMEOUT_MS = 2_500;

export interface CommerceHealthReadiness {
  mode: "enabled" | "disabled";
  readiness: "ready" | "unavailable" | "not_required";
}

export async function evaluateCommerceHealth(
  environment: Readonly<Record<string, string | undefined>> = process.env,
  probe: () => Promise<unknown> = convexReadinessProbe,
): Promise<CommerceHealthReadiness> {
  const enabled = environment.STRIPE_CHECKOUT_ENABLED === "true";
  const forced = environment.HEALTH_DEPENDENCY_CHECKS_ENABLED === "true";
  if (!enabled && !forced) {
    return { mode: "disabled", readiness: "not_required" };
  }
  if (!configurationReady(environment)) {
    return {
      mode: enabled ? "enabled" : "disabled",
      readiness: "unavailable",
    };
  }
  try {
    const result = await withTimeout(probe(), PROBE_TIMEOUT_MS);
    if (
      !result
      || typeof result !== "object"
      || (result as { ok?: unknown }).ok !== true
    ) {
      throw new Error("Invalid readiness response");
    }
    return {
      mode: enabled ? "enabled" : "disabled",
      readiness: "ready",
    };
  } catch {
    return {
      mode: enabled ? "enabled" : "disabled",
      readiness: "unavailable",
    };
  }
}

function configurationReady(
  environment: Readonly<Record<string, string | undefined>>,
): boolean {
  try {
    const cronSecret = environment.CRON_SECRET?.trim();
    const rateLimitSecret = environment.RATE_LIMIT_KEY_SECRET?.trim();
    return environment.STRIPE_WEBHOOK_ENABLED === "true"
      && environment.WORKOS_WEBHOOK_ENABLED === "true"
      && environment.RESEND_WEBHOOK_ENABLED === "true"
      && Boolean(cronSecret && cronSecret.length >= 32)
      && Boolean(rateLimitSecret && rateLimitSecret.length >= 32)
      && Boolean(readConvexConfig(environment))
      && Boolean(readWorkOSIdentityConfig(environment))
      && Boolean(readWorkOSWebhookConfig(environment))
      && Boolean(readStripeCheckoutWebhookConfig(environment))
      && Boolean(readDownloadGrantConfig(environment))
      && Boolean(readBackblazeReleaseConfig(environment))
      && Boolean(readResendOutboxConfig(environment))
      && Boolean(readResendWebhookConfig(environment))
      && Boolean(readPrivacyDeletionJobConfig(environment))
      && Boolean(readBetterStackLogConfig(environment));
  } catch {
    return false;
  }
}

async function convexReadinessProbe(): Promise<unknown> {
  return executeConvex("health.readiness", { now: Date.now() });
}

async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Dependency readiness timed out")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
