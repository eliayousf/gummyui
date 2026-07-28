import { createHash } from "node:crypto";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import {
  COMMERCE_BACKUP_SCHEMA_VERSION,
  COMMERCE_BACKUP_TABLES,
} from "../lib/commerce/backup-tables";
import { readOperationalRestoreProofConfig } from "../lib/commerce/backup-runtime";

const PROOF_PREFIX = "restore-query-proof-20260728";
const BACKUP_ID = "20260728T170000000Z-0123456789abcdef0123456789abcdef";

async function main(): Promise<void> {
  try {
    const config = readOperationalRestoreProofConfig();
    if (!config) throw new Error("Restore proof is not configured");
    const client = new ConvexHttpClient(config.targetUrl, { logger: false });
    const initialStatus = await client.query(anyApi.backup.restoreStatus, {
      restoreSecret: config.restoreSecret,
    }) as {
      empty: boolean;
      nonEmptyTableCount: number;
      schemaVersion: string;
      tableCount: number;
      targetClass: string;
    };
    if (
      !initialStatus.empty
      || initialStatus.nonEmptyTableCount !== 0
      || initialStatus.schemaVersion !== COMMERCE_BACKUP_SCHEMA_VERSION
      || initialStatus.tableCount !== COMMERCE_BACKUP_TABLES.length
      || initialStatus.targetClass !== "isolated-test"
    ) {
      throw new Error("Isolated query-proof target is not empty");
    }

    const now = Date.now();
    const releaseId = `release:${PROOF_PREFIX}`;
    const completedTables: string[] = [];
    for (const table of COMMERCE_BACKUP_TABLES) {
      const records = table === "releaseRecords"
        ? [{
            id: releaseId,
            productRef: "gummy-ui-pro-blocks",
            version: "0.0.0-restore-proof",
            storageKey: "restore-proof/not-a-customer-release.zip",
            checksumSha256: "a".repeat(64),
            sizeBytes: 1_024,
            status: "published",
            releasedAt: now - 60_000,
            withdrawnAt: null,
            createdAt: now - 60_000,
            updatedAt: now - 60_000,
          }]
        : [];
      await client.mutation(anyApi.backup.restoreTable, {
        restoreSecret: config.restoreSecret,
        backupId: BACKUP_ID,
        table,
        schemaVersion: COMMERCE_BACKUP_SCHEMA_VERSION,
        records,
        completedTables: [...completedTables],
      });
      completedTables.push(table);
    }

    const accountId = `account:${PROOF_PREFIX}`;
    const workspaceId = `workspace:${PROOF_PREFIX}`;
    const execute = (operation: string, input: unknown) =>
      client.mutation(anyApi.commerce.execute, {
        serverSecret: config.targetServerSecret,
        operation,
        input,
      });
    await execute("workos.identity.provision", {
      userId: `user_${PROOF_PREFIX}`,
      accountId,
      workspaceId,
      organizationId: null,
      providerMembershipId: null,
      emailHash: "b".repeat(64),
      displayName: "Restore proof",
      locale: "en-GB",
      workspaceLabel: "Isolated restore proof",
      role: "owner",
      currentSince: now,
    });
    await execute("stripe.fulfillment.apply", {
      providerEventId: `evt_${PROOF_PREFIX}_checkout`,
      providerEventType: "checkout.session.completed",
      providerOccurredAt: now,
      receivedAt: now + 1,
      payloadHash: "c".repeat(64),
      checkoutSessionId: `cs_${PROOF_PREFIX}`,
      stripeCustomerId: `cus_${PROOF_PREFIX}`,
      stripePaymentIntentId: `pi_${PROOF_PREFIX}`,
      stripeSubscriptionId: null,
      accountId,
      workspaceId,
      planId: "individual-lifetime",
      billingInterval: "one_time",
      purchaseStatus: "completed",
      currency: "USD",
      amountMinor: 7_900,
      purchasedAt: now,
      consentCapturedAt: now,
      consentPolicyVersion: "2026-07-27",
      seatLimit: 1,
      entitlementScope: "account",
      subscriptionCurrentPeriodStartsAt: null,
      subscriptionCurrentPeriodEndsAt: null,
      subscriptionCancelAtPeriodEnd: false,
      updatesUntil: null,
      productRefs: ["gummy-ui-pro-blocks"],
    });

    const access = { accountId, workspaceId, role: "owner" };
    const queryItemCounts = Object.fromEntries(
      await Promise.all(
        ["overview", "downloads", "team", "security"].map(async (route) => {
          const items = await execute("account.section", {
            route,
            access,
            now: now + 2,
          }) as unknown[];
          if (!Array.isArray(items) || items.length === 0) {
            throw new Error("Representative account query returned no evidence");
          }
          return [route, items.length] as const;
        }),
      ),
    );

    const authorized = await execute("downloads.find-authorized", {
      ...access,
      releaseId,
      now: now + 3,
    }) as { entitlementId?: unknown; releaseId?: unknown } | null;
    if (
      !authorized
      || authorized.releaseId !== releaseId
      || typeof authorized.entitlementId !== "string"
    ) {
      throw new Error("Synthetic entitlement did not authorize the release");
    }

    const entitlementId = authorized.entitlementId;
    await execute("downloads.register", {
      grantId: `grant:${PROOF_PREFIX}:one-use`,
      nonceHash: "d".repeat(64),
      accountId,
      workspaceId,
      releaseId,
      entitlementId,
      fingerprintHash: null,
      expiresAt: now + 60_000,
      createdAt: now + 4,
    });
    const consumed = await execute("downloads.consume", {
      ...access,
      releaseId,
      entitlementId,
      nonceHash: "d".repeat(64),
      now: now + 5,
    });
    const replay = await execute("downloads.consume", {
      ...access,
      releaseId,
      entitlementId,
      nonceHash: "d".repeat(64),
      now: now + 6,
    });
    if (!consumed || replay !== null) {
      throw new Error("One-use download grant proof failed");
    }

    await execute("downloads.register", {
      grantId: `grant:${PROOF_PREFIX}:expired`,
      nonceHash: "e".repeat(64),
      accountId,
      workspaceId,
      releaseId,
      entitlementId,
      fingerprintHash: null,
      expiresAt: now + 8,
      createdAt: now + 7,
    });
    const expired = await execute("downloads.consume", {
      ...access,
      releaseId,
      entitlementId,
      nonceHash: "e".repeat(64),
      now: now + 9,
    });
    if (expired !== null) {
      throw new Error("Expired download grant was accepted");
    }

    await execute("stripe.adjustment.apply", {
      providerEventId: `evt_${PROOF_PREFIX}_refund`,
      providerEventType: "refund.updated",
      providerOccurredAt: now + 10,
      receivedAt: now + 11,
      payloadHash: "f".repeat(64),
      stripeAdjustmentId: `re_${PROOF_PREFIX}`,
      stripePaymentIntentId: `pi_${PROOF_PREFIX}`,
      kind: "refund",
      adjustmentStatus: "processed",
      amountMinor: 7_900,
      currency: "USD",
      fullRefund: true,
      accessAction: "revoke",
    });
    const revoked = await execute("downloads.find-authorized", {
      ...access,
      releaseId,
      now: now + 12,
    });
    if (revoked !== null) {
      throw new Error("Refund did not revoke synthetic access");
    }

    const auditExport = await client.query(anyApi.backup.exportTable, {
      serverSecret: config.targetServerSecret,
      table: "auditEvents",
    }) as { records?: unknown[] };
    if (!Array.isArray(auditExport.records) || auditExport.records.length < 3) {
      throw new Error("Synthetic audit trail is incomplete");
    }

    process.stdout.write(`${JSON.stringify({
      ok: true,
      evidence: {
        schemaVersion: COMMERCE_BACKUP_SCHEMA_VERSION,
        targetClass: "isolated-test",
        targetFingerprint: createHash("sha256")
          .update(config.targetUrl)
          .digest("hex"),
        restoredTableCount: completedTables.length,
        seededReleaseCount: 1,
        queryItemCounts,
        paidAccessAuthorized: true,
        oneUseGrantConsumed: true,
        replayDenied: true,
        expiredGrantDenied: true,
        refundedAccessDenied: true,
        auditEventCount: auditExport.records.length,
        externalIntegrationsInvoked: false,
      },
    })}\n`);
  } catch {
    process.stderr.write(`${JSON.stringify({
      ok: false,
      error: "isolated_restore_query_proof_failed",
    })}\n`);
    process.exitCode = 1;
  }
}

await main();
