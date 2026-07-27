export interface BackupObjectInput {
  name: string;
  bytes: Uint8Array;
  recordCount: number;
  schemaVersion: string;
}

export interface BackupObjectManifest {
  name: string;
  sizeBytes: number;
  recordCount: number;
  schemaVersion: string;
  checksumSha256: string;
}

export interface BackupManifest {
  version: 1;
  backupId: string;
  createdAt: number;
  objects: BackupObjectManifest[];
  manifestChecksumSha256: string;
}

export interface AuthenticatedBackupManifest {
  manifest: BackupManifest;
  authentication: {
    version: 1;
    algorithm: "HMAC-SHA-256";
    keyId: string;
    tag: string;
  };
}

export interface EncryptedBackupObject {
  encryption: {
    version: 1;
    algorithm: "AES-256-GCM";
    keyId: string;
    nonceBase64Url: string;
    associatedData: {
      purpose: "gummyui-backup-object";
      backupId: string;
      name: string;
      recordCount: number;
      schemaVersion: string;
      plaintextSizeBytes: number;
      plaintextSha256: string;
    };
  };
  ciphertextBase64Url: string;
}

export interface BackupVerification {
  valid: boolean;
  errors: Array<{
    object: string;
    reason:
      | "manifest_checksum"
      | "missing"
      | "unexpected"
      | "size"
      | "record_count"
      | "schema_version"
      | "checksum";
  }>;
}

export async function createBackupManifest(input: {
  backupId: string;
  createdAt: number;
  objects: readonly BackupObjectInput[];
}): Promise<BackupManifest> {
  if (
    !input.backupId
    || !Number.isSafeInteger(input.createdAt)
    || !input.objects.length
  ) {
    throw new Error("Invalid backup manifest input");
  }
  const names = new Set<string>();
  const objects: BackupObjectManifest[] = [];
  for (const object of [...input.objects].sort((a, b) =>
    a.name.localeCompare(b.name))) {
    validateBackupObject(object);
    if (names.has(object.name)) {
      throw new Error(`Duplicate backup object ${object.name}`);
    }
    names.add(object.name);
    objects.push({
      name: object.name,
      sizeBytes: object.bytes.byteLength,
      recordCount: object.recordCount,
      schemaVersion: object.schemaVersion,
      checksumSha256: await sha256Hex(object.bytes),
    });
  }
  const unsigned = {
    version: 1 as const,
    backupId: input.backupId,
    createdAt: input.createdAt,
    objects,
  };
  return {
    ...unsigned,
    manifestChecksumSha256: await sha256Hex(
      new TextEncoder().encode(canonicalJson(unsigned)),
    ),
  };
}

export async function verifyBackupManifest(
  manifest: BackupManifest,
  restoredObjects: readonly BackupObjectInput[],
): Promise<BackupVerification> {
  const errors: BackupVerification["errors"] = [];
  const unsigned = {
    version: manifest.version,
    backupId: manifest.backupId,
    createdAt: manifest.createdAt,
    objects: manifest.objects,
  };
  const expectedManifestChecksum = await sha256Hex(
    new TextEncoder().encode(canonicalJson(unsigned)),
  );
  if (expectedManifestChecksum !== manifest.manifestChecksumSha256) {
    errors.push({ object: "manifest", reason: "manifest_checksum" });
  }

  const restored = new Map(
    restoredObjects.map((object) => [object.name, object] as const),
  );
  for (const expected of manifest.objects) {
    const actual = restored.get(expected.name);
    if (!actual) {
      errors.push({ object: expected.name, reason: "missing" });
      continue;
    }
    restored.delete(expected.name);
    if (actual.bytes.byteLength !== expected.sizeBytes) {
      errors.push({ object: expected.name, reason: "size" });
    }
    if (actual.recordCount !== expected.recordCount) {
      errors.push({ object: expected.name, reason: "record_count" });
    }
    if (actual.schemaVersion !== expected.schemaVersion) {
      errors.push({ object: expected.name, reason: "schema_version" });
    }
    if ((await sha256Hex(actual.bytes)) !== expected.checksumSha256) {
      errors.push({ object: expected.name, reason: "checksum" });
    }
  }
  for (const name of restored.keys()) {
    errors.push({ object: name, reason: "unexpected" });
  }
  return { valid: errors.length === 0, errors };
}

export async function authenticateBackupManifest(input: {
  manifest: BackupManifest;
  keyId: string;
  authenticationKey: string | Uint8Array;
}): Promise<AuthenticatedBackupManifest> {
  if (!input.keyId || input.keyId.length > 255) {
    throw new Error("Invalid backup authentication key identifier");
  }
  const authentication = {
    version: 1 as const,
    algorithm: "HMAC-SHA-256" as const,
    keyId: input.keyId,
  };
  const tag = await hmacSha256(
    new TextEncoder().encode(canonicalJson({
      purpose: "gummyui-backup-manifest",
      authentication,
      manifest: input.manifest,
    })),
    validateAuthenticationKey(input.authenticationKey),
  );
  return {
    manifest: structuredClone(input.manifest),
    authentication: {
      ...authentication,
      tag: encodeHex(tag),
    },
  };
}

