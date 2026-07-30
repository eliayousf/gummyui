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
const sandboxAccountId =
  /^account:(?:sandbox|restore-query-proof-)[A-Za-z0-9._:-]{4,240}$/u;
const sandboxWorkspaceId =
  /^workspace:(?:sandbox|restore-query-proof-)[A-Za-z0-9._:-]{4,240}$/u;
const sandboxCheckoutId = /^cs_test_[A-Za-z0-9_]{4,240}$/u;
const sandboxTestClockRunId = /^gummyui-clock-[a-f0-9]{32}$/u;
const stripeCustomerId = /^cus_[A-Za-z0-9_]{6,240}$/u;
const stripeSubscriptionId = /^sub_[A-Za-z0-9_]{6,240}$/u;
const paidProductRefs = [
  "gummy-ui-pro-blocks",
  "gummy-ui-pro-templates",
  "gummy-ui-pro-design-kit",
] as const;

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

export const stripeSandboxAttestation = queryGeneric({
  args: {
    restoreSecret: v.string(),
    phase: v.union(
      v.literal("identity"),
      v.literal("access-granted"),
      v.literal("access-revoked"),
    ),
    accountId: v.string(),
    workspaceId: v.string(),
    checkoutSessionIds: v.optional(v.array(v.string())),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    assertRestoreAllowed(args.restoreSecret);
    const needsCheckoutEvidence = args.phase !== "identity";
    if (
      !sandboxAccountId.test(args.accountId)
      || !sandboxWorkspaceId.test(args.workspaceId)
      || (
        needsCheckoutEvidence
          ? args.checkoutSessionIds?.length !== 2
            || args.checkoutSessionIds.some((id) =>
              !sandboxCheckoutId.test(id))
          : args.checkoutSessionIds !== undefined
      )
    ) {
      throw new Error("Sandbox attestation is unavailable");
    }

    const account = await ctx.db
      .query("accounts")
      .withIndex("by_custom_id", (q) => q.eq("id", args.accountId))
      .unique();
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_custom_id", (q) => q.eq("id", args.workspaceId))
      .unique();
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_account", (q) => q.eq("accountId", args.accountId))
      .filter((q) =>
        q.eq(q.field("workspaceId"), args.workspaceId))
      .unique();
    if (
      account?.status !== "active"
      || workspace?.status !== "active"
      || membership?.status !== "active"
      || membership.role !== "owner"
    ) {
      throw new Error("Sandbox attestation is unavailable");
    }

    const base = {
      schemaVersion: COMMERCE_BACKUP_SCHEMA_VERSION,
      tableCount: COMMERCE_BACKUP_TABLES.length,
      targetClass: "isolated-test" as const,
      identityReady: true as const,
      phase: args.phase,
    };
    if (args.phase === "identity") return base;

    const checkoutSessionIds = args.checkoutSessionIds!;
    const exactEntitlementIds: string[] = [];
    const exactLicenceIds: string[] = [];
    const monthlySubscriptionIds = new Set<string>();
    const blockAccessWindows: Array<{
      licenceStartsAt: number;
      licenceExpiresAt: number | null | undefined;
      licenceUpdatesUntil: number | null | undefined;
      entitlementValidFrom: number;
      entitlementValidUntil: number | null | undefined;
      entitlementUpdatesUntil: number | null | undefined;
    }> = [];
    let licenceCount = 0;
    let entitlementCount = 0;
    let seatCount = 0;

    for (const [checkoutIndex, checkoutSessionId] of
      checkoutSessionIds.entries()) {
      const purchaseId = `purchase:stripe:${checkoutSessionId}`;
      const expectedPlan = checkoutIndex === 0
        ? "individual-monthly"
        : "individual-lifetime";
      const purchase = await ctx.db
        .query("purchases")
        .withIndex("by_custom_id", (q) => q.eq("id", purchaseId))
        .unique();
      const expectedPurchaseStatus =
        args.phase === "access-revoked" && checkoutIndex === 1
          ? "refunded"
          : "completed";
      if (
        purchase?.billingProvider !== "stripe"
        || purchase.providerPurchaseId !== checkoutSessionId
        || purchase.accountId !== args.accountId
        || purchase.workspaceId !== args.workspaceId
        || purchase.productRef !== expectedPlan
        || purchase.status !== expectedPurchaseStatus
      ) {
        throw new Error("Sandbox attestation is unavailable");
      }

      const expectedLicenceIds = paidProductRefs.map((productRef) =>
        `licence:stripe:${checkoutSessionId}:${productRef}`);
      const linkedLicences = await ctx.db
        .query("licences")
        .withIndex("by_purchase", (q) => q.eq("purchaseId", purchaseId))
        .collect();
      if (
        linkedLicences.length !== expectedLicenceIds.length
        || linkedLicences.some((licence) =>
          !expectedLicenceIds.includes(licence.id))
      ) {
        throw new Error("Sandbox attestation is unavailable");
      }

      for (const productRef of paidProductRefs) {
        const licenceId =
          `licence:stripe:${checkoutSessionId}:${productRef}`;
        const entitlementId =
          `entitlement:stripe:${checkoutSessionId}:${productRef}`;
        const seatId =
          `licence-seat:stripe:${checkoutSessionId}:${productRef}`;
        const [licence, entitlement, seat] = await Promise.all([
          ctx.db
            .query("licences")
            .withIndex("by_custom_id", (q) => q.eq("id", licenceId))
            .unique(),
          ctx.db
            .query("entitlements")
            .withIndex("by_custom_id", (q) => q.eq("id", entitlementId))
            .unique(),
          ctx.db
            .query("licenceSeats")
            .withIndex("by_custom_id", (q) => q.eq("id", seatId))
            .unique(),
        ]);
        const [linkedEntitlements, linkedSeats] = await Promise.all([
          ctx.db
            .query("entitlements")
            .withIndex("by_licence", (q) => q.eq("licenceId", licenceId))
            .collect(),
          ctx.db
            .query("licenceSeats")
            .withIndex("by_licence", (q) => q.eq("licenceId", licenceId))
            .collect(),
        ]);
        const expectedAccessStatus = args.phase === "access-granted"
          ? "active"
          : checkoutIndex === 0
            ? "expired"
            : "revoked";
        const expectedSeatStatus =
          args.phase === "access-revoked" && checkoutIndex === 1
            ? "revoked"
            : "active";
        if (
          !licence
          || licence.purchaseId !== purchaseId
          || licence.workspaceId !== args.workspaceId
          || licence.productRef !== productRef
          || licence.status !== expectedAccessStatus
          || !entitlement
          || entitlement.licenceId !== licenceId
          || entitlement.workspaceId !== args.workspaceId
          || entitlement.accountId !== args.accountId
          || entitlement.productRef !== productRef
          || entitlement.status !== expectedAccessStatus
          || !seat
          || seat.licenceId !== licenceId
          || seat.accountId !== args.accountId
          || seat.status !== expectedSeatStatus
          || linkedEntitlements.length !== 1
          || linkedEntitlements[0].id !== entitlementId
          || linkedSeats.length !== 1
          || linkedSeats[0].id !== seatId
        ) {
          throw new Error("Sandbox attestation is unavailable");
        }
        if (checkoutIndex === 0) {
          if (!licence.subscriptionId) {
            throw new Error("Sandbox attestation is unavailable");
          }
          monthlySubscriptionIds.add(licence.subscriptionId);
        } else if (licence.subscriptionId !== null) {
          throw new Error("Sandbox attestation is unavailable");
        }
        if (productRef === "gummy-ui-pro-blocks") {
          blockAccessWindows.push({
            licenceStartsAt: licence.startsAt,
            licenceExpiresAt: licence.expiresAt,
            licenceUpdatesUntil: licence.updatesUntil,
            entitlementValidFrom: entitlement.validFrom,
            entitlementValidUntil: entitlement.validUntil,
            entitlementUpdatesUntil: entitlement.updatesUntil,
          });
        }
        exactLicenceIds.push(licenceId);
        exactEntitlementIds.push(entitlementId);
        licenceCount += 1;
        entitlementCount += 1;
        seatCount += 1;
      }
    }

    if (monthlySubscriptionIds.size !== 1) {
      throw new Error("Sandbox attestation is unavailable");
    }
    const subscriptionId = [...monthlySubscriptionIds][0];
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_custom_id", (q) => q.eq("id", subscriptionId))
      .unique();
    if (
      subscription?.workspaceId !== args.workspaceId
      || subscription.accountId !== args.accountId
      || subscription.planRef !== "individual-monthly"
      || subscription.status !== (
        args.phase === "access-granted" ? "active" : "canceled"
      )
    ) {
      throw new Error("Sandbox attestation is unavailable");
    }
    const subscriptionLicences = await ctx.db
      .query("licences")
      .withIndex("by_subscription", (q) =>
        q.eq("subscriptionId", subscriptionId))
      .collect();
    const expectedMonthlyLicenceIds = paidProductRefs.map((productRef) =>
      `licence:stripe:${checkoutSessionIds[0]}:${productRef}`);
    if (
      subscriptionLicences.length !== expectedMonthlyLicenceIds.length
      || subscriptionLicences.some((licence) =>
        !expectedMonthlyLicenceIds.includes(licence.id))
    ) {
      throw new Error("Sandbox attestation is unavailable");
    }

    const workspaceLicences = await ctx.db
      .query("licences")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
    const workspaceEntitlements = await ctx.db
      .query("entitlements")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
    const expectedActiveLicenceIds = args.phase === "access-granted"
      ? exactLicenceIds
      : [];
    const expectedActiveEntitlementIds = args.phase === "access-granted"
      ? exactEntitlementIds
      : [];
    const activeLicenceIds = workspaceLicences
      .filter((licence) => licence.status === "active")
      .map((licence) => licence.id);
    const activeEntitlementIds = workspaceEntitlements
      .filter((entitlement) => entitlement.status === "active")
      .map((entitlement) => entitlement.id);
    if (
      activeLicenceIds.length !== expectedActiveLicenceIds.length
      || activeLicenceIds.some((id) => !expectedActiveLicenceIds.includes(id))
      || activeEntitlementIds.length !== expectedActiveEntitlementIds.length
      || activeEntitlementIds.some((id) =>
        !expectedActiveEntitlementIds.includes(id))
    ) {
      throw new Error("Sandbox attestation is unavailable");
    }

    const openGrantCounts = await Promise.all(exactEntitlementIds.map(
      async (entitlementId) => {
        const grants = await ctx.db
          .query("downloadGrants")
          .withIndex("by_entitlement", (q) =>
            q.eq("entitlementId", entitlementId))
          .collect();
        const now = Date.now();
        return grants.filter((grant) =>
          grant.consumedAt === null
          && grant.revokedAt === null
          && grant.expiresAt > now).length;
      },
    ));
    const openGrantCount = openGrantCounts.reduce(
      (total, count) => total + count,
      0,
    );
    const releasedBlocks = await ctx.db
      .query("releaseRecords")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .filter((q) =>
        q.eq(q.field("productRef"), "gummy-ui-pro-blocks"))
      .collect();
    const now = Date.now();
    const protectedReleaseAvailable = releasedBlocks.some((release) =>
      typeof release.releasedAt === "number"
      && release.releasedAt <= now
      && release.withdrawnAt === null);
    const protectedReleaseAuthorized = args.phase === "access-granted"
      && blockAccessWindows.length === 2
      && releasedBlocks.some((release) =>
        typeof release.releasedAt === "number"
        && release.releasedAt <= now
        && release.withdrawnAt === null
        && blockAccessWindows.every((access) =>
          access.licenceStartsAt <= now
          && (
            access.licenceExpiresAt == null
            || access.licenceExpiresAt > now
          )
          && (
            access.licenceUpdatesUntil == null
            || release.releasedAt! <= access.licenceUpdatesUntil
          )
          && access.entitlementValidFrom <= now
          && (
            access.entitlementValidUntil == null
            || access.entitlementValidUntil > now
          )
          && (
            access.entitlementUpdatesUntil == null
            || release.releasedAt! <= access.entitlementUpdatesUntil
          )));
    if (
      licenceCount !== 6
      || entitlementCount !== 6
      || seatCount !== 6
      || !protectedReleaseAvailable
      || (
        args.phase === "access-granted"
        && !protectedReleaseAuthorized
      )
      || (args.phase === "access-revoked" && openGrantCount !== 0)
    ) {
      throw new Error("Sandbox attestation is unavailable");
    }

    return {
      ...base,
      exactPurchaseCount: 2,
      exactLicenceCount: licenceCount,
      exactEntitlementCount: entitlementCount,
      exactSeatCount: seatCount,
      openGrantCount,
      protectedReleaseAvailable: true,
      ...(args.phase === "access-granted"
        ? { protectedReleaseAuthorized: true as const }
        : {}),
      ...(args.phase === "access-granted"
        ? { accessGranted: true as const }
        : { accessRevoked: true as const }),
    };
  },
});

