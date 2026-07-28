import "server-only";
import {
  GetObjectCommand,
  ListObjectsV2Command,
  ObjectLockMode,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { readConvexConfig } from "../../db";
import {
  authenticateBackupManifest,
  canonicalJson,
  createBackupManifest,
  decryptBackupObject,
  encryptBackupObject,
  type AuthenticatedBackupManifest,
  type BackupObjectInput,
  type EncryptedBackupObject,
  verifyAuthenticatedBackupManifest,
  verifyBackupManifest,
} from "./backup";
import {
  COMMERCE_BACKUP_SCHEMA_VERSION,
  COMMERCE_BACKUP_TABLES,
  type CommerceBackupTable,
} from "./backup-tables";
import { ownedArrayBuffer } from "./crypto";

const exportTableReference = makeFunctionReference<
  "query",
  { serverSecret: string; table: string },
  {
    table: string;
    schemaVersion: string;
    records: unknown[];
  }
>("backup:exportTable");

const restoreStatusReference = makeFunctionReference<
  "query",
  { restoreSecret: string },
  {
    schemaVersion: string;
    tableCount: number;
    nonEmptyTableCount: number;
    empty: boolean;
    targetClass: string;
  }
>("backup:restoreStatus");

const restoreTableReference = makeFunctionReference<
  "mutation",
  {
    restoreSecret: string;
    backupId: string;
    table: string;
    schemaVersion: string;
    records: unknown[];
    completedTables: string[];
  },
  number
>("backup:restoreTable");

const MANIFEST_NAME = "manifest.json";
const RESTORE_CONFIRMATION = "RESTORE_TO_EMPTY_ISOLATED_TEST_ONLY";

export interface OperationalBackupConfig {
  endpoint: string;
  region: string;
  bucket: string;
  keyId: string;
  applicationKey: string;
  prefix: string;
  retentionDays: number;
  encryptionKeyId: string;
  encryptionKey: Uint8Array;
  authenticationKeyId: string;
  authenticationKey: Uint8Array;
}

export interface BackupArchiveStore {
  put(input: {
    key: string;
    bytes: Uint8Array;
    contentType: string;
    metadata: Readonly<Record<string, string>>;
    retainUntil: Date;
  }): Promise<void>;
  get(key: string): Promise<Uint8Array>;
  latestManifestKey(): Promise<string | null>;
}

export interface BackupSnapshotSource {
  exportTable(table: CommerceBackupTable): Promise<BackupObjectInput>;
}

export interface OperationalBackupEvidence {
  backupId: string;
  createdAt: number;
  tableCount: number;
  recordCount: number;
  manifestKey: string;
  verified: true;
}

export interface OperationalRestoreProofConfig {
  targetUrl: string;
  targetServerSecret: string;
  restoreSecret: string;
  targetClass: "isolated-test";
}

export interface RestoreTargetStatus {
  schemaVersion: string;
  tableCount: number;
  nonEmptyTableCount: number;
  empty: boolean;
  targetClass: string;
}

export interface BackupRestoreTarget extends BackupSnapshotSource {
  inspect(): Promise<RestoreTargetStatus>;
  restoreTable(input: {
    backupId: string;
    table: CommerceBackupTable;
    schemaVersion: string;
    records: unknown[];
    completedTables: CommerceBackupTable[];
  }): Promise<number>;
}

export interface OperationalRestoreProofEvidence {
  backupId: string;
  backupCreatedAt: number;
  proofCompletedAt: number;
  targetFingerprintSha256: string;
  manifestChecksumSha256: string;
  tableCount: number;
  recordCount: number;
  tables: Array<{
    table: CommerceBackupTable;
    recordCount: number;
    checksumSha256: string;
  }>;
  verified: true;
}

export function readOperationalBackupConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): OperationalBackupConfig | null {
  const endpointValue = environment.BACKUP_B2_ENDPOINT?.trim();
  const region = environment.BACKUP_B2_REGION?.trim();
  const bucket = environment.BACKUP_B2_BUCKET?.trim();
  const keyId = environment.BACKUP_B2_KEY_ID?.trim();
  const applicationKey = environment.BACKUP_B2_APPLICATION_KEY?.trim();
  const encryptionKeyValue =
    environment.BACKUP_ENCRYPTION_KEY_BASE64?.trim();
  const authenticationKeyValue =
    environment.BACKUP_AUTHENTICATION_KEY_BASE64?.trim();
  const encryptionKeyId =
    environment.BACKUP_ENCRYPTION_KEY_ID?.trim();
  const authenticationKeyId =
    environment.BACKUP_AUTHENTICATION_KEY_ID?.trim();
  const values = [
    endpointValue,
    region,
    bucket,
    keyId,
    applicationKey,
    encryptionKeyValue,
    authenticationKeyValue,
    encryptionKeyId,
    authenticationKeyId,
  ];
  if (values.every((value) => !value)) return null;
  if (values.some((value) => !value)) {
    throw new Error("Invalid operational backup configuration");
  }

  const endpoint = new URL(endpointValue!);
  const prefix = environment.BACKUP_B2_PREFIX?.trim() || "production";
  const retentionDays = Number(
    environment.BACKUP_RETENTION_DAYS?.trim() || "35",
  );
  const encryptionKey = decodeKey(encryptionKeyValue!, 32);
  const authenticationKey = decodeKey(authenticationKeyValue!, null);
  if (
    endpoint.protocol !== "https:"
    || endpoint.pathname !== "/"
    || endpoint.search
    || endpoint.hash
    || endpoint.username
    || endpoint.password
    || !/^s3\.[a-z0-9-]+\.backblazeb2\.com$/u.test(endpoint.hostname)
    || !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/u.test(bucket!)
    || !/^[a-z0-9-]{3,40}$/u.test(region!)
    || keyId!.length < 10
    || applicationKey!.length < 20
    || !/^[a-z0-9][a-z0-9/_-]{0,63}$/u.test(prefix)
    || !Number.isSafeInteger(retentionDays)
    || retentionDays < 35
    || retentionDays > 365
    || encryptionKeyId!.length > 255
    || authenticationKeyId!.length > 255
    || authenticationKey.byteLength < 32
  ) {
    throw new Error("Invalid operational backup configuration");
  }
  return {
    endpoint: endpoint.origin,
    region: region!,
    bucket: bucket!,
    keyId: keyId!,
    applicationKey: applicationKey!,
    prefix,
    retentionDays,
    encryptionKeyId: encryptionKeyId!,
    encryptionKey,
    authenticationKeyId: authenticationKeyId!,
    authenticationKey,
  };
}

