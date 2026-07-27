import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const now = sql`(unixepoch() * 1000)`;

const createdAndUpdated = () => ({
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(now),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(now),
});

export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    identityProvider: text("identity_provider").notNull(),
    identitySubject: text("identity_subject").notNull(),
    emailHash: text("email_hash"),
    status: text("status").notNull().default("active"),
    deactivatedAt: integer("deactivated_at", { mode: "timestamp_ms" }),
    ...createdAndUpdated(),
  },
  (table) => [
    uniqueIndex("accounts_identity_subject_unique").on(
      table.identityProvider,
      table.identitySubject,
    ),
    index("accounts_status_idx").on(table.status),
    check(
      "accounts_status_check",
      sql`${table.status} in ('active', 'disabled', 'deletion_pending', 'deleted')`,
    ),
  ],
);

export const profiles = sqliteTable(
  "profiles",
  {
    accountId: text("account_id")
      .primaryKey()
      .references(() => accounts.id, { onDelete: "cascade" }),
    displayName: text("display_name"),
    locale: text("locale"),
    timeZone: text("time_zone"),
    ...createdAndUpdated(),
  },
);

export const workspaces = sqliteTable(
  "workspaces",
  {
    id: text("id").primaryKey(),
    identityProvider: text("identity_provider"),
    providerOrganizationId: text("provider_organization_id"),
    name: text("name").notNull(),
    status: text("status").notNull().default("active"),
    ...createdAndUpdated(),
  },
  (table) => [
    uniqueIndex("workspaces_provider_organization_unique").on(
      table.identityProvider,
      table.providerOrganizationId,
    ),
    index("workspaces_status_idx").on(table.status),
    check(
      "workspaces_status_check",
      sql`${table.status} in ('active', 'suspended', 'deletion_pending', 'deleted')`,
    ),
  ],
);

export const memberships = sqliteTable(
  "memberships",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    providerMembershipId: text("provider_membership_id"),
    role: text("role").notNull(),
    status: text("status").notNull().default("active"),
    currentSince: integer("current_since", { mode: "timestamp_ms" })
      .notNull()
      .default(now),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
    ...createdAndUpdated(),
  },
  (table) => [
    uniqueIndex("memberships_workspace_account_unique").on(
      table.workspaceId,
      table.accountId,
    ),
    uniqueIndex("memberships_provider_membership_unique").on(
      table.providerMembershipId,
    ),
    index("memberships_account_status_idx").on(table.accountId, table.status),
    index("memberships_workspace_status_idx").on(table.workspaceId, table.status),
    check(
      "memberships_role_check",
      sql`${table.role} in ('owner', 'admin', 'billing', 'member', 'viewer')`,
    ),
    check(
      "memberships_status_check",
      sql`${table.status} in ('invited', 'active', 'suspended', 'revoked')`,
    ),
  ],
);

export const invitations = sqliteTable(
  "invitations",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    invitedEmailHash: text("invited_email_hash").notNull(),
    role: text("role").notNull(),
    status: text("status").notNull().default("pending"),
    invitedByAccountId: text("invited_by_account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    acceptedByAccountId: text("accepted_by_account_id").references(
      () => accounts.id,
      { onDelete: "set null" },
    ),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    acceptedAt: integer("accepted_at", { mode: "timestamp_ms" }),
    ...createdAndUpdated(),
  },
  (table) => [
    index("invitations_workspace_status_idx").on(table.workspaceId, table.status),
    index("invitations_email_status_idx").on(
      table.invitedEmailHash,
      table.status,
    ),
    check(
      "invitations_role_check",
      sql`${table.role} in ('owner', 'admin', 'billing', 'member', 'viewer')`,
    ),
    check(
      "invitations_status_check",
      sql`${table.status} in ('pending', 'accepted', 'revoked', 'expired')`,
    ),
  ],
);