export const seedStripeTestClockSubscription = mutationGeneric({
  args: {
    restoreSecret: v.string(),
    runId: v.string(),
    accountId: v.string(),
    workspaceId: v.string(),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    currentPeriodStartsAt: v.number(),
    currentPeriodEndsAt: v.number(),
    providerOccurredAt: v.number(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    assertRestoreAllowed(args.restoreSecret);
    if (
      !sandboxTestClockRunId.test(args.runId)
      || !sandboxAccountId.test(args.accountId)
      || !sandboxWorkspaceId.test(args.workspaceId)
      || !stripeCustomerId.test(args.stripeCustomerId)
      || !stripeSubscriptionId.test(args.stripeSubscriptionId)
      || !Number.isSafeInteger(args.currentPeriodStartsAt)
      || !Number.isSafeInteger(args.currentPeriodEndsAt)
      || args.currentPeriodStartsAt <= 0
      || args.currentPeriodEndsAt <= args.currentPeriodStartsAt
      || !Number.isSafeInteger(args.providerOccurredAt)
      || args.providerOccurredAt <= 0
    ) {
      throw new Error("Stripe test-clock seed is unavailable");
    }

    const subscriptionRecordId =
      `subscription:stripe:${args.stripeSubscriptionId}`;
    const existingSubscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_custom_id", (q) =>
        q.eq("id", subscriptionRecordId))
      .unique();
    if (existingSubscription) {
      const existingLicences = await ctx.db
        .query("licences")
        .withIndex("by_subscription", (q) =>
          q.eq("subscriptionId", subscriptionRecordId))
        .collect();
      if (
        existingSubscription.id !== subscriptionRecordId
        || existingSubscription.billingProvider !== "stripe"
        || existingSubscription.providerSubscriptionId
          !== args.stripeSubscriptionId
        || existingSubscription.accountId !== args.accountId
        || existingSubscription.workspaceId !== args.workspaceId
        || existingSubscription.planRef !== "individual-monthly"
        || existingLicences.length !== paidProductRefs.length
      ) {
        throw new Error("Stripe test-clock seed is unavailable");
      }
      return {
        targetClass: "isolated-test",
        seeded: true,
        duplicate: true,
      };
    }

    const [account, workspace, billingCustomer] = await Promise.all([
      ctx.db
        .query("accounts")
        .withIndex("by_custom_id", (q) => q.eq("id", args.accountId))
        .unique(),
      ctx.db
        .query("workspaces")
        .withIndex("by_custom_id", (q) => q.eq("id", args.workspaceId))
        .unique(),
      ctx.db
        .query("billingCustomers")
        .withIndex("by_custom_id", (q) =>
          q.eq(
            "id",
            `billing-customer:stripe:${args.stripeCustomerId}`,
          ))
        .unique(),
    ]);
    if (account || workspace || billingCustomer) {
      throw new Error("Stripe test-clock seed is unavailable");
    }

    const now = Date.now();
    await ctx.db.insert("accounts", {
      id: args.accountId,
      identityProvider: "stripe-test-clock",
      identitySubject: args.runId,
      emailHash: null,
      status: "active",
      deactivatedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("workspaces", {
      id: args.workspaceId,
      identityProvider: null,
      providerOrganizationId: null,
      name: "Stripe test-clock workspace",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("memberships", {
      id: `membership:test-clock:${args.runId}`,
      workspaceId: args.workspaceId,
      accountId: args.accountId,
      providerMembershipId: null,
      role: "owner",
      status: "active",
      currentSince: now,
      revokedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("billingCustomers", {
      id: `billing-customer:stripe:${args.stripeCustomerId}`,
      workspaceId: args.workspaceId,
      accountId: args.accountId,
      billingProvider: "stripe",
      providerCustomerId: args.stripeCustomerId,
      status: "active",
      providerOccurredAt: args.providerOccurredAt,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("subscriptions", {
      id: subscriptionRecordId,
      billingProvider: "stripe",
      providerSubscriptionId: args.stripeSubscriptionId,
      workspaceId: args.workspaceId,
      accountId: args.accountId,
      planRef: "individual-monthly",
      status: "active",
      currentPeriodStartsAt: args.currentPeriodStartsAt,
      currentPeriodEndsAt: args.currentPeriodEndsAt,
      cancelAtPeriodEnd: false,
      canceledAt: null,
      providerOccurredAt: args.providerOccurredAt,
      createdAt: now,
      updatedAt: now,
    });

    for (const productRef of paidProductRefs) {
      const licenceId =
        `licence:stripe-test-clock:${args.runId}:${productRef}`;
      await ctx.db.insert("licences", {
        id: licenceId,
        workspaceId: args.workspaceId,
        purchaseId: null,
        subscriptionId: subscriptionRecordId,
        productRef,
        status: "active",
        startsAt: args.currentPeriodStartsAt,
        expiresAt: args.currentPeriodEndsAt,
        updatesUntil: args.currentPeriodEndsAt,
        seatLimit: 1,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("entitlements", {
        id: `entitlement:stripe-test-clock:${args.runId}:${productRef}`,
        workspaceId: args.workspaceId,
        accountId: args.accountId,
        licenceId,
        productRef,
        status: "active",
        validFrom: args.currentPeriodStartsAt,
        validUntil: args.currentPeriodEndsAt,
        updatesUntil: args.currentPeriodEndsAt,
        sourceEventId: null,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("licenceSeats", {
        id: `licence-seat:stripe-test-clock:${args.runId}:${productRef}`,
        licenceId,
        accountId: args.accountId,
        status: "active",
        assignedAt: now,
        revokedAt: null,
        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      targetClass: "isolated-test",
      seeded: true,
      duplicate: false,
    };
  },
});

export const attestStripeTestClockSubscription = queryGeneric({
  args: {
    restoreSecret: v.string(),
    runId: v.string(),
    accountId: v.string(),
    workspaceId: v.string(),
    stripeSubscriptionId: v.string(),
    phase: v.union(
      v.literal("seeded"),
      v.literal("renewed"),
      v.literal("payment-failed"),
      v.literal("canceled"),
    ),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    assertRestoreAllowed(args.restoreSecret);
    if (
      !sandboxTestClockRunId.test(args.runId)
      || !sandboxAccountId.test(args.accountId)
      || !sandboxWorkspaceId.test(args.workspaceId)
      || !stripeSubscriptionId.test(args.stripeSubscriptionId)
    ) {
      throw new Error("Stripe test-clock attestation is unavailable");
    }
    const subscriptionRecordId =
      `subscription:stripe:${args.stripeSubscriptionId}`;
    const [account, workspace, subscription, licences, invoices] =
      await Promise.all([
        ctx.db
          .query("accounts")
          .withIndex("by_custom_id", (q) => q.eq("id", args.accountId))
          .unique(),
        ctx.db
          .query("workspaces")
          .withIndex("by_custom_id", (q) => q.eq("id", args.workspaceId))
          .unique(),
        ctx.db
          .query("subscriptions")
          .withIndex("by_custom_id", (q) =>
            q.eq("id", subscriptionRecordId))
          .unique(),
        ctx.db
          .query("licences")
          .withIndex("by_subscription", (q) =>
            q.eq("subscriptionId", subscriptionRecordId))
          .collect(),
        ctx.db
          .query("invoices")
          .withIndex("by_subscription", (q) =>
            q.eq("subscriptionId", subscriptionRecordId))
          .collect(),
      ]);
    const expectedSubscriptionStatus = args.phase === "payment-failed"
      ? "past_due"
      : args.phase === "canceled"
        ? "canceled"
        : "active";
    const expectedAccessStatus = args.phase === "payment-failed"
      ? "suspended"
      : args.phase === "canceled"
        ? "expired"
        : "active";
    if (
      account?.status !== "active"
      || workspace?.status !== "active"
      || subscription?.billingProvider !== "stripe"
      || subscription.providerSubscriptionId !== args.stripeSubscriptionId
      || subscription.accountId !== args.accountId
      || subscription.workspaceId !== args.workspaceId
      || subscription.planRef !== "individual-monthly"
      || subscription.status !== expectedSubscriptionStatus
      || licences.length !== paidProductRefs.length
      || licences.some((licence) =>
        licence.status !== expectedAccessStatus
        || licence.workspaceId !== args.workspaceId
        || !paidProductRefs.includes(
          licence.productRef as typeof paidProductRefs[number],
        ))
    ) {
      throw new Error("Stripe test-clock attestation is unavailable");
    }

    for (const licence of licences) {
      const [entitlements, seats] = await Promise.all([
        ctx.db
          .query("entitlements")
          .withIndex("by_licence", (q) =>
            q.eq("licenceId", licence.id))
          .collect(),
        ctx.db
          .query("licenceSeats")
          .withIndex("by_licence", (q) =>
            q.eq("licenceId", licence.id))
          .collect(),
      ]);
      if (
        entitlements.length !== 1
        || entitlements[0].status !== expectedAccessStatus
        || entitlements[0].accountId !== args.accountId
        || seats.length !== 1
        || seats[0].status !== "active"
        || seats[0].accountId !== args.accountId
      ) {
        throw new Error("Stripe test-clock attestation is unavailable");
      }
    }

    const paidInvoices = invoices.filter((invoice) =>
      invoice.status === "paid");
    const openInvoices = invoices.filter((invoice) =>
      invoice.status === "open");
    const expectedPaid = args.phase === "seeded" ? 0 : 1;
    const expectedOpen =
      args.phase === "payment-failed" || args.phase === "canceled" ? 1 : 0;
    if (
      invoices.length !== expectedPaid + expectedOpen
      || paidInvoices.length !== expectedPaid
      || openInvoices.length !== expectedOpen
      || invoices.some((invoice) =>
        invoice.billingProvider !== "stripe"
        || invoice.currency !== "USD"
        || invoice.totalMinor !== 4_900)
    ) {
      throw new Error("Stripe test-clock attestation is unavailable");
    }

    return {
      targetClass: "isolated-test",
      phase: args.phase,
      exactLicenceCount: licences.length,
      exactEntitlementCount: licences.length,
      exactSeatCount: licences.length,
      paidRenewalCount: paidInvoices.length,
      failedInvoiceCount: openInvoices.length,
      accessStatus: expectedAccessStatus,
      attested: true,
    };
  },
});

export const attestStripeTestClockCheckout = queryGeneric({
  args: {
    restoreSecret: v.string(),
    accountId: v.string(),
    workspaceId: v.string(),
    checkoutSessionId: v.string(),
    phase: v.union(
      v.literal("checkout-active"),
      v.literal("renewal-paid"),
      v.literal("payment-failed"),
      v.literal("canceled"),
    ),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    assertRestoreAllowed(args.restoreSecret);
    if (
      !sandboxAccountId.test(args.accountId)
      || !sandboxWorkspaceId.test(args.workspaceId)
      || !sandboxCheckoutId.test(args.checkoutSessionId)
    ) {
      throw new Error("Stripe test-clock checkout attestation is unavailable");
    }
    const purchaseId = `purchase:stripe:${args.checkoutSessionId}`;
    const purchase = await ctx.db
      .query("purchases")
      .withIndex("by_custom_id", (q) => q.eq("id", purchaseId))
      .unique();
    const licences = await ctx.db
      .query("licences")
      .withIndex("by_purchase", (q) => q.eq("purchaseId", purchaseId))
      .collect();
    const expectedAccessStatus = args.phase === "payment-failed"
      ? "suspended"
      : args.phase === "canceled"
        ? "expired"
        : "active";
    const subscriptionIds = new Set(
      licences.map((licence) => licence.subscriptionId),
    );
    if (
      purchase?.billingProvider !== "stripe"
      || purchase.providerPurchaseId !== args.checkoutSessionId
      || purchase.accountId !== args.accountId
      || purchase.workspaceId !== args.workspaceId
      || purchase.productRef !== "individual-monthly"
      || purchase.status !== "completed"
      || licences.length !== paidProductRefs.length
      || subscriptionIds.size !== 1
      || [...subscriptionIds][0] == null
      || licences.some((licence) =>
        licence.status !== expectedAccessStatus
        || licence.workspaceId !== args.workspaceId
        || !paidProductRefs.includes(
          licence.productRef as typeof paidProductRefs[number],
        ))
    ) {
      throw new Error("Stripe test-clock checkout attestation is unavailable");
    }
    const subscriptionId = [...subscriptionIds][0]!;
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_custom_id", (q) => q.eq("id", subscriptionId))
      .unique();
    const expectedSubscriptionStatus = args.phase === "payment-failed"
      ? "past_due"
      : args.phase === "canceled"
        ? "canceled"
        : "active";
    if (
      subscription?.workspaceId !== args.workspaceId
      || subscription.accountId !== args.accountId
      || subscription.planRef !== "individual-monthly"
      || subscription.status !== expectedSubscriptionStatus
    ) {
      throw new Error("Stripe test-clock checkout attestation is unavailable");
    }

    let openGrantCount = 0;
    for (const licence of licences) {
      const [entitlements, seats] = await Promise.all([
        ctx.db
          .query("entitlements")
          .withIndex("by_licence", (q) =>
            q.eq("licenceId", licence.id))
          .collect(),
        ctx.db
          .query("licenceSeats")
          .withIndex("by_licence", (q) =>
            q.eq("licenceId", licence.id))
          .collect(),
      ]);
      if (
        entitlements.length !== 1
        || entitlements[0].status !== expectedAccessStatus
        || entitlements[0].accountId !== args.accountId
        || seats.length !== 1
        || seats[0].status !== "active"
        || seats[0].accountId !== args.accountId
      ) {
        throw new Error(
          "Stripe test-clock checkout attestation is unavailable",
        );
      }
      const grants = await ctx.db
        .query("downloadGrants")
        .withIndex("by_entitlement", (q) =>
          q.eq("entitlementId", entitlements[0].id))
        .collect();
      const now = Date.now();
      openGrantCount += grants.filter((grant) =>
        grant.consumedAt === null
        && grant.revokedAt === null
        && grant.expiresAt > now).length;
    }

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_subscription", (q) =>
        q.eq("subscriptionId", subscriptionId))
      .collect();
    const paidInvoices = invoices.filter((invoice) =>
      invoice.status === "paid");
    const openInvoices = invoices.filter((invoice) =>
      invoice.status === "open");
    const expectedPaid = args.phase === "checkout-active" ? 0 : 1;
    const expectedOpen =
      args.phase === "payment-failed" || args.phase === "canceled" ? 1 : 0;
    if (
      invoices.length !== expectedPaid + expectedOpen
      || paidInvoices.length !== expectedPaid
      || openInvoices.length !== expectedOpen
      || invoices.some((invoice) =>
        invoice.billingProvider !== "stripe"
        || invoice.currency !== "USD"
        || invoice.totalMinor < 4_900)
      || (
        (args.phase === "payment-failed" || args.phase === "canceled")
        && openGrantCount !== 0
      )
    ) {
      throw new Error("Stripe test-clock checkout attestation is unavailable");
    }

    return {
      targetClass: "isolated-test",
      phase: args.phase,
      exactPurchaseCount: 1,
      exactLicenceCount: licences.length,
      exactEntitlementCount: licences.length,
      exactSeatCount: licences.length,
      paidRenewalCount: paidInvoices.length,
      failedInvoiceCount: openInvoices.length,
      openGrantCount,
      accessStatus: expectedAccessStatus,
      attested: true,
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
