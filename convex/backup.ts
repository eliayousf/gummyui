import {
  mutationGeneric,
  queryGeneric,
  type DataModelFromSchemaDefinition,
  type GenericQueryCtx,
} from "convex/server";
import { v } from "convex/values";
import {
  COMMERCE_BACKUP_SCHEMA_VERSION,
  COMMERCE_BACKUP_TABLES,
  type CommerceBackupTable,
} from "../lib/commerce/backup-tables";
import schema from "./schema";

type DataModel = DataModelFromSchemaDefinition<typeof schema>;
type QueryCtx = GenericQueryCtx<DataModel>;

const backupTableNames = new Set<string>(COMMERCE_BACKUP_TABLES);

export const exportTable = queryGeneric({
  args: {
    serverSecret: v.string(),
    table: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    assertServerSecret(args.serverSecret);
    if (!backupTableNames.has(args.table)) {
      throw new Error("Unsupported backup table");
    }
    const table = args.table as CommerceBackupTable;
    return {
      table,
      schemaVersion: COMMERCE_BACKUP_SCHEMA_VERSION,
      records: (await collectTable(ctx, table))
        .map(stripConvexSystemFields)
        .sort((left, right) =>
          JSON.stringify(left).localeCompare(JSON.stringify(right)),
        ),
    };
  },
});

export const restoreTable = mutationGeneric({
  args: {
    restoreSecret: v.string(),
    backupId: v.string(),
    table: v.string(),
    schemaVersion: v.string(),
    records: v.array(v.any()),
    completedTables: v.array(v.string()),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    assertRestoreAllowed(args.restoreSecret);
    if (
      !/^[0-9]{8}T[0-9]{6}[0-9]{3}Z-[a-f0-9]{32}$/u.test(args.backupId) ||
      !backupTableNames.has(args.table) ||
      args.schemaVersion !== COMMERCE_BACKUP_SCHEMA_VERSION ||
      args.records.length > 5_000
    ) {
      throw new Error("Invalid backup restore payload");
    }
    const table = args.table as CommerceBackupTable;
    const tableIndex = COMMERCE_BACKUP_TABLES.indexOf(table);
    const expectedCompleted = COMMERCE_BACKUP_TABLES.slice(0, tableIndex);
    if (
      args.completedTables.length !== expectedCompleted.length ||
      args.completedTables.some(
        (completed, index) => completed !== expectedCompleted[index],
      )
    ) {
      throw new Error("Invalid backup restore sequence");
    }
    // The first mutation proves all 24 durable tables and the intentionally
    // ephemeral rate-limit table are empty. Later mutations only permit the
    // exact durable prefix already restored and continue checking every
    // untouched durable table. No restore path ever imports rate-limit state,
    // deletes records, or overwrites records.
    for (const remaining of COMMERCE_BACKUP_TABLES.slice(tableIndex)) {
      if ((await ctx.db.query(remaining).take(1)).length > 0) {
        throw new Error("Backup restore target is not empty");
      }
    }
    if (
      tableIndex === 0 &&
      (await ctx.db.query("rateLimitWindows").take(1)).length > 0
    ) {
      throw new Error("Backup restore target is not empty");
    }
    for (const value of args.records) {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("Invalid backup restore record");
      }
      const record = { ...value } as Record<string, unknown>;
      if ("_id" in record || "_creationTime" in record) {
        throw new Error("Backup restore contains system fields");
      }
      await ctx.db.insert(table, record as never);
    }
    return args.records.length;
  },
});

export const restoreStatus = queryGeneric({
  args: {
    restoreSecret: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    assertRestoreAllowed(args.restoreSecret);
    let nonEmptyTableCount = 0;
    for (const table of COMMERCE_BACKUP_TABLES) {
      if ((await ctx.db.query(table).take(1)).length > 0) {
        nonEmptyTableCount += 1;
      }
    }
    if ((await ctx.db.query("rateLimitWindows").take(1)).length > 0) {
      nonEmptyTableCount += 1;
    }
    return {
      schemaVersion: COMMERCE_BACKUP_SCHEMA_VERSION,
      tableCount: COMMERCE_BACKUP_TABLES.length,
      nonEmptyTableCount,
      empty: nonEmptyTableCount === 0,
      targetClass: "isolated-test",
    };
  },
});

async function collectTable(
  ctx: QueryCtx,
  table: CommerceBackupTable,
): Promise<unknown[]> {
  return await ctx.db.query(table).collect();
}

function stripConvexSystemFields(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid backup record");
  }
  const record = { ...value } as Record<string, unknown>;
  delete record._id;
  delete record._creationTime;
  return record;
}

function assertServerSecret(value: string): void {
  const expected = process.env.CONVEX_SERVER_SECRET;
  if (!expected || expected.length < 32 || value !== expected) {
    throw new Error("Backup export is unavailable");
  }
}

function assertRestoreAllowed(value: string): void {
  const expected = process.env.BACKUP_RESTORE_SECRET;
  if (
    process.env.BACKUP_RESTORE_ENABLED !== "true" ||
    process.env.BACKUP_RESTORE_TARGET_CLASS !== "isolated-test" ||
    !expected ||
    expected.length < 32 ||
    value !== expected
  ) {
    throw new Error("Backup restore is unavailable");
  }
}
