import type {
  AccountId,
  DownloadGrantId,
  EntitlementId,
  ReleaseId,
  WorkspaceId,
} from "./model";
import { ownedArrayBuffer } from "./crypto";

const TOKEN_VERSION = 1;
const MAX_GRANT_TTL_MS = 15 * 60 * 1000;
const MAX_TOKEN_LENGTH = 4096;

export interface GrantPayload {
  v: 1;
  grantId: DownloadGrantId;
  nonce: string;
  accountId: AccountId;
  workspaceId: WorkspaceId;
  releaseId: ReleaseId;
  entitlementId: EntitlementId;
  issuedAt: number;
  expiresAt: number;
  fingerprintHash?: string;
}

export interface DownloadGrantRecord {
  grantId: DownloadGrantId;
  nonceHash: string;
  accountId: AccountId;
  workspaceId: WorkspaceId;
  releaseId: ReleaseId;
  entitlementId: EntitlementId;
  fingerprintHash?: string;
  createdAt: number;
  expiresAt: number;
  consumedAt: number | null;
  revokedAt: number | null;
}

export interface DownloadGrantStore {
  register(record: DownloadGrantRecord): Promise<void>;
  consume(
    nonceHash: string,
    consumedAt: number,
  ): Promise<"consumed" | "missing" | "expired" | "revoked" | "replayed">;
}

export interface CreateDownloadGrantInput {
  grantId: DownloadGrantId;
  accountId: AccountId;
  workspaceId: WorkspaceId;
  releaseId: ReleaseId;
  entitlementId: EntitlementId;
  fingerprintHash?: string;
  now: number;
  ttlMs: number;
  secret: string | Uint8Array;
  store: DownloadGrantStore;
  nonceSource?: () => Uint8Array;
}

export interface ExpectedGrantBinding {
  accountId: AccountId;
  workspaceId: WorkspaceId;
  releaseId: ReleaseId;
  entitlementId: EntitlementId;
  fingerprintHash?: string;
}

export type GrantConsumptionResult =
  | { ok: true; payload: GrantPayload }
  | {
      ok: false;
      reason:
        | "invalid"
        | "expired"
        | "binding_mismatch"
        | "missing"
        | "revoked"
        | "replayed";
    };

export type GrantVerificationResult =
  | { ok: true; payload: GrantPayload; nonceHash: string }
  | { ok: false; reason: "invalid" | "expired" };

export async function createDownloadGrant(
  input: CreateDownloadGrantInput,
): Promise<{
  token: string;
  path: `/downloads/${string}`;
  record: DownloadGrantRecord;
}> {
  if (
    !Number.isSafeInteger(input.now)
    || !Number.isSafeInteger(input.ttlMs)
    || input.ttlMs <= 0
    || input.ttlMs > MAX_GRANT_TTL_MS
  ) {
    throw new Error("Download grant lifetime is invalid");
  }
  const secret = validateSecret(input.secret);
  const nonceBytes = (input.nonceSource ?? secureNonce)();
  if (nonceBytes.byteLength < 16) {
    throw new Error("Download grant nonce must contain at least 128 bits");
  }
  const nonce = toBase64Url(nonceBytes);
  const expiresAt = input.now + input.ttlMs;
  const payload: GrantPayload = {
    v: TOKEN_VERSION,
    grantId: input.grantId,
    nonce,
    accountId: input.accountId,
    workspaceId: input.workspaceId,
    releaseId: input.releaseId,
    entitlementId: input.entitlementId,
    issuedAt: input.now,
    expiresAt,
    ...(input.fingerprintHash
      ? { fingerprintHash: input.fingerprintHash }
      : {}),
  };
  const encodedPayload = toBase64Url(
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const signature = await sign(encodedPayload, secret);
  const token = `${encodedPayload}.${toBase64Url(signature)}`;
  const record: DownloadGrantRecord = {
    grantId: input.grantId,
    nonceHash: await sha256Hex(nonce),
    accountId: input.accountId,
    workspaceId: input.workspaceId,
    releaseId: input.releaseId,
    entitlementId: input.entitlementId,
    ...(input.fingerprintHash
      ? { fingerprintHash: input.fingerprintHash }
      : {}),
    createdAt: input.now,
    expiresAt,
    consumedAt: null,
    revokedAt: null,
  };
  await input.store.register(record);
  return {
    token,
    path: `/downloads/${token}`,
    record,
  };
}

export async function verifyAndConsumeDownloadGrant(input: {
  token: string;
  expected: ExpectedGrantBinding;
  now: number;
  secret: string | Uint8Array;
  store: DownloadGrantStore;
}): Promise<GrantConsumptionResult> {
  const verification = await verifyDownloadGrantToken(input);
  if (!verification.ok) return verification;
  const { payload } = verification;
  if (
    payload.accountId !== input.expected.accountId
    || payload.workspaceId !== input.expected.workspaceId
    || payload.releaseId !== input.expected.releaseId
    || payload.entitlementId !== input.expected.entitlementId
    || payload.fingerprintHash !== input.expected.fingerprintHash
  ) {
    return { ok: false, reason: "binding_mismatch" };
  }

  const consumed = await input.store.consume(
    verification.nonceHash,
    input.now,
  );
  if (consumed !== "consumed") {
    return {
      ok: false,
      reason: consumed === "expired" ? "expired" : consumed,
    };
  }
  return { ok: true, payload };
}

export async function verifyDownloadGrantToken(input: {
  token: string;
  now: number;
  secret: string | Uint8Array;
}): Promise<GrantVerificationResult> {
  if (
    input.token.length === 0
    || input.token.length > MAX_TOKEN_LENGTH
    || !Number.isSafeInteger(input.now)
  ) {
    return { ok: false, reason: "invalid" };
  }
  const parts = input.token.split(".");
  if (parts.length !== 2) {
    return { ok: false, reason: "invalid" };
  }

  let payload: GrantPayload;
  try {
    const [encodedPayload, encodedSignature] = parts as [string, string];
    const verified = await verifySignature(
      encodedPayload,
      fromBase64Url(encodedSignature),
      validateSecret(input.secret),
    );
    if (!verified) {
      return { ok: false, reason: "invalid" };
    }
    payload = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(
        fromBase64Url(encodedPayload),
      ),
    ) as GrantPayload;
  } catch {
    return { ok: false, reason: "invalid" };
  }

  if (!isGrantPayload(payload)) {
    return { ok: false, reason: "invalid" };
  }
  if (
    payload.issuedAt > input.now
    || payload.expiresAt - payload.issuedAt > MAX_GRANT_TTL_MS
  ) {
    return { ok: false, reason: "invalid" };
  }
  if (payload.expiresAt <= input.now) {
    return {
      ok: false,
      reason: "expired",
    };
  }
  return {
    ok: true,
    payload,
    nonceHash: await sha256Hex(payload.nonce),
  };
}