export function readOperationalRestoreProofConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): OperationalRestoreProofConfig | null {
  const enabled = environment.BACKUP_RESTORE_PROOF_ENABLED?.trim();
  const targetUrlValue =
    environment.BACKUP_RESTORE_TARGET_CONVEX_URL?.trim();
  const targetServerSecret =
    environment.BACKUP_RESTORE_TARGET_SERVER_SECRET?.trim();
  const restoreSecret = environment.BACKUP_RESTORE_SECRET?.trim();
  const targetClass = environment.BACKUP_RESTORE_TARGET_CLASS?.trim();
  const confirmation =
    environment.BACKUP_RESTORE_TARGET_CONFIRMATION?.trim();
  const configured = [
    targetUrlValue,
    targetServerSecret,
    restoreSecret,
    targetClass,
    confirmation,
  ].some(Boolean);
  if (!configured && (!enabled || enabled === "false")) return null;
  if (
    enabled !== "true"
    || !targetUrlValue
    || !targetServerSecret
    || !restoreSecret
    || targetClass !== "isolated-test"
    || confirmation !== RESTORE_CONFIRMATION
    || targetServerSecret.length < 32
    || restoreSecret.length < 32
    || targetServerSecret === restoreSecret
  ) {
    throw new Error("Invalid operational restore-proof configuration");
  }

  const targetUrl = normalizeRestoreTargetUrl(targetUrlValue);
  const productionUrl = environment.NEXT_PUBLIC_CONVEX_URL?.trim();
  const productionSecret = environment.CONVEX_SERVER_SECRET?.trim();
  if (
    (productionUrl
      && normalizeComparableUrl(productionUrl) === targetUrl)
    || (productionSecret
      && (
        productionSecret === targetServerSecret
        || productionSecret === restoreSecret
      ))
  ) {
    throw new Error("Restore-proof target must be isolated");
  }
  return {
    targetUrl,
    targetServerSecret,
    restoreSecret,
    targetClass,
  };
}

