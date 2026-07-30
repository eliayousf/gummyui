import "server-only";

import { createHash } from "node:crypto";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";

const SANDBOX_ACCOUNT_ID =
  /^account:(?:sandbox|restore-query-proof-)[A-Za-z0-9._:-]{4,240}$/u;
const SANDBOX_WORKSPACE_ID =
  /^workspace:(?:sandbox|restore-query-proof-)[A-Za-z0-9._:-]{4,240}$/u;
const CHALLENGE = /^[a-f0-9]{32,128}$/u;

export interface StripeSandboxAttestationConfig {
  targetUrl: string;
  targetFingerprint: string;
  targetServerSecret: string;
  restoreSecret: string;
}

export type StripeSandboxAttestationPhase = "identity" | "access-revoked";

export interface StripeSandboxAttestationInput {
  challenge: string;
  phase: StripeSandboxAttestationPhase;
  accountId: string;
  workspaceId: string;
  checkoutSessionIds?: [string, string];
}

interface StripeSandboxAttestationProbe {
  restoreStatus(restoreSecret: string): Promise<unknown>;
  accountSection(input: {
    serverSecret: string;
    route: string;
    accountId: string;
    workspaceId: string;
  }): Promise<unknown>;
}

export function readStripeSandboxAttestationConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): StripeSandboxAttestationConfig | null {
  const enabled = environment.STRIPE_SANDBOX_ATTESTATION_ENABLED?.trim();
  const configured = [
    environment.BACKUP_RESTORE_TARGET_CONVEX_URL,
    environment.BACKUP_RESTORE_TARGET_SERVER_SECRET,
    environment.BACKUP_RESTORE_SECRET,
    environment.BACKUP_RESTORE_TARGET_CLASS,
  ].some((value) => Boolean(value?.trim()));
  if (enabled !== "true") {
    if (configured && enabled && enabled !== "false") {
      throw new Error("Invalid Stripe sandbox attestation configuration");
    }
    return null;
  }
  if (environment.NODE_ENV === "production") {
    throw new Error("Stripe sandbox attestation is unavailable in production");
  }

  const origin = normalizeLoopbackOrigin(environment.GUMMYUI_ORIGIN);
  const targetUrl = normalizeConvexUrl(
    environment.BACKUP_RESTORE_TARGET_CONVEX_URL,
  );
  const appConvexUrl = normalizeConvexUrl(
    environment.NEXT_PUBLIC_CONVEX_URL,
  );
  const targetServerSecret =
    environment.BACKUP_RESTORE_TARGET_SERVER_SECRET?.trim();
  const appServerSecret = environment.CONVEX_SERVER_SECRET?.trim();
  const restoreSecret = environment.BACKUP_RESTORE_SECRET?.trim();
  const stripeRuntimeKey = environment.STRIPE_RESTRICTED_KEY?.trim();
  if (
    !origin
    || !targetUrl
    || appConvexUrl !== targetUrl
    || !targetServerSecret
    || targetServerSecret.length < 32
    || appServerSecret !== targetServerSecret
    || !restoreSecret
    || restoreSecret.length < 32
    || restoreSecret === targetServerSecret
    || environment.BACKUP_RESTORE_TARGET_CLASS?.trim() !== "isolated-test"
    || !stripeRuntimeKey?.startsWith("rk_test_")
    || environment.STRIPE_WEBHOOK_ENABLED !== "true"
    || environment.STRIPE_CHECKOUT_ENABLED !== "false"
  ) {
    throw new Error("Invalid Stripe sandbox attestation configuration");
  }
  return {
    targetUrl,
    targetFingerprint: createHash("sha256").update(targetUrl).digest("hex"),
    targetServerSecret,
    restoreSecret,
  };
}

