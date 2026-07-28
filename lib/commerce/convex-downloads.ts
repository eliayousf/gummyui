import "server-only";
import { executeConvex } from "../../db";
import {
  createDownloadGrant,
  type DownloadGrantRecord,
  type DownloadGrantStore,
  verifyDownloadGrantToken,
} from "./grants";
import {
  opaqueId,
  type AccountId,
  type EntitlementId,
  type ReleaseId,
  type WorkspaceId,
  type WorkspaceRole,
} from "./model";

export interface DownloadGrantConfig {
  secret: string;
  ttlMs: number;
  applicationOrigin: string;
}

export interface AuthorizedRelease {
  releaseId: ReleaseId;
  entitlementId: EntitlementId;
  productRef: string;
  version: string;
}

export interface ConsumableReleaseObject extends AuthorizedRelease {
  storageKey: string;
  checksumSha256: string;
  sizeBytes: number;
}

export function readDownloadGrantConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): DownloadGrantConfig | null {
  const secret = environment.DOWNLOAD_GRANT_SECRET?.trim();
  const originValue = environment.GUMMYUI_ORIGIN?.trim();
  const ttlValue = environment.DOWNLOAD_GRANT_TTL_SECONDS?.trim() ?? "300";
  if (!secret && !originValue) return null;
  const ttlSeconds = Number(ttlValue);
  if (
    !secret
    || secret.length < 32
    || !originValue
    || !Number.isSafeInteger(ttlSeconds)
    || ttlSeconds < 60
    || ttlSeconds > 900
  ) {
    throw new Error("Invalid protected download configuration");
  }
  const origin = new URL(originValue);
  const local =
    origin.hostname === "localhost" || origin.hostname === "127.0.0.1";
  if (
    (origin.protocol !== "https:" && !(local && origin.protocol === "http:"))
    || origin.pathname !== "/"
    || origin.search
    || origin.hash
    || origin.username
    || origin.password
  ) {
    throw new Error("Invalid protected download origin");
  }
  return {
    secret,
    ttlMs: ttlSeconds * 1_000,
    applicationOrigin: origin.origin,
  };
}

export class ConvexDownloadGrantStore implements DownloadGrantStore {
  async register(record: DownloadGrantRecord): Promise<void> {
    await executeConvex("downloads.register", record);
  }

  async consume(): Promise<
    "consumed" | "missing" | "expired" | "revoked" | "replayed"
  > {
    throw new Error("Use atomic protected download consumption");
  }
}

export async function findAuthorizedRelease(input: {
  accountId: AccountId;
  workspaceId: WorkspaceId;
  role: WorkspaceRole;
  releaseId: ReleaseId;
  now: number;
}): Promise<AuthorizedRelease | null> {
  const result = await executeConvex<Record<string, unknown> | null>(
    "downloads.find-authorized",
    input,
  );
  return result ? readAuthorizedRelease(result) : null;
}

export async function issueAuthorizedDownloadGrant(input: {
  accountId: AccountId;
  workspaceId: WorkspaceId;
  role: WorkspaceRole;
  releaseId: ReleaseId;
  now: number;
  config: DownloadGrantConfig;
}): Promise<{ path: `/downloads/${string}` } | null> {
  const release = await findAuthorizedRelease(input);
  if (!release) return null;
  const grant = await createDownloadGrant({
    grantId: opaqueId(
      `download-grant:${crypto.randomUUID()}`,
      "download-grant",
    ),
    accountId: input.accountId,
    workspaceId: input.workspaceId,
    releaseId: release.releaseId,
    entitlementId: release.entitlementId,
    now: input.now,
    ttlMs: input.config.ttlMs,
    secret: input.config.secret,
    store: new ConvexDownloadGrantStore(),
  });
  return { path: grant.path };
}

export async function consumeAuthorizedRelease(input: {
  token: string;
  accountId: AccountId;
  workspaceId: WorkspaceId;
  role: WorkspaceRole;
  sessionExpiresAt: number;
  now: number;
  secret: string;
}): Promise<ConsumableReleaseObject | null> {
  const verified = await verifyDownloadGrantToken({
    token: input.token,
    now: input.now,
    secret: input.secret,
  });
  if (
    !verified.ok
    || verified.payload.accountId !== input.accountId
    || verified.payload.workspaceId !== input.workspaceId
    || input.sessionExpiresAt <= input.now
  ) {
    return null;
  }
  const result = await executeConvex<Record<string, unknown> | null>(
    "downloads.consume",
    {
      accountId: input.accountId,
      workspaceId: input.workspaceId,
      role: input.role,
      releaseId: verified.payload.releaseId,
      entitlementId: verified.payload.entitlementId,
      nonceHash: verified.nonceHash,
      now: input.now,
    },
  );
  if (!result) return null;
  const release = readAuthorizedRelease(result);
  const storageKey = requireString(result, "storageKey");
  const checksumSha256 = requireString(result, "checksumSha256");
  const sizeBytes = result.sizeBytes;
  if (
    !safeStorageKey(storageKey)
    || !/^[a-f0-9]{64}$/u.test(checksumSha256)
    || typeof sizeBytes !== "number"
    || !Number.isSafeInteger(sizeBytes)
    || sizeBytes < 1
  ) {
    throw new Error("Invalid protected release object");
  }
  return { ...release, storageKey, checksumSha256, sizeBytes };
}

function readAuthorizedRelease(
  value: Record<string, unknown>,
): AuthorizedRelease {
  const releaseId = requireString(value, "releaseId");
  const entitlementId = requireString(value, "entitlementId");
  const productRef = requireString(value, "productRef");
  const version = requireString(value, "version");
  if (!/^[a-z0-9][a-z0-9-]{2,100}$/u.test(productRef)) {
    throw new Error("Invalid release product reference");
  }
  if (!/^[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z0-9.-]+)?$/u.test(version)) {
    throw new Error("Invalid release version");
  }
  return {
    releaseId: opaqueId(releaseId, "release"),
    entitlementId: opaqueId(entitlementId, "entitlement"),
    productRef,
    version,
  };
}

function requireString(
  value: Record<string, unknown>,
  key: string,
): string {
  const result = value[key];
  if (typeof result !== "string" || result.length === 0) {
    throw new Error("Invalid protected release response");
  }
  return result;
}

function safeStorageKey(value: string): boolean {
  return (
    value.length >= 3
    && value.length <= 512
    && !value.startsWith("/")
    && !value.includes("..")
    && !/[\u0000-\u001f\\]/u.test(value)
  );
}