export const providerEvents = sqliteTable(
  "provider_events",
  {
    id: text("id").primaryKey(),
    providerKind: text("provider_kind").notNull(),
    providerEventId: text("provider_event_id").notNull(),
    aggregateType: text("aggregate_type").notNull(),
    aggregateId: text("aggregate_id").notNull(),
    eventType: text("event_type").notNull(),
    occurredAt: integer("occurred_at", { mode: "timestamp_ms" }).notNull(),
    receivedAt: integer("received_at", { mode: "timestamp_ms" })
      .notNull()
      .default(now),
    payloadHash: text("payload_hash").notNull(),
    payloadEnvelope: text("payload_envelope"),
    signatureVerified: integer("signature_verified", { mode: "boolean" })
      .notNull()
      .default(false),
    status: text("status").notNull().default("received"),
    processedAt: integer("processed_at", { mode: "timestamp_ms" }),
    errorCode: text("error_code"),
    ...createdAndUpdated(),
  },
  (table) => [
    uniqueIndex("provider_events_provider_event_unique").on(
      table.providerKind,
      table.providerEventId,
    ),
    index("provider_events_aggregate_idx").on(
      table.providerKind,
      table.aggregateType,
      table.aggregateId,
      table.occurredAt,
    ),
    index("provider_events_status_received_idx").on(
      table.status,
      table.receivedAt,
    ),
    check(
      "provider_events_kind_check",
      sql`${table.providerKind} in ('identity', 'billing', 'email', 'storage', 'queue')`,
    ),
    check(
      "provider_events_status_check",
      sql`${table.status} in ('received', 'processing', 'applied', 'ignored', 'failed', 'dead_letter')`,
    ),
    check(
      "provider_events_verified_check",
      sql`${table.signatureVerified} in (0, 1)`,
    ),
  ],
);

export const billingCustomers = sqliteTable(
  "billing_customers",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "restrict" }),
    accountId: text("account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    billingProvider: text("billing_provider").notNull(),
    providerCustomerId: text("provider_customer_id").notNull(),
    status: text("status").notNull().default("active"),
    providerOccurredAt: integer("provider_occurred_at", {
      mode: "timestamp_ms",
    }).notNull(),
    ...createdAndUpdated(),
  },
  (table) => [
    uniqueIndex("billing_customers_provider_customer_unique").on(
      table.billingProvider,
      table.providerCustomerId,
    ),
    uniqueIndex("billing_customers_provider_workspace_unique").on(
      table.billingProvider,
      table.workspaceId,
    ),
    index("billing_customers_workspace_status_idx").on(
      table.workspaceId,
      table.status,
    ),
    index("billing_customers_account_idx").on(table.accountId),
    check(
      "billing_customers_status_check",
      sql`${table.status} in ('active', 'inactive', 'deletion_pending', 'deleted')`,
    ),
  ],
);

export const purchases = sqliteTable(
  "purchases",
  {
    id: text("id").primaryKey(),
    billingProvider: text("billing_provider").notNull(),
    providerPurchaseId: text("provider_purchase_id").notNull(),
    accountId: text("account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "restrict" }),
    productRef: text("product_ref").notNull(),
    status: text("status").notNull(),
    currency: text("currency").notNull(),
    amountMinor: integer("amount_minor").notNull(),
    purchasedAt: integer("purchased_at", { mode: "timestamp_ms" }).notNull(),
    providerOccurredAt: integer("provider_occurred_at", {
      mode: "timestamp_ms",
    }).notNull(),
    ...createdAndUpdated(),
  },
  (table) => [
    uniqueIndex("purchases_provider_purchase_unique").on(
      table.billingProvider,
      table.providerPurchaseId,
    ),
    index("purchases_workspace_status_idx").on(table.workspaceId, table.status),
    check(
      "purchases_status_check",
      sql`${table.status} in ('pending', 'completed', 'partially_refunded', 'refunded', 'disputed', 'void')`,
    ),
    check("purchases_amount_check", sql`${table.amountMinor} >= 0`),
    check(
      "purchases_currency_check",
      sql`${table.currency} glob '[A-Z][A-Z][A-Z]'`,
    ),
  ],
);

export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    billingProvider: text("billing_provider").notNull(),
    providerSubscriptionId: text("provider_subscription_id").notNull(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "restrict" }),
    accountId: text("account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    planRef: text("plan_ref").notNull(),
    status: text("status").notNull(),
    currentPeriodStartsAt: integer("current_period_starts_at", {
      mode: "timestamp_ms",
    }),
    currentPeriodEndsAt: integer("current_period_ends_at", {
      mode: "timestamp_ms",
    }),
    cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" })
      .notNull()
      .default(false),
    canceledAt: integer("canceled_at", { mode: "timestamp_ms" }),
    providerOccurredAt: integer("provider_occurred_at", {
      mode: "timestamp_ms",
    }).notNull(),
    ...createdAndUpdated(),
  },
  (table) => [
    uniqueIndex("subscriptions_provider_subscription_unique").on(
      table.billingProvider,
      table.providerSubscriptionId,
    ),
    index("subscriptions_workspace_status_idx").on(
      table.workspaceId,
      table.status,
    ),
    check(
      "subscriptions_status_check",
      sql`${table.status} in ('pending', 'active', 'past_due', 'paused', 'canceled', 'expired')`,
    ),
    check(
      "subscriptions_cancel_check",
      sql`${table.cancelAtPeriodEnd} in (0, 1)`,
    ),
    check(
      "subscriptions_period_check",
      sql`${table.currentPeriodStartsAt} is null or ${table.currentPeriodEndsAt} is null or ${table.currentPeriodEndsAt} >= ${table.currentPeriodStartsAt}`,
    ),
  ],
);