export async function verifyAuthenticatedBackupManifest(input: {
  envelope: AuthenticatedBackupManifest;
  authenticationKey: string | Uint8Array;
}): Promise<boolean> {
  const { authentication, manifest } = input.envelope;
  if (
    authentication.version !== 1
    || authentication.algorithm !== "HMAC-SHA-256"
    || !authentication.keyId
  ) {
    return false;
  }
  let providedTag: Uint8Array;
  try {
    providedTag = decodeHex(authentication.tag);
  } catch {
    return false;
  }
  const expectedMessage = new TextEncoder().encode(canonicalJson({
    purpose: "gummyui-backup-manifest",
    authentication: {
      version: authentication.version,
      algorithm: authentication.algorithm,
      keyId: authentication.keyId,
    },
    manifest,
  }));
  try {
    return await verifyHmacSha256(
      expectedMessage,
      providedTag,
      validateAuthenticationKey(input.authenticationKey),
    );
  } catch {
    return false;
  }
}

export async function encryptBackupObject(input: {
  backupId: string;
  object: BackupObjectInput;
  keyId: string;
  encryptionKey: string | Uint8Array;
}): Promise<EncryptedBackupObject> {
  validateBackupObject(input.object);
  if (!input.backupId || !input.keyId || input.keyId.length > 255) {
    throw new Error("Invalid backup encryption binding");
  }
  const encryptionKey = validateEncryptionKey(input.encryptionKey);
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const associatedData = {
    purpose: "gummyui-backup-object" as const,
    backupId: input.backupId,
    name: input.object.name,
    recordCount: input.object.recordCount,
    schemaVersion: input.object.schemaVersion,
    plaintextSizeBytes: input.object.bytes.byteLength,
    plaintextSha256: await sha256Hex(input.object.bytes),
  };
  const key = await crypto.subtle.importKey(
    "raw",
    ownedArrayBuffer(encryptionKey),
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: ownedArrayBuffer(nonce),
        additionalData: new TextEncoder().encode(canonicalJson(associatedData)),
        tagLength: 128,
      },
      key,
      ownedArrayBuffer(input.object.bytes),
    ),
  );
  return {
    encryption: {
      version: 1,
      algorithm: "AES-256-GCM",
      keyId: input.keyId,
      nonceBase64Url: encodeBase64Url(nonce),
      associatedData,
    },
    ciphertextBase64Url: encodeBase64Url(ciphertext),
  };
}

export async function decryptBackupObject(input: {
  envelope: EncryptedBackupObject;
  encryptionKey: string | Uint8Array;
  expected: {
    backupId: string;
    keyId: string;
    name: string;
  };
}): Promise<BackupObjectInput> {
  try {
    const { encryption } = input.envelope;
    if (
      encryption.version !== 1
      || encryption.algorithm !== "AES-256-GCM"
      || encryption.keyId !== input.expected.keyId
      || encryption.associatedData.purpose !== "gummyui-backup-object"
      || encryption.associatedData.backupId !== input.expected.backupId
      || encryption.associatedData.name !== input.expected.name
    ) {
      throw new Error("Backup encryption binding mismatch");
    }
    const nonce = decodeBase64Url(encryption.nonceBase64Url);
    const ciphertext = decodeBase64Url(input.envelope.ciphertextBase64Url);
    if (nonce.byteLength !== 12 || ciphertext.byteLength < 16) {
      throw new Error("Invalid backup encryption envelope");
    }
    const key = await crypto.subtle.importKey(
      "raw",
      ownedArrayBuffer(validateEncryptionKey(input.encryptionKey)),
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"],
    );
    const plaintext = new Uint8Array(
      await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: ownedArrayBuffer(nonce),
          additionalData: new TextEncoder().encode(
            canonicalJson(encryption.associatedData),
          ),
          tagLength: 128,
        },
        key,
        ownedArrayBuffer(ciphertext),
      ),
    );
    if (
      plaintext.byteLength !== encryption.associatedData.plaintextSizeBytes
      || await sha256Hex(plaintext)
        !== encryption.associatedData.plaintextSha256
    ) {
      throw new Error("Backup plaintext evidence mismatch");
    }
    const object = {
      name: encryption.associatedData.name,
      bytes: plaintext,
      recordCount: encryption.associatedData.recordCount,
      schemaVersion: encryption.associatedData.schemaVersion,
    };
    validateBackupObject(object);
    return object;
  } catch {
    throw new Error("Backup object decryption failed");
  }
}

export interface ReconciliationResult {
  consistent: boolean;
  missingIds: string[];
  unexpectedIds: string[];
  mismatchedIds: string[];
}