export class ConvexBackupSnapshotSource implements BackupSnapshotSource {
  private readonly client: ConvexHttpClient;
  private readonly serverSecret: string;

  constructor(
    environment: Readonly<Record<string, string | undefined>> = process.env,
  ) {
    const config = readConvexConfig(environment);
    this.client = new ConvexHttpClient(config.url, { logger: false });
    this.serverSecret = config.serverSecret;
  }

  async exportTable(table: CommerceBackupTable): Promise<BackupObjectInput> {
    const result = await this.client.query(exportTableReference, {
      serverSecret: this.serverSecret,
      table,
    });
    if (
      result.table !== table
      || result.schemaVersion !== COMMERCE_BACKUP_SCHEMA_VERSION
      || !Array.isArray(result.records)
    ) {
      throw new Error("Invalid Convex backup export");
    }
    return {
      name: `database/${table}.json`,
      bytes: new TextEncoder().encode(canonicalJson({
        schemaVersion: result.schemaVersion,
        table,
        records: result.records,
      })),
      recordCount: result.records.length,
      schemaVersion: result.schemaVersion,
    };
  }
}

export class ConvexBackupRestoreTarget implements BackupRestoreTarget {
  private readonly client: ConvexHttpClient;

  constructor(private readonly config: OperationalRestoreProofConfig) {
    this.client = new ConvexHttpClient(config.targetUrl, { logger: false });
  }

  async inspect(): Promise<RestoreTargetStatus> {
    return await this.client.query(restoreStatusReference, {
      restoreSecret: this.config.restoreSecret,
    });
  }

  async restoreTable(input: {
    backupId: string;
    table: CommerceBackupTable;
    schemaVersion: string;
    records: unknown[];
    completedTables: CommerceBackupTable[];
  }): Promise<number> {
    return await this.client.mutation(restoreTableReference, {
      restoreSecret: this.config.restoreSecret,
      ...input,
    });
  }

  async exportTable(table: CommerceBackupTable): Promise<BackupObjectInput> {
    const result = await this.client.query(exportTableReference, {
      serverSecret: this.config.targetServerSecret,
      table,
    });
    return exportResultToObject(table, result);
  }
}

export class BackblazeBackupArchiveStore implements BackupArchiveStore {
  private readonly client: S3Client;

  constructor(private readonly config: OperationalBackupConfig) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.keyId,
        secretAccessKey: config.applicationKey,
      },
    });
  }

  async put(input: {
    key: string;
    bytes: Uint8Array;
    contentType: string;
    metadata: Readonly<Record<string, string>>;
    retainUntil: Date;
  }): Promise<void> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: input.key,
      Body: input.bytes,
      ContentType: input.contentType,
      CacheControl: "private, no-store",
      ServerSideEncryption: "AES256",
      ObjectLockMode: ObjectLockMode.GOVERNANCE,
      ObjectLockRetainUntilDate: input.retainUntil,
      Metadata: input.metadata,
    }));
  }

  async get(key: string): Promise<Uint8Array> {
    const result = await this.client.send(new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    }));
    if (!result.Body || typeof result.Body.transformToByteArray !== "function") {
      throw new Error("Backblaze backup object is unavailable");
    }
    return await result.Body.transformToByteArray();
  }

  async latestManifestKey(): Promise<string | null> {
    const prefix = `backups/${this.config.prefix}/`;
    const keys: string[] = [];
    let continuationToken: string | undefined;
    do {
      const result = await this.client.send(new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }));
      keys.push(...(result.Contents ?? [])
        .map((object) => object.Key)
        .filter((key): key is string =>
          Boolean(
            key?.startsWith(prefix)
            && key.endsWith(`/${MANIFEST_NAME}`),
          )));
      if (result.IsTruncated && !result.NextContinuationToken) {
        throw new Error("Backblaze backup listing is incomplete");
      }
      continuationToken = result.IsTruncated
        ? result.NextContinuationToken
        : undefined;
    } while (continuationToken);
    keys.sort().reverse();
    return keys[0] ?? null;
  }
}

