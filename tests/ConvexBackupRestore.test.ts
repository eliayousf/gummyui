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

  it("attests exact checkout-linked grant and revocation state", async () => {
    const test = convexTest(schema, modules);
    const now = Date.now() - 1_000;
    const accountId = "account:sandbox-exact-proof";
    const workspaceId = "workspace:sandbox-exact-proof";
    const monthlyCheckoutId = "cs_test_monthly_exact";
    const lifetimeCheckoutId = "cs_test_lifetime_exact";
    const subscriptionId = "subscription:stripe:sub_sandbox_exact";
    const productRefs = [
      "gummy-ui-pro-blocks",
      "gummy-ui-pro-templates",
      "gummy-ui-pro-design-kit",
    ];

    await test.run(async (ctx) => {
      await ctx.db.insert("accounts", {
        id: accountId,
        identityProvider: "workos",
        identitySubject: "user_sandbox_exact",
        emailHash: null,
        status: "active",
        deactivatedAt: null,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("workspaces", {
        id: workspaceId,
        identityProvider: "workos",
        providerOrganizationId: null,
        name: "Sandbox exact proof",
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("memberships", {
        id: "membership:sandbox-exact-proof",
        workspaceId,
        accountId,
        providerMembershipId: null,
        role: "owner",
        status: "active",
        currentSince: now,
        revokedAt: null,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("subscriptions", {
        id: subscriptionId,
        billingProvider: "stripe",
        providerSubscriptionId: "sub_sandbox_exact",
        workspaceId,
        accountId,
        planRef: "individual-monthly",
        status: "active",
        currentPeriodStartsAt: now,
        currentPeriodEndsAt: now + 86_400_000,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        providerOccurredAt: now,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("releaseRecords", {
        id: "release:sandbox-exact-proof",
        productRef: "gummy-ui-pro-blocks",
        version: "0.0.0-sandbox-exact",
        storageKey: "sandbox-exact/not-a-customer-release.zip",
        checksumSha256: "a".repeat(64),
        sizeBytes: 1_024,
        status: "published",
        releasedAt: now,
        withdrawnAt: null,
        createdAt: now,
        updatedAt: now,
      });

      for (const [index, checkoutId] of [
        monthlyCheckoutId,
        lifetimeCheckoutId,
      ].entries()) {
        const purchaseId = `purchase:stripe:${checkoutId}`;
        await ctx.db.insert("purchases", {
          id: purchaseId,
          billingProvider: "stripe",
          providerPurchaseId: checkoutId,
          providerPaymentIntentId: index === 0 ? null : "pi_sandbox_exact",
          accountId,
          workspaceId,
          productRef:
            index === 0 ? "individual-monthly" : "individual-lifetime",
          status: "completed",
          currency: "USD",
          amountMinor: index === 0 ? 4_900 : 89_900,
          purchasedAt: now,
          providerOccurredAt: now,
          createdAt: now,
          updatedAt: now,
        });
        for (const productRef of productRefs) {
          const licenceId = `licence:stripe:${checkoutId}:${productRef}`;
          await ctx.db.insert("licences", {
            id: licenceId,
            workspaceId,
            purchaseId,
            subscriptionId: index === 0 ? subscriptionId : null,
            productRef,
            status: "active",
            startsAt: now,
            expiresAt: index === 0 ? now + 86_400_000 : null,
            updatesUntil: index === 0 ? now + 86_400_000 : null,
            seatLimit: 1,
            createdAt: now,
            updatedAt: now,
          });
          await ctx.db.insert("entitlements", {
            id: `entitlement:stripe:${checkoutId}:${productRef}`,
            workspaceId,
            accountId,
            licenceId,
            productRef,
            status: "active",
            validFrom: now,
            validUntil: index === 0 ? now + 86_400_000 : null,
            updatesUntil: index === 0 ? now + 86_400_000 : null,
            sourceEventId: `event:sandbox-exact:${index}`,
            createdAt: now,
            updatedAt: now,
          });
          await ctx.db.insert("licenceSeats", {
            id: `licence-seat:stripe:${checkoutId}:${productRef}`,
            licenceId,
            accountId,
            status: "active",
            assignedAt: now,
            revokedAt: null,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    });

    const input = {
      restoreSecret: RESTORE_SECRET,
      accountId,
      workspaceId,
      checkoutSessionIds: [monthlyCheckoutId, lifetimeCheckoutId],
    };
    await expect(test.query(anyApi.backup.stripeSandboxAttestation, {
      ...input,
      phase: "access-granted",
    })).resolves.toMatchObject({
      identityReady: true,
      accessGranted: true,
      exactPurchaseCount: 2,
      exactLicenceCount: 6,
      exactEntitlementCount: 6,
      exactSeatCount: 6,
    });

    await test.run(async (ctx) => {
      await ctx.db.insert("licences", {
        id: "licence:stripe:cs_test_monthly_exact:unexpected",
        workspaceId,
        purchaseId: `purchase:stripe:${monthlyCheckoutId}`,
        subscriptionId,
        productRef: "unexpected",
        status: "active",
        startsAt: now,
        expiresAt: now + 86_400_000,
        updatesUntil: now + 86_400_000,
        seatLimit: 1,
        createdAt: now,
        updatedAt: now,
      });
    });
    await expect(test.query(anyApi.backup.stripeSandboxAttestation, {
      ...input,
      phase: "access-granted",
    })).rejects.toThrow("Sandbox attestation is unavailable");
    await test.run(async (ctx) => {
      const extra = await ctx.db
        .query("licences")
        .withIndex("by_custom_id", (q) =>
          q.eq("id", "licence:stripe:cs_test_monthly_exact:unexpected"))
        .unique();
      await ctx.db.delete(extra!._id);
      const blocksLicence = await ctx.db
        .query("licences")
        .withIndex("by_custom_id", (q) =>
          q.eq(
            "id",
            `licence:stripe:${monthlyCheckoutId}:gummy-ui-pro-blocks`,
          ))
        .unique();
      await ctx.db.patch(blocksLicence!._id, {
        startsAt: now + 86_400_000,
      });
    });
    await expect(test.query(anyApi.backup.stripeSandboxAttestation, {
      ...input,
      phase: "access-granted",
    })).rejects.toThrow("Sandbox attestation is unavailable");
    await test.run(async (ctx) => {
      const blocksLicence = await ctx.db
        .query("licences")
        .withIndex("by_custom_id", (q) =>
          q.eq(
            "id",
            `licence:stripe:${monthlyCheckoutId}:gummy-ui-pro-blocks`,
          ))
        .unique();
      await ctx.db.patch(blocksLicence!._id, { startsAt: now });
    });

    await test.run(async (ctx) => {
      const lifetimePurchase = await ctx.db
        .query("purchases")
        .withIndex("by_custom_id", (q) =>
          q.eq("id", `purchase:stripe:${lifetimeCheckoutId}`))
        .unique();
      const subscription = await ctx.db
        .query("subscriptions")
        .withIndex("by_custom_id", (q) => q.eq("id", subscriptionId))
        .unique();
      await ctx.db.patch(lifetimePurchase!._id, {
        status: "refunded",
        updatedAt: now + 100,
      });
      await ctx.db.patch(subscription!._id, {
        status: "canceled",
        canceledAt: now + 100,
        updatedAt: now + 100,
      });
      for (const productRef of productRefs) {
        for (const [checkoutId, status] of [
          [monthlyCheckoutId, "expired"],
          [lifetimeCheckoutId, "revoked"],
        ] as const) {
          const licenceId = `licence:stripe:${checkoutId}:${productRef}`;
          const licence = await ctx.db
            .query("licences")
            .withIndex("by_custom_id", (q) => q.eq("id", licenceId))
            .unique();
          const entitlement = await ctx.db
            .query("entitlements")
            .withIndex("by_custom_id", (q) =>
              q.eq("id", `entitlement:stripe:${checkoutId}:${productRef}`))
            .unique();
          await ctx.db.patch(licence!._id, { status, updatedAt: now + 100 });
          await ctx.db.patch(
            entitlement!._id,
            { status, updatedAt: now + 100 },
          );
          if (checkoutId === lifetimeCheckoutId) {
            const seat = await ctx.db
              .query("licenceSeats")
              .withIndex("by_custom_id", (q) =>
                q.eq(
                  "id",
                  `licence-seat:stripe:${checkoutId}:${productRef}`,
                ))
              .unique();
            await ctx.db.patch(seat!._id, {
              status: "revoked",
              revokedAt: now + 100,
              updatedAt: now + 100,
            });
          }
        }
      }
      await ctx.db.insert("downloadGrants", {
        id: "grant:sandbox-exact-open",
        nonceHash: "b".repeat(64),
        accountId,
        workspaceId,
        releaseId: "release:sandbox-exact-proof",
        entitlementId:
          `entitlement:stripe:${lifetimeCheckoutId}:gummy-ui-pro-blocks`,
        requestFingerprintHash: null,
        expiresAt: now + 86_400_000,
        consumedAt: null,
        revokedAt: null,
        createdAt: now,
      });
    });

    await expect(test.query(anyApi.backup.stripeSandboxAttestation, {
      ...input,
      phase: "access-revoked",
    })).rejects.toThrow("Sandbox attestation is unavailable");

    await test.run(async (ctx) => {
      const grant = await ctx.db
        .query("downloadGrants")
        .withIndex("by_custom_id", (q) =>
          q.eq("id", "grant:sandbox-exact-open"))
        .unique();
      await ctx.db.patch(grant!._id, { revokedAt: now + 200 });
    });
    await expect(test.query(anyApi.backup.stripeSandboxAttestation, {
      ...input,
      phase: "access-revoked",
    })).resolves.toMatchObject({
      identityReady: true,
      accessRevoked: true,
      openGrantCount: 0,
      exactPurchaseCount: 2,
      exactLicenceCount: 6,
      exactEntitlementCount: 6,
      exactSeatCount: 6,
    });
  });
});

function restoreEnvironment(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
