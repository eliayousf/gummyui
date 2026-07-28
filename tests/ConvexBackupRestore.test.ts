/// <reference types="vite/client" />

import { anyApi } from "convex/server";
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import schema from "../convex/schema";
import {
  COMMERCE_BACKUP_SCHEMA_VERSION,
  COMMERCE_BACKUP_TABLES,
} from "../lib/commerce/backup-tables";

const modules = import.meta.glob("../convex/**/*.ts");
const SERVER_SECRET = "backup-export-secret-".padEnd(40, "x");
const RESTORE_SECRET = "backup-restore-secret-".padEnd(40, "x");
const BACKUP_ID = "20270115T080000000Z-00112233445566778899aabbccddeeff";

describe("Convex isolated restore target", () => {
  const previous = {
    serverSecret: process.env.CONVEX_SERVER_SECRET,
    restoreEnabled: process.env.BACKUP_RESTORE_ENABLED,
    restoreSecret: process.env.BACKUP_RESTORE_SECRET,
    targetClass: process.env.BACKUP_RESTORE_TARGET_CLASS,
  };

  beforeEach(() => {
    process.env.CONVEX_SERVER_SECRET = SERVER_SECRET;
    process.env.BACKUP_RESTORE_ENABLED = "true";
    process.env.BACKUP_RESTORE_SECRET = RESTORE_SECRET;
    process.env.BACKUP_RESTORE_TARGET_CLASS = "isolated-test";
  });

  afterEach(() => {
    restoreEnvironment("CONVEX_SERVER_SECRET", previous.serverSecret);
    restoreEnvironment("BACKUP_RESTORE_ENABLED", previous.restoreEnabled);
    restoreEnvironment("BACKUP_RESTORE_SECRET", previous.restoreSecret);
    restoreEnvironment("BACKUP_RESTORE_TARGET_CLASS", previous.targetClass);
  });

  it("requires an empty target and the exact table sequence", async () => {
    const test = convexTest(schema, modules);
    await expect(
      test.query(anyApi.backup.restoreStatus, {
        restoreSecret: RESTORE_SECRET,
      }),
    ).resolves.toEqual({
      schemaVersion: COMMERCE_BACKUP_SCHEMA_VERSION,
      tableCount: COMMERCE_BACKUP_TABLES.length,
      nonEmptyTableCount: 0,
      empty: true,
      targetClass: "isolated-test",
    });

    const account = {
      id: "account:test",
      identityProvider: "workos",
      identitySubject: "user_test",
      emailHash: null,
      status: "active",
      deactivatedAt: null,
      createdAt: 1_800_000_000_000,
      updatedAt: 1_800_000_000_000,
    };
    await expect(
      test.mutation(anyApi.backup.restoreTable, {
        restoreSecret: RESTORE_SECRET,
        backupId: BACKUP_ID,
        table: "accounts",
        schemaVersion: COMMERCE_BACKUP_SCHEMA_VERSION,
        records: [account],
        completedTables: [],
      }),
    ).resolves.toBe(1);

    await expect(
      test.mutation(anyApi.backup.restoreTable, {
        restoreSecret: RESTORE_SECRET,
        backupId: BACKUP_ID,
        table: "profiles",
        schemaVersion: COMMERCE_BACKUP_SCHEMA_VERSION,
        records: [],
        completedTables: [],
      }),
    ).rejects.toThrow("Invalid backup restore sequence");
    await expect(
      test.mutation(anyApi.backup.restoreTable, {
        restoreSecret: RESTORE_SECRET,
        backupId: BACKUP_ID,
        table: "profiles",
        schemaVersion: COMMERCE_BACKUP_SCHEMA_VERSION,
        records: [],
        completedTables: ["accounts"],
      }),
    ).resolves.toBe(0);

    const exported = await test.query(anyApi.backup.exportTable, {
      serverSecret: SERVER_SECRET,
      table: "accounts",
    });
    expect(exported).toMatchObject({
      table: "accounts",
      schemaVersion: COMMERCE_BACKUP_SCHEMA_VERSION,
      records: [account],
    });
  });

  it("refuses a first restore if a durable table has data", async () => {
    const test = convexTest(schema, modules);
    await test.run(async (ctx) => {
      await ctx.db.insert("retentionActions", {
        id: "retention:test",
        recordType: "account",
        recordId: "account:test",
        policyRef: "test",
        status: "scheduled",
        retainUntil: 1_900_000_000_000,
        legalHold: false,
        completedAt: null,
        failureCode: null,
        createdAt: 1_800_000_000_000,
        updatedAt: 1_800_000_000_000,
      });
    });
    await expect(
      test.query(anyApi.backup.restoreStatus, {
        restoreSecret: RESTORE_SECRET,
      }),
    ).resolves.toMatchObject({
      empty: false,
      nonEmptyTableCount: 1,
    });
    await expect(
      test.mutation(anyApi.backup.restoreTable, {
        restoreSecret: RESTORE_SECRET,
        backupId: BACKUP_ID,
        table: "accounts",
        schemaVersion: COMMERCE_BACKUP_SCHEMA_VERSION,
        records: [],
        completedTables: [],
      }),
    ).rejects.toThrow("Backup restore target is not empty");
  });

  it("refuses a first restore if the ephemeral rate-limit table has data", async () => {
    const test = convexTest(schema, modules);
    await test.run(async (ctx) => {
      await ctx.db.insert("rateLimitWindows", {
        scopeHash: "scope:test",
        keyHash: "key:test",
        capacity: 5,
        windowMs: 60_000,
        windowStartedAt: 1_800_000_000_000,
        windowEndsAt: 1_800_000_060_000,
        count: 1,
        expiresAt: 1_800_086_460_000,
        updatedAt: 1_800_000_000_000,
      });
    });
    await expect(
      test.query(anyApi.backup.restoreStatus, {
        restoreSecret: RESTORE_SECRET,
      }),
    ).resolves.toMatchObject({
      tableCount: 24,
      empty: false,
      nonEmptyTableCount: 1,
    });
    await expect(
      test.mutation(anyApi.backup.restoreTable, {
        restoreSecret: RESTORE_SECRET,
        backupId: BACKUP_ID,
        table: "accounts",
        schemaVersion: COMMERCE_BACKUP_SCHEMA_VERSION,
        records: [],
        completedTables: [],
      }),
    ).rejects.toThrow("Backup restore target is not empty");
  });

  it("requires both restore enablement and isolated target classification", async () => {
    const test = convexTest(schema, modules);
    process.env.BACKUP_RESTORE_TARGET_CLASS = "production";
    await expect(
      test.query(anyApi.backup.restoreStatus, {
        restoreSecret: RESTORE_SECRET,
      }),
    ).rejects.toThrow("Backup restore is unavailable");
  });
});

function restoreEnvironment(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