export async function createAndVerifyOperationalBackup(input: {
  config: OperationalBackupConfig;
  source: BackupSnapshotSource;
  store: BackupArchiveStore;
  now?: number;
}): Promise<OperationalBackupEvidence> {
  const createdAt = input.now ?? Date.now();
  if (!Number.isSafeInteger(createdAt)) {
    throw new Error("Invalid backup creation time");
  }
  const backupId = createBackupId(createdAt);
  const baseKey = `backups/${input.config.prefix}/${backupId}`;
  const retainUntil = new Date(
    createdAt + input.config.retentionDays * 86_400_000,
  );
  const objects = await Promise.all(
    COMMERCE_BACKUP_TABLES.map((table) => input.source.exportTable(table)),
  );
  const manifest = await createBackupManifest({
    backupId,
    createdAt,
    objects,
  });
  const authenticatedManifest = await authenticateBackupManifest({
    manifest,
    keyId: input.config.authenticationKeyId,
    authenticationKey: input.config.authenticationKey,
  });

  await Promise.all(objects.map(async (object) => {
    const envelope = await encryptBackupObject({
      backupId,
      object,
      keyId: input.config.encryptionKeyId,
      encryptionKey: input.config.encryptionKey,
    });
    const bytes = jsonBytes(envelope);
    await input.store.put({
      key: `${baseKey}/objects/${objectNameToKey(object.name)}.json`,
      bytes,
      contentType: "application/json",
      metadata: {
        backup_id: backupId,
        object_sha256: await sha256Hex(bytes),
      },
      retainUntil,
    });
  }));

  const manifestBytes = jsonBytes(authenticatedManifest);
  const manifestKey = `${baseKey}/${MANIFEST_NAME}`;
  await input.store.put({
    key: manifestKey,
    bytes: manifestBytes,
    contentType: "application/json",
    metadata: {
      backup_id: backupId,
      manifest_sha256: await sha256Hex(manifestBytes),
    },
    retainUntil,
  });
  const verification = await verifyOperationalBackup({
    config: input.config,
    store: input.store,
    manifestKey,
  });
  if (!verification.verified) {
    throw new Error("Operational backup round-trip verification failed");
  }
  return verification;
}

export async function verifyLatestOperationalBackup(input: {
  config: OperationalBackupConfig;
  store: BackupArchiveStore;
}): Promise<OperationalBackupEvidence | null> {
  const manifestKey = await input.store.latestManifestKey();
  if (!manifestKey) return null;
  return await verifyOperationalBackup({ ...input, manifestKey });
}