export const invoices = sqliteTable(
  "invoices",
  {
    id: text("id").primaryKey(),
    billingProvider: text("billing_provider").notNull(),
    providerInvoiceId: text("provider_invoice_id").notNull(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "restrict" }),
    purchaseId: text("purchase_id").references(() => purchases.id, {
      onDelete: "set null",
    }),
    subscriptionId: text("subscription_id").references(() => subscriptions.id, {
      onDelete: "set null",
    }),
    status: text("status").notNull(),
    currency: text("currency").notNull(),
    totalMinor: integer("total_minor").notNull(),
    issuedAt: integer("issued_at", { mode: "timestamp_ms" }),
    paidAt: integer("paid_at", { mode: "timestamp_ms" }),
    providerOccurredAt: integer("provider_occurred_at", {
      mode: "timestamp_ms",
    }).notNull(),
    ...createdAndUpdated(),
  },
  (table) => [
    uniqueIndex("invoices_provider_invoice_unique").on(
      table.billingProvider,
      table.providerInvoiceId,
    ),
    index("invoices_workspace_status_idx").on(table.workspaceId, table.status),
    check(
      "invoices_status_check",
      sql`${table.status} in ('draft', 'open', 'paid', 'void', 'uncollectible', 'refunded')`,
    ),
    check("invoices_total_check", sql`${table.totalMinor} >= 0`),
    check(
      "invoices_currency_check",
      sql`${table.currency} glob '[A-Z][A-Z][A-Z]'`,
    ),
  ],
);

export const billingAdjustments = sqliteTable(
  "billing_adjustments",
  {
    id: text("id").primaryKey(),
    billingProvider: text("billing_provider").notNull(),
    providerAdjustmentId: text("provider_adjustment_id").notNull(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "restrict" }),
    purchaseId: text("purchase_id").references(() => purchases.id, {
      onDelete: "restrict",
    }),
    invoiceId: text("invoice_id").references(() => invoices.id, {
      onDelete: "restrict",
    }),
    kind: text("kind").notNull(),
    status: text("status").notNull(),
    currency: text("currency").notNull(),
    amountMinor: integer("amount_minor").notNull(),
    providerOccurredAt: integer("provider_occurred_at", {
      mode: "timestamp_ms",
    }).notNull(),
    ...createdAndUpdated(),
  },
  (table) => [
    uniqueIndex("billing_adjustments_provider_adjustment_unique").on(
      table.billingProvider,
      table.providerAdjustmentId,
    ),
    index("billing_adjustments_workspace_occurred_idx").on(
      table.workspaceId,
      table.providerOccurredAt,
    ),
    index("billing_adjustments_purchase_idx").on(table.purchaseId),
    index("billing_adjustments_invoice_idx").on(table.invoiceId),
    check(
      "billing_adjustments_reference_check",
      sql`${table.purchaseId} is not null or ${table.invoiceId} is not null`,
    ),
    check(
      "billing_adjustments_kind_check",
      sql`${table.kind} in ('refund', 'credit', 'chargeback', 'chargeback_reversal', 'adjustment')`,
    ),
    check(
      "billing_adjustments_status_check",
      sql`${table.status} in ('pending', 'approved', 'processed', 'failed', 'reversed')`,
    ),
    check(
      "billing_adjustments_currency_check",
      sql`${table.currency} glob '[A-Z][A-Z][A-Z]'`,
    ),
    check(
      "billing_adjustments_amount_check",
      sql`${table.amountMinor} >= 0`,
    ),
  ],
);