export async function attestStripeSandboxApplication(
  config: StripeSandboxAttestationConfig,
  input: StripeSandboxAttestationInput,
  probe: StripeSandboxAttestationProbe = convexProbe(config),
): Promise<{
  challenge: string;
  targetClass: "isolated-test";
  targetFingerprint: string;
  identityReady: true;
  accessRevoked?: true;
}> {
  assertInput(input);
  const status = asRecord(await probe.restoreStatus(config.restoreSecret));
  if (
    status.targetClass !== "isolated-test"
    || typeof status.schemaVersion !== "string"
    || typeof status.tableCount !== "number"
    || status.tableCount < 20
  ) {
    throw new Error("Stripe sandbox Convex target is not isolated");
  }

  const access = {
    serverSecret: config.targetServerSecret,
    accountId: input.accountId,
    workspaceId: input.workspaceId,
  };
  const security = await probe.accountSection({
    ...access,
    route: "security",
  });
  if (!Array.isArray(security) || security.length < 3) {
    throw new Error("Stripe sandbox identity is unavailable");
  }

  if (input.phase === "access-revoked") {
    const [purchases, licences, downloads] = await Promise.all([
      probe.accountSection({ ...access, route: "purchases" }),
      probe.accountSection({ ...access, route: "licences" }),
      probe.accountSection({ ...access, route: "downloads" }),
    ]);
    const expectedPurchases = input.checkoutSessionIds!.map(
      (checkoutSessionId) => `purchase:stripe:${checkoutSessionId}`,
    );
    const purchaseRows = Array.isArray(purchases)
      ? purchases.map(asRecord)
      : [];
    const lifetimePurchase = purchaseRows.find(
      (entry) => entry.id === expectedPurchases[1],
    );
    if (
      !expectedPurchases.every((purchaseId) =>
        purchaseRows.some((entry) => entry.id === purchaseId))
      || typeof lifetimePurchase?.detail !== "string"
      || !lifetimePurchase.detail.startsWith("Refunded ·")
      || !Array.isArray(licences)
      || licences.length === 0
      || licences.some((entry) =>
        asRecord(entry).value === "Active"
        || asRecord(entry).status === "active")
      || !Array.isArray(downloads)
      || downloads.length !== 0
    ) {
      throw new Error("Stripe sandbox access was not revoked");
    }
    return {
      challenge: input.challenge,
      targetClass: "isolated-test",
      targetFingerprint: config.targetFingerprint,
      identityReady: true,
      accessRevoked: true,
    };
  }

  return {
    challenge: input.challenge,
    targetClass: "isolated-test",
    targetFingerprint: config.targetFingerprint,
    identityReady: true,
  };
}

export function isStripeSandboxIdentity(
  accountId: string,
  workspaceId: string,
): boolean {
  return SANDBOX_ACCOUNT_ID.test(accountId)
    && SANDBOX_WORKSPACE_ID.test(workspaceId);
}

function assertInput(input: StripeSandboxAttestationInput): void {
  const checkoutSessionIdsValid = input.phase === "identity"
    ? input.checkoutSessionIds === undefined
    : Array.isArray(input.checkoutSessionIds)
      && input.checkoutSessionIds.length === 2
      && input.checkoutSessionIds.every((value) =>
        /^cs_test_[A-Za-z0-9_]+$/u.test(value));
  if (
    !CHALLENGE.test(input.challenge)
    || !["identity", "access-revoked"].includes(input.phase)
    || !isStripeSandboxIdentity(input.accountId, input.workspaceId)
    || !checkoutSessionIdsValid
  ) {
    throw new Error("Invalid Stripe sandbox attestation input");
  }
}

function convexProbe(
  config: StripeSandboxAttestationConfig,
): StripeSandboxAttestationProbe {
  const client = new ConvexHttpClient(config.targetUrl, { logger: false });
  return {
    restoreStatus: (restoreSecret) =>
      client.query(anyApi.backup.restoreStatus, { restoreSecret }),
    accountSection: (input) =>
      client.mutation(anyApi.commerce.execute, {
        serverSecret: input.serverSecret,
        operation: "account.section",
        input: {
          route: input.route,
          access: {
            accountId: input.accountId,
            workspaceId: input.workspaceId,
            role: "owner",
          },
          now: Date.now(),
        },
      }),
  };
}

function normalizeLoopbackOrigin(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/\.+$/u, "");
    if (
      (hostname !== "localhost"
        && hostname !== "127.0.0.1"
        && hostname !== "[::1]")
      || url.protocol !== "http:"
      || url.username
      || url.password
      || url.pathname !== "/"
      || url.search
      || url.hash
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function normalizeConvexUrl(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:"
      || !url.hostname.endsWith(".convex.cloud")
      || url.username
      || url.password
      || url.pathname !== "/"
      || url.search
      || url.hash
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}