export async function proveLatestOperationalBackupRestore(input: {
  backupConfig: OperationalBackupConfig;
  restoreConfig: OperationalRestoreProofConfig;
  store: BackupArchiveStore;
  target: BackupRestoreTarget;
  now?: number;
}): Promise<OperationalRestoreProofEvidence> {
  const completedAt = input.now ?? Date.now();
  if (!Number.isSafeInteger(completedAt)) {
    throw new Error("Invalid restore-proof completion time");
  }
  const manifestKey = await input.store.latestManifestKey();
  if (!manifestKey) throw new Error("No committed backup is available");
  const loaded = await loadOperationalBackup({
    config: input.backupConfig,
    store: input.store,
    manifestKey,
  });

  const initial = await input.target.inspect();
  if (
    initial.schemaVersion !== COMMERCE_BACKUP_SCHEMA_VERSION
    || initial.tableCount !== COMMERCE_BACKUP_TABLES.length
    || initial.targetClass !== "isolated-test"
    || !initial.empty
    || initial.nonEmptyTableCount !== 0
  ) {
    throw new Error("Restore-proof target is not an empty isolated test");
  }

  const objectsByName = new Map(
    loaded.objects.map((object) => [object.name, object] as const),
  );
  const completedTables: CommerceBackupTable[] = [];
  for (const table of COMMERCE_BACKUP_TABLES) {
    const object = objectsByName.get(tableObjectName(table));
    if (!object) throw new Error("Backup table object is unavailable");
    const records = parseTableRecords(object, table);
    const restored = await input.target.restoreTable({
      backupId: loaded.envelope.manifest.backupId,
      table,
      schemaVersion: COMMERCE_BACKUP_SCHEMA_VERSION,
      records,
      completedTables: [...completedTables],
    });
    if (restored !== records.length) {
      throw new Error("Backup restore count mismatch");
    }
    completedTables.push(table);
  }

  const reexported = await Promise.all(
    COMMERCE_BACKUP_TABLES.map((table) => input.target.exportTable(table)),
  );
  const reconciliation = await verifyBackupManifest(
    loaded.envelope.manifest,
    reexported,
  );
  if (!reconciliation.valid) {
    throw new Error("Restored target manifest reconciliation failed");
  }
  const reexportedByName = new Map(
    reexported.map((object) => [object.name, object] as const),
  );
  return {
    backupId: loaded.envelope.manifest.backupId,
    backupCreatedAt: loaded.envelope.manifest.createdAt,
    proofCompletedAt: completedAt,
    targetFingerprintSha256: await sha256Hex(
      new TextEncoder().encode(input.restoreConfig.targetUrl),
    ),
    manifestChecksumSha256:
      loaded.envelope.manifest.manifestChecksumSha256,
    tableCount: COMMERCE_BACKUP_TABLES.length,
    recordCount: loaded.envelope.manifest.objects.reduce(
      (total, object) => total + object.recordCount,
      0,
    ),
    tables: await Promise.all(COMMERCE_BACKUP_TABLES.map(async (table) => {
      const object = reexportedByName.get(tableObjectName(table));
      if (!object) throw new Error("Restore reconciliation object missing");
      return {
        table,
        recordCount: object.recordCount,
        checksumSha256: await sha256Hex(object.bytes),
      };
    })),
    verified: true,
  };
}

async function verifyOperationalBackup(input: {
  config: OperationalBackupConfig;
  store: BackupArchiveStore;
  manifestKey: string;
}): Promise<OperationalBackupEvidence> {
  const loaded = await loadOperationalBackup(input);
  const { manifest } = loaded.envelope;
  return {
    backupId: manifest.backupId,
    createdAt: manifest.createdAt,
    tableCount: manifest.objects.length,
    recordCount: manifest.objects.reduce(
      (total, object) => total + object.recordCount,
      0,
    ),
    manifestKey: input.manifestKey,
    verified: true,
  };
}

async function loadOperationalBackup(input: {
  config: OperationalBackupConfig;
  store: BackupArchiveStore;
  manifestKey: string;
}): Promise<{
  envelope: AuthenticatedBackupManifest;
  objects: BackupObjectInput[];
}> {
  const envelope = parseJson<AuthenticatedBackupManifest>(
    await input.store.get(input.manifestKey),
  );
  if (!await verifyAuthenticatedBackupManifest({
    envelope,
    authenticationKey: input.config.authenticationKey,
  }) || envelope.authentication.keyId
      !== input.config.authenticationKeyId) {
    throw new Error("Backup manifest authentication failed");
  }
  const { manifest } = envelope;
  if (
    !safeBackupId(manifest.backupId)
    || input.manifestKey
      !== `backups/${input.config.prefix}/${manifest.backupId}/${MANIFEST_NAME}`
  ) {
    throw new Error("Backup manifest storage binding mismatch");
  }
  assertCompleteCommerceManifest(manifest);
  const baseKey =
    `backups/${input.config.prefix}/${manifest.backupId}/objects`;
  const restored = await Promise.all(manifest.objects.map(async (object) => {
    const encrypted = parseJson<EncryptedBackupObject>(
      await input.store.get(
        `${baseKey}/${objectNameToKey(object.name)}.json`,
      ),
    );
    return await decryptBackupObject({
      envelope: encrypted,
      encryptionKey: input.config.encryptionKey,
      expected: {
        backupId: manifest.backupId,
        keyId: input.config.encryptionKeyId,
        name: object.name,
      },
    });
  }));
  const evidence = await verifyBackupManifest(manifest, restored);
  if (!evidence.valid) {
    throw new Error("Backup restore reconciliation failed");
  }
  return { envelope, objects: restored };
}