export const licences = sqliteTable(
  "licences",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "restrict" }),
    purchaseId: text("purchase_id").references(() => purchases.id, {
      onDelete: "set null",
    }),
    subscriptionId: text("subscription_id").references(() => subscriptions.id, {
      onDelete: "set null",
    }),
    productRef: text("product_ref").notNull(),
    status: text("status").notNull(),
    startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    updatesUntil: integer("updates_until", { mode: "timestamp_ms" }),
    seatLimit: integer("seat_limit"),
    ...createdAndUpdated(),
  },
  (table) => [
    index("licences_workspace_product_status_idx").on(
      table.workspaceId,
      table.productRef,
      table.status,
    ),
    check(
      "licences_status_check",
      sql`${table.status} in ('pending', 'active', 'suspended', 'revoked', 'expired')`,
    ),
    check(
      "licences_seat_limit_check",
      sql`${table.seatLimit} is null or ${table.seatLimit} > 0`,
    ),
    check(
      "licences_expiry_check",
      sql`${table.expiresAt} is null or ${table.expiresAt} >= ${table.startsAt}`,
    ),
    check(
      "licences_updates_check",
      sql`${table.updatesUntil} is null or ${table.updatesUntil} >= ${table.startsAt}`,
    ),
  ],
);

export const licenceSeats = sqliteTable(
  "licence_seats",
  {
    id: text("id").primaryKey(),
    licenceId: text("licence_id")
      .notNull()
      .references(() => licences.id, { onDelete: "cascade" }),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("active"),
    assignedAt: integer("assigned_at", { mode: "timestamp_ms" })
      .notNull()
      .default(now),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
    ...createdAndUpdated(),
  },
  (table) => [
    uniqueIndex("licence_seats_licence_account_unique").on(
      table.licenceId,
      table.accountId,
    ),
    index("licence_seats_account_status_idx").on(table.accountId, table.status),
    check(
      "licence_seats_status_check",
      sql`${table.status} in ('active', 'revoked')`,
    ),
  ],
);

export const releaseRecords = sqliteTable(
  "release_records",
  {
    id: text("id").primaryKey(),
    productRef: text("product_ref").notNull(),
    version: text("version").notNull(),
    storageKey: text("storage_key").notNull(),
    checksumSha256: text("checksum_sha256").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    status: text("status").notNull().default("draft"),
    releasedAt: integer("released_at", { mode: "timestamp_ms" }),
    withdrawnAt: integer("withdrawn_at", { mode: "timestamp_ms" }),
    ...createdAndUpdated(),
  },
  (table) => [
    uniqueIndex("release_records_product_version_unique").on(
      table.productRef,
      table.version,
    ),
    uniqueIndex("release_records_storage_key_unique").on(table.storageKey),
    index("release_records_product_status_idx").on(table.productRef, table.status),
    check(
      "release_records_status_check",
      sql`${table.status} in ('draft', 'published', 'withdrawn', 'retired')`,
    ),
    check("release_records_size_check", sql`${table.sizeBytes} >= 0`),
  ],
);

export const entitlements = sqliteTable(
  "entitlements",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    accountId: text("account_id").references(() => accounts.id, {
      onDelete: "cascade",
    }),
    licenceId: text("licence_id")
      .notNull()
      .references(() => licences.id, { onDelete: "cascade" }),
    productRef: text("product_ref").notNull(),
    status: text("status").notNull().default("active"),
    validFrom: integer("valid_from", { mode: "timestamp_ms" }).notNull(),
    validUntil: integer("valid_until", { mode: "timestamp_ms" }),
    updatesUntil: integer("updates_until", { mode: "timestamp_ms" }),
    sourceEventId: text("source_event_id").references(() => providerEvents.id, {
      onDelete: "set null",
    }),
    ...createdAndUpdated(),
  },
  (table) => [
    uniqueIndex("entitlements_account_scope_unique")
      .on(
        table.workspaceId,
        table.accountId,
        table.licenceId,
        table.productRef,
      )
      .where(sql`${table.accountId} is not null`),
    uniqueIndex("entitlements_workspace_scope_unique")
      .on(
        table.workspaceId,
        table.licenceId,
        table.productRef,
      )
      .where(sql`${table.accountId} is null`),
    index("entitlements_scope_idx").on(
      table.workspaceId,
      table.accountId,
      table.licenceId,
      table.productRef,
    ),
    index("entitlements_workspace_product_status_idx").on(
      table.workspaceId,
      table.productRef,
      table.status,
    ),
    index("entitlements_account_status_idx").on(table.accountId, table.status),
    check(
      "entitlements_status_check",
      sql`${table.status} in ('pending', 'active', 'suspended', 'revoked', 'expired')`,
    ),
    check(
      "entitlements_validity_check",
      sql`${table.validUntil} is null or ${table.validUntil} >= ${table.validFrom}`,
    ),
    check(
      "entitlements_updates_check",
      sql`${table.updatesUntil} is null or ${table.updatesUntil} >= ${table.validFrom}`,
    ),
  ],
);