export async function reconcileRecords<T>(
  expected: readonly T[],
  actual: readonly T[],
  idOf: (record: T) => string,
): Promise<ReconciliationResult> {
  const expectedMap = uniqueRecordMap(expected, idOf, "expected");
  const actualMap = uniqueRecordMap(actual, idOf, "actual");
  const missingIds: string[] = [];
  const mismatchedIds: string[] = [];

  for (const [id, expectedRecord] of expectedMap) {
    const actualRecord = actualMap.get(id);
    if (actualRecord === undefined) {
      missingIds.push(id);
      continue;
    }
    actualMap.delete(id);
    const [expectedHash, actualHash] = await Promise.all([
      sha256Hex(
        new TextEncoder().encode(canonicalJson(expectedRecord)),
      ),
      sha256Hex(new TextEncoder().encode(canonicalJson(actualRecord))),
    ]);
    if (expectedHash !== actualHash) mismatchedIds.push(id);
  }
  const unexpectedIds = [...actualMap.keys()];
  for (const list of [missingIds, unexpectedIds, mismatchedIds]) list.sort();
  return {
    consistent:
      missingIds.length === 0
      && unexpectedIds.length === 0
      && mismatchedIds.length === 0,
    missingIds,
    unexpectedIds,
    mismatchedIds,
  };
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value, new WeakSet<object>()));
}

function canonicalize(value: unknown, seen: WeakSet<object>): unknown {
  if (
    value === null
    || typeof value === "string"
    || typeof value === "boolean"
  ) {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Non-finite backup value");
    return value;
  }
  if (typeof value === "undefined") return null;
  if (typeof value !== "object") {
    throw new Error("Unsupported backup value");
  }
  if (seen.has(value)) throw new Error("Cyclic backup value");
  seen.add(value);
  if (Array.isArray(value)) {
    const result = value.map((entry) => canonicalize(entry, seen));
    seen.delete(value);
    return result;
  }
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    const entry = (value as Record<string, unknown>)[key];
    if (entry !== undefined) result[key] = canonicalize(entry, seen);
  }
  seen.delete(value);
  return result;
}

function uniqueRecordMap<T>(
  records: readonly T[],
  idOf: (record: T) => string,
  label: string,
): Map<string, T> {
  const result = new Map<string, T>();
  for (const record of records) {
    const id = idOf(record);
    if (!id || result.has(id)) {
      throw new Error(`Duplicate or empty ${label} reconciliation id`);
    }
    result.set(id, record);
  }
  return result;
}

function validateBackupObject(object: BackupObjectInput): void {
  if (
    !object.name
    || object.name.length > 255
    || object.name.includes("..")
    || object.name.startsWith("/")
    || !Number.isSafeInteger(object.recordCount)
    || object.recordCount < 0
    || !object.schemaVersion
  ) {
    throw new Error("Invalid backup object");
  }
}

async function sha256Hex(value: Uint8Array): Promise<string> {
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", ownedArrayBuffer(value)),
  );
  return [...digest]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256(
  value: Uint8Array,
  keyBytes: Uint8Array,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    ownedArrayBuffer(keyBytes),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(
    await crypto.subtle.sign("HMAC", key, ownedArrayBuffer(value)),
  );
}

async function verifyHmacSha256(
  value: Uint8Array,
  tag: Uint8Array,
  keyBytes: Uint8Array,
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    ownedArrayBuffer(keyBytes),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    "HMAC",
    key,
    ownedArrayBuffer(tag),
    ownedArrayBuffer(value),
  );
}

function validateAuthenticationKey(
  key: string | Uint8Array,
): Uint8Array {
  const bytes = typeof key === "string" ? new TextEncoder().encode(key) : key;
  if (bytes.byteLength < 32) {
    throw new Error("Backup authentication key must contain at least 256 bits");
  }
  return bytes;
}

function validateEncryptionKey(
  key: string | Uint8Array,
): Uint8Array {
  const bytes = typeof key === "string" ? new TextEncoder().encode(key) : key;
  if (bytes.byteLength !== 32) {
    throw new Error("Backup encryption key must contain exactly 256 bits");
  }
  return bytes;
}

function encodeHex(value: Uint8Array): string {
  return [...value]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function decodeHex(value: string): Uint8Array {
  if (!/^[a-f0-9]{64}$/iu.test(value)) {
    throw new Error("Invalid backup authentication tag");
  }
  return Uint8Array.from(
    value.match(/.{2}/gu) ?? [],
    (pair) => Number.parseInt(pair, 16),
  );
}

function encodeBase64Url(value: Uint8Array): string {
  let binary = "";
  for (let offset = 0; offset < value.byteLength; offset += 0x8000) {
    binary += String.fromCharCode(...value.subarray(offset, offset + 0x8000));
  }
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function decodeBase64Url(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) {
    throw new Error("Invalid base64url value");
  }
  const padded = value
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
import { ownedArrayBuffer } from "./crypto";