function assertCompleteCommerceManifest(
  manifest: AuthenticatedBackupManifest["manifest"],
): void {
  const expected = new Set(
    COMMERCE_BACKUP_TABLES.map((table) => tableObjectName(table)),
  );
  if (manifest.objects.length !== expected.size) {
    throw new Error("Backup manifest table set is incomplete");
  }
  for (const object of manifest.objects) {
    if (
      !expected.delete(object.name)
      || object.schemaVersion !== COMMERCE_BACKUP_SCHEMA_VERSION
    ) {
      throw new Error("Backup manifest table set is invalid");
    }
  }
  if (expected.size > 0) {
    throw new Error("Backup manifest table set is incomplete");
  }
}

function parseTableRecords(
  object: BackupObjectInput,
  expectedTable: CommerceBackupTable,
): unknown[] {
  const value = parseJson<unknown>(object.bytes);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid backup table object");
  }
  const document = value as Record<string, unknown>;
  if (
    document.table !== expectedTable
    || document.schemaVersion !== COMMERCE_BACKUP_SCHEMA_VERSION
    || !Array.isArray(document.records)
    || document.records.length !== object.recordCount
    || document.records.length > 5_000
  ) {
    throw new Error("Invalid backup table object");
  }
  for (const record of document.records) {
    if (
      !record
      || typeof record !== "object"
      || Array.isArray(record)
      || "_id" in record
      || "_creationTime" in record
    ) {
      throw new Error("Invalid backup table record");
    }
  }
  return document.records;
}

function exportResultToObject(
  table: CommerceBackupTable,
  result: {
    table: string;
    schemaVersion: string;
    records: unknown[];
  },
): BackupObjectInput {
  if (
    result.table !== table
    || result.schemaVersion !== COMMERCE_BACKUP_SCHEMA_VERSION
    || !Array.isArray(result.records)
  ) {
    throw new Error("Invalid Convex backup export");
  }
  return {
    name: tableObjectName(table),
    bytes: new TextEncoder().encode(canonicalJson({
      schemaVersion: result.schemaVersion,
      table,
      records: result.records,
    })),
    recordCount: result.records.length,
    schemaVersion: result.schemaVersion,
  };
}

function tableObjectName(table: CommerceBackupTable): string {
  return `database/${table}.json`;
}

function normalizeRestoreTargetUrl(value: string): string {
  const url = new URL(value);
  if (
    url.protocol !== "https:"
    || url.pathname !== "/"
    || url.search
    || url.hash
    || url.username
    || url.password
    || !url.hostname.endsWith(".convex.cloud")
    || /(?:prod(?:uction)?|live|main|gummyui)/u
      .test(url.hostname)
  ) {
    throw new Error("Invalid restore-proof target URL");
  }
  return url.origin;
}

function normalizeComparableUrl(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function createBackupId(now: number): string {
  const timestamp = new Date(now)
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replace(".", "");
  return `${timestamp}-${crypto.randomUUID().replaceAll("-", "")}`;
}

function safeBackupId(value: string): boolean {
  return /^[0-9]{8}T[0-9]{6}[0-9]{3}Z-[a-f0-9]{32}$/u.test(value);
}

function objectNameToKey(name: string): string {
  return name.replaceAll("/", "__");
}

function jsonBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(canonicalJson(value));
}

function parseJson<T>(bytes: Uint8Array): T {
  if (bytes.byteLength < 2 || bytes.byteLength > 64 * 1024 * 1024) {
    throw new Error("Invalid backup object size");
  }
  try {
    return JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    ) as T;
  } catch {
    throw new Error("Invalid backup object encoding");
  }
}

function decodeKey(value: string, exactLength: number | null): Uint8Array {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u
    .test(value)) {
    throw new Error("Invalid backup key encoding");
  }
  const bytes = new Uint8Array(Buffer.from(value, "base64"));
  if (
    bytes.byteLength < 32
    || (exactLength !== null && bytes.byteLength !== exactLength)
  ) {
    throw new Error("Invalid backup key length");
  }
  return bytes;
}

async function sha256Hex(value: Uint8Array): Promise<string> {
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", ownedArrayBuffer(value)),
  );
  return [...digest]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