export const downloadGrants = sqliteTable(
  "download_grants",
  {
    id: text("id").primaryKey(),
    nonceHash: text("nonce_hash").notNull(),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    releaseId: text("release_id")
      .notNull()
      .references(() => releaseRecords.id, { onDelete: "restrict" }),
    entitlementId: text("entitlement_id")
      .notNull()
      .references(() => entitlements.id, { onDelete: "cascade" }),
    requestFingerprintHash: text("request_fingerprint_hash"),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    consumedAt: integer("consumed_at", { mode: "timestamp_ms" }),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(now),
  },
  (table) => [
    uniqueIndex("download_grants_nonce_hash_unique").on(table.nonceHash),
    index("download_grants_account_created_idx").on(
      table.accountId,
      table.createdAt,
    ),
    index("download_grants_expiry_idx").on(table.expiresAt),
    check(
      "download_grants_expiry_check",
      sql`${table.expiresAt} > ${table.createdAt}`,
    ),
  ],
);

export const auditEvents = sqliteTable(
  "audit_events",
  {
    id: text("id").primaryKey(),
    actorAccountId: text("actor_account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    workspaceId: text("workspace_id").references(() => workspaces.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    outcome: text("outcome").notNull(),
    metadata: text("metadata"),
    occurredAt: integer("occurred_at", { mode: "timestamp_ms" })
      .notNull()
      .default(now),
  },
  (table) => [
    index("audit_events_workspace_occurred_idx").on(
      table.workspaceId,
      table.occurredAt,
    ),
    index("audit_events_target_idx").on(table.targetType, table.targetId),
    check(
      "audit_events_outcome_check",
      sql`${table.outcome} in ('allowed', 'denied', 'succeeded', 'failed')`,
    ),
  ],
);

export const consentRecords = sqliteTable(
  "consent_records",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    workspaceId: text("workspace_id").references(() => workspaces.id, {
      onDelete: "set null",
    }),
    purpose: text("purpose").notNull(),
    state: text("state").notNull(),
    noticeVersion: text("notice_version").notNull(),
    source: text("source").notNull(),
    evidenceHash: text("evidence_hash"),
    occurredAt: integer("occurred_at", { mode: "timestamp_ms" }).notNull(),
    withdrawnAt: integer("withdrawn_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(now),
  },
  (table) => [
    index("consent_records_account_purpose_idx").on(
      table.accountId,
      table.purpose,
      table.occurredAt,
    ),
    check(
      "consent_records_state_check",
      sql`${table.state} in ('granted', 'denied', 'withdrawn', 'not_required')`,
    ),
  ],
);

export const dataExports = sqliteTable(
  "data_exports",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id").references(() => workspaces.id, {
      onDelete: "set null",
    }),
    status: text("status").notNull().default("requested"),
    storageKey: text("storage_key"),
    checksumSha256: text("checksum_sha256"),
    requestedAt: integer("requested_at", { mode: "timestamp_ms" })
      .notNull()
      .default(now),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    failureCode: text("failure_code"),
    ...createdAndUpdated(),
  },
  (table) => [
    index("data_exports_account_status_idx").on(table.accountId, table.status),
    check(
      "data_exports_status_check",
      sql`${table.status} in ('requested', 'queued', 'processing', 'ready', 'downloaded', 'expired', 'failed', 'cancelled')`,
    ),
  ],
);

export const dataDeletions = sqliteTable(
  "data_deletions",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    workspaceId: text("workspace_id").references(() => workspaces.id, {
      onDelete: "set null",
    }),
    status: text("status").notNull().default("requested"),
    requestedAt: integer("requested_at", { mode: "timestamp_ms" })
      .notNull()
      .default(now),
    verifiedAt: integer("verified_at", { mode: "timestamp_ms" }),
    retentionUntil: integer("retention_until", { mode: "timestamp_ms" }),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    blockerCode: text("blocker_code"),
    ...createdAndUpdated(),
  },
  (table) => [
    index("data_deletions_account_status_idx").on(table.accountId, table.status),
    check(
      "data_deletions_status_check",
      sql`${table.status} in ('requested', 'verified', 'queued', 'processing', 'blocked', 'completed', 'cancelled')`,
    ),
  ],
);