export class InMemoryDownloadGrantStore implements DownloadGrantStore {
  private readonly grants = new Map<string, DownloadGrantRecord>();

  async register(record: DownloadGrantRecord): Promise<void> {
    if (this.grants.has(record.nonceHash)) {
      throw new Error("Duplicate download grant nonce");
    }
    this.grants.set(record.nonceHash, structuredClone(record));
  }

  async consume(
    nonceHash: string,
    consumedAt: number,
  ): Promise<"consumed" | "missing" | "expired" | "revoked" | "replayed"> {
    const record = this.grants.get(nonceHash);
    if (!record) return "missing";
    if (record.revokedAt !== null) return "revoked";
    if (record.consumedAt !== null) return "replayed";
    if (record.expiresAt <= consumedAt) return "expired";
    record.consumedAt = consumedAt;
    return "consumed";
  }

  revoke(nonceHash: string, revokedAt: number): void {
    const record = this.grants.get(nonceHash);
    if (record) record.revokedAt = revokedAt;
  }
}

async function sign(payload: string, secret: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    ownedArrayBuffer(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      key,
      ownedArrayBuffer(new TextEncoder().encode(payload)),
    ),
  );
}

async function verifySignature(
  payload: string,
  signature: Uint8Array,
  secret: Uint8Array,
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    ownedArrayBuffer(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    "HMAC",
    key,
    ownedArrayBuffer(signature),
    ownedArrayBuffer(new TextEncoder().encode(payload)),
  );
}

function validateSecret(secret: string | Uint8Array): Uint8Array {
  const bytes =
    typeof secret === "string" ? new TextEncoder().encode(secret) : secret;
  if (bytes.byteLength < 32) {
    throw new Error("Download grant secret must contain at least 256 bits");
  }
  return bytes;
}

function secureNonce(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(24));
}

function isGrantPayload(value: unknown): value is GrantPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<GrantPayload>;
  return (
    payload.v === TOKEN_VERSION
    && typeof payload.grantId === "string"
    && typeof payload.nonce === "string"
    && typeof payload.accountId === "string"
    && typeof payload.workspaceId === "string"
    && typeof payload.releaseId === "string"
    && typeof payload.entitlementId === "string"
    && Number.isSafeInteger(payload.issuedAt)
    && Number.isSafeInteger(payload.expiresAt)
    && payload.expiresAt! > payload.issuedAt!
    && (payload.fingerprintHash === undefined
      || typeof payload.fingerprintHash === "string")
  );
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function fromBase64Url(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) {
    throw new Error("Invalid base64url");
  }
  const padded = value.replaceAll("-", "+").replaceAll("_", "/")
    + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function sha256Hex(value: string): Promise<string> {
  const digest = new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      ownedArrayBuffer(new TextEncoder().encode(value)),
    ),
  );
  return [...digest]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
