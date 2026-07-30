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

export type StripeSandboxAttestationPhase =
  | "identity"
  | "access-granted"
  | "access-revoked";

export interface StripeSandboxAttestationInput {
  challenge: string;
  phase: StripeSandboxAttestationPhase;
  accountId: string;
  workspaceId: string;
  checkoutSessionIds?: [string, string];
}

interface StripeSandboxAttestationProbe {
  attest(input: {
    restoreSecret: string;
    phase: StripeSandboxAttestationPhase;
    accountId: string;
    workspaceId: string;
    checkoutSessionIds?: [string, string];
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
  accessGranted?: true;
  accessRevoked?: true;
}> {
  assertInput(input);
  const status = asRecord(await probe.attest({
    restoreSecret: config.restoreSecret,
    phase: input.phase,
    accountId: input.accountId,
    workspaceId: input.workspaceId,
    ...(input.checkoutSessionIds
      ? { checkoutSessionIds: input.checkoutSessionIds }
      : {}),
  }));
  if (
    status.targetClass !== "isolated-test"
    || typeof status.schemaVersion !== "string"
    || typeof status.tableCount !== "number"
    || status.tableCount < 20
    || status.identityReady !== true
    || status.phase !== input.phase
  ) {
    throw new Error("Stripe sandbox Convex target is not isolated");
  }

  return {
    challenge: input.challenge,
    targetClass: "isolated-test",
    targetFingerprint: config.targetFingerprint,
    identityReady: true,
    ...(input.phase === "access-granted"
      ? status.accessGranted === true
        && status.exactPurchaseCount === 2
        && status.exactLicenceCount === 6
        && status.exactEntitlementCount === 6
        && status.exactSeatCount === 6
        && status.protectedReleaseAvailable === true
        && status.protectedReleaseAuthorized === true
          ? { accessGranted: true as const }
          : failAttestation("Stripe sandbox access was not granted")
      : {}),
    ...(input.phase === "access-revoked"
      ? status.accessRevoked === true
        && status.exactPurchaseCount === 2
        && status.exactLicenceCount === 6
        && status.exactEntitlementCount === 6
        && status.exactSeatCount === 6
        && status.openGrantCount === 0
          ? { accessRevoked: true as const }
          : failAttestation("Stripe sandbox access was not revoked")
      : {}),
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
    || !["identity", "access-granted", "access-revoked"].includes(input.phase)
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
    attest: (input) =>
      client.query(anyApi.backup.stripeSandboxAttestation, input),
  };
}

function failAttestation(message: string): never {
  throw new Error(message);
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