export const outboxMessages = sqliteTable(
  "outbox_messages",
  {
    id: text("id").primaryKey(),
    deduplicationKey: text("deduplication_key").notNull(),
    topic: text("topic").notNull(),
    aggregateType: text("aggregate_type").notNull(),
    aggregateId: text("aggregate_id").notNull(),
    payload: text("payload").notNull(),
    payloadHash: text("payload_hash").notNull(),
    status: text("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    nextAttemptAt: integer("next_attempt_at", { mode: "timestamp_ms" }),
    deliveredAt: integer("delivered_at", { mode: "timestamp_ms" }),
    lastErrorCode: text("last_error_code"),
    ...createdAndUpdated(),
  },
  (table) => [
    uniqueIndex("outbox_messages_deduplication_unique").on(
      table.deduplicationKey,
    ),
    index("outbox_messages_status_attempt_idx").on(
      table.status,
      table.nextAttemptAt,
    ),
    check(
      "outbox_messages_status_check",
      sql`${table.status} in ('pending', 'processing', 'delivered', 'failed', 'dead_letter')`,
    ),
    check("outbox_messages_attempts_check", sql`${table.attempts} >= 0`),
  ],
);

export const reconciliationRuns = sqliteTable(
  "reconciliation_runs",
  {
    id: text("id").primaryKey(),
    providerKind: text("provider_kind").notNull(),
    scope: text("scope").notNull(),
    status: text("status").notNull().default("pending"),
    cursor: text("cursor"),
    checkedCount: integer("checked_count").notNull().default(0),
    discrepancyCount: integer("discrepancy_count").notNull().default(0),
    startedAt: integer("started_at", { mode: "timestamp_ms" }),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    failureCode: text("failure_code"),
    ...createdAndUpdated(),
  },
  (table) => [
    index("reconciliation_runs_provider_status_idx").on(
      table.providerKind,
      table.status,
    ),
    check(
      "reconciliation_runs_status_check",
      sql`${table.status} in ('pending', 'running', 'completed', 'failed')`,
    ),
    check(
      "reconciliation_runs_counts_check",
      sql`${table.checkedCount} >= 0 and ${table.discrepancyCount} >= 0`,
    ),
  ],
);

export const deadLetters = sqliteTable(
  "dead_letters",
  {
    id: text("id").primaryKey(),
    sourceType: text("source_type").notNull(),
    sourceId: text("source_id").notNull(),
    reasonCode: text("reason_code").notNull(),
    payloadHash: text("payload_hash").notNull(),
    status: text("status").notNull().default("open"),
    attempts: integer("attempts").notNull().default(0),
    firstSeenAt: integer("first_seen_at", { mode: "timestamp_ms" })
      .notNull()
      .default(now),
    lastSeenAt: integer("last_seen_at", { mode: "timestamp_ms" })
      .notNull()
      .default(now),
    resolvedAt: integer("resolved_at", { mode: "timestamp_ms" }),
    ...createdAndUpdated(),
  },
  (table) => [
    uniqueIndex("dead_letters_source_unique").on(table.sourceType, table.sourceId),
    index("dead_letters_status_seen_idx").on(table.status, table.lastSeenAt),
    check(
      "dead_letters_status_check",
      sql`${table.status} in ('open', 'retrying', 'resolved', 'discarded')`,
    ),
    check("dead_letters_attempts_check", sql`${table.attempts} >= 0`),
  ],
);

export const retentionActions = sqliteTable(
  "retention_actions",
  {
    id: text("id").primaryKey(),
    recordType: text("record_type").notNull(),
    recordId: text("record_id").notNull(),
    policyRef: text("policy_ref").notNull(),
    status: text("status").notNull().default("scheduled"),
    retainUntil: integer("retain_until", { mode: "timestamp_ms" }).notNull(),
    legalHold: integer("legal_hold", { mode: "boolean" })
      .notNull()
      .default(false),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    failureCode: text("failure_code"),
    ...createdAndUpdated(),
  },
  (table) => [
    uniqueIndex("retention_actions_record_policy_unique").on(
      table.recordType,
      table.recordId,
      table.policyRef,
    ),
    index("retention_actions_status_due_idx").on(table.status, table.retainUntil),
    check(
      "retention_actions_status_check",
      sql`${table.status} in ('scheduled', 'held', 'eligible', 'purging', 'purged', 'failed')`,
    ),
    check(
      "retention_actions_legal_hold_check",
      sql`${table.legalHold} in (0, 1)`,
    ),
  ],
);
