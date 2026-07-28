import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import {
  ConvexBackupRestoreTarget,
  createAndVerifyOperationalBackup,
  proveLatestOperationalBackupRestore,
  readOperationalBackupConfig,
  readOperationalRestoreProofConfig,
  verifyLatestOperationalBackup,
  type BackupArchiveStore,
  type BackupRestoreTarget,
  type BackupSnapshotSource,
  type OperationalBackupConfig,
  type OperationalRestoreProofConfig,
  type RestoreTargetStatus,
} from "../lib/commerce/backup-runtime";
import {
  canonicalJson,
  type BackupObjectInput,
} from "../lib/commerce/backup";
import {
  COMMERCE_BACKUP_SCHEMA_VERSION,
  COMMERCE_BACKUP_TABLES,
  type CommerceBackupTable,
} from "../lib/commerce/backup-tables";

const encryptionKey = new TextEncoder().encode(
  "0123456789abcdef0123456789abcdef",
);
const authenticationKey = new TextEncoder().encode(
  "backup-authentication-key-that-is-separate",
);

function config(): OperationalBackupConfig {
  return {
    endpoint: "https://s3.eu-central-003.backblazeb2.com",
    region: "eu-central-003",
    bucket: "gummyui-production-backups",
    keyId: "001234567890abcdef",
    applicationKey: "application-key-with-safe-test-length",
    prefix: "production",
    retentionDays: 35,
    encryptionKeyId: "backup-encryption-v1",
    encryptionKey,
    authenticationKeyId: "backup-authentication-v1",
    authenticationKey,
  };
}

function restoreConfig(): OperationalRestoreProofConfig {
  return {
    targetUrl: "https://backup-restore-test.convex.cloud",
    targetServerSecret: "target-server-secret-".padEnd(40, "x"),
    restoreSecret: "target-restore-secret-".padEnd(40, "x"),
    targetClass: "isolated-test",
  };
}

class MemoryStore implements BackupArchiveStore {
  readonly objects = new Map<string, Uint8Array>();
  readonly retainUntil = new Map<string, Date>();

  async put(input: {
    key: string;
    bytes: Uint8Array;
    contentType: string;
    metadata: Readonly<Record<string, string>>;
    retainUntil: Date;
  }): Promise<void> {
    expect(input.contentType).toBe("application/json");
    expect(Object.keys(input.metadata).length).toBeGreaterThan(0);
    this.objects.set(input.key, input.bytes);
    this.retainUntil.set(input.key, input.retainUntil);
  }

  async get(key: string): Promise<Uint8Array> {
    const value = this.objects.get(key);
    if (!value) throw new Error("missing");
    return value;
  }

  async latestManifestKey(): Promise<string | null> {
    return [...this.objects.keys()]
      .filter((key) => key.endsWith("/manifest.json"))
      .sort()
      .reverse()[0] ?? null;
  }
}

const source: BackupSnapshotSource = {
  async exportTable(table: CommerceBackupTable) {
    const records = table === "accounts"
      ? [{ id: "account:test", emailHash: "hash-only" }]
      : [];
    return {
      name: `database/${table}.json`,
      bytes: new TextEncoder().encode(canonicalJson({
        table,
        schemaVersion: COMMERCE_BACKUP_SCHEMA_VERSION,
        records,
      })),
      recordCount: records.length,
      schemaVersion: COMMERCE_BACKUP_SCHEMA_VERSION,
    };
  },
};

class MemoryRestoreTarget implements BackupRestoreTarget {
  readonly restoredTables: CommerceBackupTable[] = [];
  readonly objects = new Map<CommerceBackupTable, BackupObjectInput>();

  constructor(
    private readonly corruptExport = false,
    nonEmpty = false,
  ) {
    if (nonEmpty) {
      this.objects.set("accounts", tableObject("accounts", [{
        id: "preexisting",
      }]));
    }
  }

  async inspect(): Promise<RestoreTargetStatus> {
    const nonEmptyTableCount = [...this.objects.values()]
      .filter((object) => object.recordCount > 0).length;
    return {
      schemaVersion: COMMERCE_BACKUP_SCHEMA_VERSION,
      tableCount: COMMERCE_BACKUP_TABLES.length,
      nonEmptyTableCount,
      empty: nonEmptyTableCount === 0,
      targetClass: "isolated-test",
    };
  }

  async restoreTable(input: {
    backupId: string;
    table: CommerceBackupTable;
    schemaVersion: string;
    records: unknown[];
    completedTables: CommerceBackupTable[];
  }): Promise<number> {
    expect(input.backupId).toMatch(
      /^[0-9]{8}T[0-9]{6}[0-9]{3}Z-[a-f0-9]{32}$/u,
    );
    expect(input.schemaVersion).toBe(COMMERCE_BACKUP_SCHEMA_VERSION);
    expect(input.completedTables).toEqual(this.restoredTables);
    this.objects.set(
      input.table,
      tableObject(input.table, structuredClone(input.records)),
    );
    this.restoredTables.push(input.table);
    return input.records.length;
  }

  async exportTable(table: CommerceBackupTable): Promise<BackupObjectInput> {
    const object = this.objects.get(table) ?? tableObject(table, []);
    if (!this.corruptExport || table !== "accounts") return object;
    return tableObject(table, [{ id: "mismatched" }]);
  }
}

describe("operational Convex backups", () => {
  it("exports every table, encrypts it, commits a manifest and verifies restore", async () => {
    const store = new MemoryStore();
    const now = 1_800_000_000_000;
    const evidence = await createAndVerifyOperationalBackup({
      config: config(),
      source,
      store,
      now,
    });
    expect(evidence).toMatchObject({
      createdAt: now,
      tableCount: COMMERCE_BACKUP_TABLES.length,
      recordCount: 1,
      verified: true,
    });
    expect(store.objects.size).toBe(COMMERCE_BACKUP_TABLES.length + 1);
    expect(
      [...store.objects.values()]
        .map((bytes) => new TextDecoder().decode(bytes))
        .join(""),
    ).not.toContain("account:test");
    for (const retained of store.retainUntil.values()) {
      expect(retained.getTime()).toBe(now + 35 * 86_400_000);
    }
    await expect(
      verifyLatestOperationalBackup({ config: config(), store }),
    ).resolves.toMatchObject({
      backupId: evidence.backupId,
      verified: true,
    });
  });

  it("fails closed on a tampered encrypted object", async () => {
    const store = new MemoryStore();
    await createAndVerifyOperationalBackup({
      config: config(),
      source,
      store,
      now: 1_800_000_000_000,
    });
    const objectKey = [...store.objects.keys()]
      .find((key) => key.includes("/objects/"));
    expect(objectKey).toBeTruthy();
    const value = store.objects.get(objectKey!)!;
    value[value.length - 1] ^= 1;
    await expect(
      verifyLatestOperationalBackup({ config: config(), store }),
    ).rejects.toThrow();
  });

  it("validates complete, separate B2 and cryptographic configuration", () => {
    const valid = readOperationalBackupConfig({
      BACKUP_B2_ENDPOINT: "https://s3.eu-central-003.backblazeb2.com",
      BACKUP_B2_REGION: "eu-central-003",
      BACKUP_B2_BUCKET: "gummyui-production-backups",
      BACKUP_B2_KEY_ID: "001234567890abcdef",
      BACKUP_B2_APPLICATION_KEY: "application-key-with-safe-test-length",
      BACKUP_B2_PREFIX: "production",
      BACKUP_RETENTION_DAYS: "35",
      BACKUP_ENCRYPTION_KEY_ID: "backup-encryption-v1",
      BACKUP_ENCRYPTION_KEY_BASE64:
        Buffer.from(encryptionKey).toString("base64"),
      BACKUP_AUTHENTICATION_KEY_ID: "backup-authentication-v1",
      BACKUP_AUTHENTICATION_KEY_BASE64:
        Buffer.from(authenticationKey).toString("base64"),
    });
    expect(valid).toMatchObject({
      bucket: "gummyui-production-backups",
      retentionDays: 35,
    });
    expect(() => readOperationalBackupConfig({
      BACKUP_B2_ENDPOINT: "https://s3.attacker.example",
    })).toThrow("Invalid operational backup configuration");
  });

  it("restores the authenticated latest backup and exactly re-exports all tables", async () => {
    const store = new MemoryStore();
    await createAndVerifyOperationalBackup({
      config: config(),
      source,
      store,
      now: 1_800_000_000_000,
    });
    const target = new MemoryRestoreTarget();
    const evidence = await proveLatestOperationalBackupRestore({
      backupConfig: config(),
      restoreConfig: restoreConfig(),
      store,
      target,
      now: 1_800_000_100_000,
    });
    expect(evidence).toMatchObject({
      backupCreatedAt: 1_800_000_000_000,
      proofCompletedAt: 1_800_000_100_000,
      tableCount: COMMERCE_BACKUP_TABLES.length,
      recordCount: 1,
      verified: true,
      manifestChecksumSha256: expect.stringMatching(/^[a-f0-9]{64}$/u),
      targetFingerprintSha256: expect.stringMatching(/^[a-f0-9]{64}$/u),
    });
    expect(evidence.tables).toHaveLength(COMMERCE_BACKUP_TABLES.length);
    expect(evidence.tables.every((table) =>
      /^[a-f0-9]{64}$/u.test(table.checksumSha256)
    )).toBe(true);
    expect(target.restoredTables).toEqual(COMMERCE_BACKUP_TABLES);
    expect(JSON.stringify(evidence)).not.toContain("account:test");
  });

  it("refuses non-empty targets and exact-reconciliation mismatches", async () => {
    const store = new MemoryStore();
    await createAndVerifyOperationalBackup({
      config: config(),
      source,
      store,
      now: 1_800_000_000_000,
    });
    const nonEmpty = new MemoryRestoreTarget(false, true);
    await expect(proveLatestOperationalBackupRestore({
      backupConfig: config(),
      restoreConfig: restoreConfig(),
      store,
      target: nonEmpty,
    })).rejects.toThrow("not an empty isolated test");
    expect(nonEmpty.restoredTables).toHaveLength(0);

    await expect(proveLatestOperationalBackupRestore({
      backupConfig: config(),
      restoreConfig: restoreConfig(),
      store,
      target: new MemoryRestoreTarget(true),
    })).rejects.toThrow("manifest reconciliation failed");
  });

  it("requires explicit non-production restore-proof configuration", () => {
    expect(readOperationalRestoreProofConfig({})).toBeNull();
    const values = {
      BACKUP_RESTORE_PROOF_ENABLED: "true",
      BACKUP_RESTORE_TARGET_CONVEX_URL:
        "https://backup-restore-test.convex.cloud",
      BACKUP_RESTORE_TARGET_SERVER_SECRET:
        "target-server-secret-".padEnd(40, "x"),
      BACKUP_RESTORE_SECRET:
        "target-restore-secret-".padEnd(40, "x"),
      BACKUP_RESTORE_TARGET_CLASS: "isolated-test",
      BACKUP_RESTORE_TARGET_CONFIRMATION:
        "RESTORE_TO_EMPTY_ISOLATED_TEST_ONLY",
    };
    expect(readOperationalRestoreProofConfig(values)).toEqual(
      restoreConfig(),
    );
    expect(() => readOperationalRestoreProofConfig({
      ...values,
      BACKUP_RESTORE_TARGET_CONVEX_URL:
        "https://production.convex.cloud",
    })).toThrow("Invalid restore-proof target URL");
    expect(() => readOperationalRestoreProofConfig({
      ...values,
      NEXT_PUBLIC_CONVEX_URL:
        "https://backup-restore-test.convex.cloud",
    })).toThrow("Restore-proof target must be isolated");
    expect(() => readOperationalRestoreProofConfig({
      ...values,
      BACKUP_RESTORE_PROOF_ENABLED: "false",
    })).toThrow("Invalid operational restore-proof configuration");
  });

  it("constructs the real Convex target without making a provider call", () => {
    expect(new ConvexBackupRestoreTarget(restoreConfig()))
      .toBeInstanceOf(ConvexBackupRestoreTarget);
  });
});

function tableObject(
  table: CommerceBackupTable,
  records: unknown[],
): BackupObjectInput {
  return {
    name: `database/${table}.json`,
    bytes: new TextEncoder().encode(canonicalJson({
      schemaVersion: COMMERCE_BACKUP_SCHEMA_VERSION,
      table,
      records,
    })),
    recordCount: records.length,
    schemaVersion: COMMERCE_BACKUP_SCHEMA_VERSION,
  };
}
