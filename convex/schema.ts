import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const maybeString = v.optional(v.union(v.string(), v.null()));
const maybeNumber = v.optional(v.union(v.number(), v.null()));

const timestamps = {
  createdAt: v.number(),
  updatedAt: v.number(),
};

export default defineSchema({
  accounts: defineTable({
    id: v.string(),
    identityProvider: v.string(),
    identitySubject: v.string(),
    emailHash: maybeString,
    status: v.string(),
    deactivatedAt: maybeNumber,
    ...timestamps,
  })
    .index("by_custom_id", ["id"])
    .index("by_identity", ["identityProvider", "identitySubject"])
    .index("by_status", ["status"]),

  profiles: defineTable({
    accountId: v.string(),
    displayName: maybeString,
    locale: maybeString,
    timeZone: maybeString,
    ...timestamps,
  }).index("by_account", ["accountId"]),

  workspaces: defineTable({
    id: v.string(),
    identityProvider: maybeString,
    providerOrganizationId: maybeString,
    name: v.string(),
    status: v.string(),
    ...timestamps,
  })
    .index("by_custom_id", ["id"])
    .index("by_provider_organization", [
      "identityProvider",
      "providerOrganizationId",
    ])
    .index("by_status", ["status"]),

  memberships: defineTable({
    id: v.string(),
    workspaceId: v.string(),
    accountId: v.string(),
    providerMembershipId: maybeString,
    role: v.string(),
    status: v.string(),
    currentSince: v.number(),
    revokedAt: maybeNumber,
    ...timestamps,
  })
    .index("by_custom_id", ["id"])
    .index("by_workspace_account", ["workspaceId", "accountId"])
    .index("by_provider_membership", ["providerMembershipId"])
    .index("by_account_status", ["accountId", "status"])
    .index("by_workspace_status", ["workspaceId", "status"])
    .index("by_workspace", ["workspaceId"])
    .index("by_account", ["accountId"]),

  invitations: defineTable({
    id: v.string(),
    workspaceId: v.string(),
    invitedEmailHash: v.string(),
    role: v.string(),
    status: v.string(),
    invitedByAccountId: maybeString,
    acceptedByAccountId: maybeString,
    expiresAt: v.number(),
    acceptedAt: maybeNumber,
    ...timestamps,
  })
    .index("by_custom_id", ["id"])
    .index("by_workspace_status", ["workspaceId", "status"])
    .index("by_workspace", ["workspaceId"])
    .index("by_email_status", ["invitedEmailHash", "status"]),

  providerEvents: defineTable({
    id: v.string(),
    providerKind: v.string(),
    providerEventId: v.string(),
    aggregateType: v.string(),
    aggregateId: v.string(),
    eventType: v.string(),
    occurredAt: v.number(),
    receivedAt: v.number(),
    payloadHash: v.string(),
    payloadEnvelope: maybeString,
    signatureVerified: v.boolean(),
    status: v.string(),
    processedAt: maybeNumber,
    errorCode: maybeString,
    ...timestamps,
  })
    .index("by_custom_id", ["id"])
    .index("by_provider_event", ["providerKind", "providerEventId"])
    .index("by_aggregate", [
      "providerKind",
      "aggregateType",
      "aggregateId",
      "occurredAt",
    ])
    .index("by_status_received", ["status", "receivedAt"]),

  billingCustomers: defineTable({
    id: v.string(),
    workspaceId: v.string(),
    accountId: maybeString,
    billingProvider: v.string(),
    providerCustomerId: v.string(),
    status: v.string(),
    providerOccurredAt: v.number(),
    ...timestamps,
  })
    .index("by_custom_id", ["id"])
    .index("by_provider_customer", [
      "billingProvider",
      "providerCustomerId",
    ])
    .index("by_provider_workspace", ["billingProvider", "workspaceId"])
    .index("by_workspace_status", ["workspaceId", "status"])
    .index("by_account", ["accountId"]),

  purchases: defineTable({
    id: v.string(),
    billingProvider: v.string(),
    providerPurchaseId: v.string(),
    providerPaymentIntentId: maybeString,
    accountId: maybeString,
    workspaceId: v.string(),
    productRef: v.string(),
    status: v.string(),
    currency: v.string(),
    amountMinor: v.number(),
    purchasedAt: v.number(),
    providerOccurredAt: v.number(),
    ...timestamps,
  })
    .index("by_custom_id", ["id"])
    .index("by_provider_purchase", [
      "billingProvider",
      "providerPurchaseId",
    ])
    .index("by_provider_payment_intent", [
      "billingProvider",
      "providerPaymentIntentId",
    ])
    .index("by_workspace_status", ["workspaceId", "status"])
    .index("by_workspace", ["workspaceId"])
    .index("by_account", ["accountId"]),

  subscriptions: defineTable({
    id: v.string(),
    billingProvider: v.string(),
    providerSubscriptionId: v.string(),
    workspaceId: v.string(),
    accountId: maybeString,
    planRef: v.string(),
    status: v.string(),
    currentPeriodStartsAt: maybeNumber,
    currentPeriodEndsAt: maybeNumber,
    cancelAtPeriodEnd: v.boolean(),
    canceledAt: maybeNumber,
    providerOccurredAt: v.number(),
    ...timestamps,
  })
    .index("by_custom_id", ["id"])
    .index("by_provider_subscription", [
      "billingProvider",
      "providerSubscriptionId",
    ])
    .index("by_workspace_status", ["workspaceId", "status"])
    .index("by_workspace", ["workspaceId"])
    .index("by_account", ["accountId"]),

  invoices: defineTable({
    id: v.string(),
    billingProvider: v.string(),
    providerInvoiceId: v.string(),
    providerPaymentIntentId: maybeString,
    workspaceId: v.string(),
    purchaseId: maybeString,
    subscriptionId: maybeString,
    status: v.string(),
    currency: v.string(),
    totalMinor: v.number(),
    issuedAt: maybeNumber,
    paidAt: maybeNumber,
    providerOccurredAt: v.number(),
    ...timestamps,
  })
    .index("by_custom_id", ["id"])
    .index("by_provider_invoice", ["billingProvider", "providerInvoiceId"])
    .index("by_provider_payment_intent", [
      "billingProvider",
      "providerPaymentIntentId",
    ])
    .index("by_workspace_status", ["workspaceId", "status"])
    .index("by_workspace", ["workspaceId"])
    .index("by_subscription", ["subscriptionId"]),

  billingAdjustments: defineTable({
    id: v.string(),
    billingProvider: v.string(),
    providerAdjustmentId: v.string(),
    workspaceId: v.string(),
    purchaseId: maybeString,
    invoiceId: maybeString,
    kind: v.string(),
    status: v.string(),
    currency: v.string(),
    amountMinor: v.number(),
    providerOccurredAt: v.number(),
    ...timestamps,
  })
    .index("by_custom_id", ["id"])
    .index("by_provider_adjustment", [
      "billingProvider",
      "providerAdjustmentId",
    ])
    .index("by_workspace_occurred", ["workspaceId", "providerOccurredAt"])
    .index("by_purchase", ["purchaseId"])
    .index("by_invoice", ["invoiceId"]),

  licences: defineTable({
    id: v.string(),
    workspaceId: v.string(),
    purchaseId: maybeString,
    subscriptionId: maybeString,
    productRef: v.string(),
    status: v.string(),
    startsAt: v.number(),
    expiresAt: maybeNumber,
    updatesUntil: maybeNumber,
    seatLimit: maybeNumber,
    ...timestamps,
  })
    .index("by_custom_id", ["id"])
    .index("by_workspace_product_status", [
      "workspaceId",
      "productRef",
      "status",
    ])
    .index("by_workspace", ["workspaceId"])
    .index("by_purchase", ["purchaseId"])
    .index("by_subscription", ["subscriptionId"]),

  licenceSeats: defineTable({
    id: v.string(),
    licenceId: v.string(),
    accountId: v.string(),
    status: v.string(),
    assignedAt: v.number(),
    revokedAt: maybeNumber,
    ...timestamps,
  })
    .index("by_custom_id", ["id"])
    .index("by_licence_account", ["licenceId", "accountId"])
    .index("by_account_status", ["accountId", "status"])
    .index("by_licence", ["licenceId"])
    .index("by_account", ["accountId"]),

  releaseRecords: defineTable({
    id: v.string(),
    productRef: v.string(),
    version: v.string(),
    storageKey: v.string(),
    checksumSha256: v.string(),
    sizeBytes: v.number(),
    status: v.string(),
    releasedAt: maybeNumber,
    withdrawnAt: maybeNumber,
    ...timestamps,
  })
    .index("by_custom_id", ["id"])
    .index("by_product_version", ["productRef", "version"])
    .index("by_storage_key", ["storageKey"])
    .index("by_product_status", ["productRef", "status"])
    .index("by_status", ["status"]),

  entitlements: defineTable({
    id: v.string(),
    workspaceId: v.string(),
    accountId: maybeString,
    licenceId: v.string(),
    productRef: v.string(),
    status: v.string(),
    validFrom: v.number(),
    validUntil: maybeNumber,
    updatesUntil: maybeNumber,
    sourceEventId: maybeString,
    ...timestamps,
  })
    .index("by_custom_id", ["id"])
    .index("by_scope", [
      "workspaceId",
      "accountId",
      "licenceId",
      "productRef",
    ])
    .index("by_workspace_product_status", [
      "workspaceId",
      "productRef",
      "status",
    ])
    .index("by_account_status", ["accountId", "status"])
    .index("by_licence", ["licenceId"])
    .index("by_workspace", ["workspaceId"]),

  downloadGrants: defineTable({
    id: v.string(),
    nonceHash: v.string(),
    accountId: v.string(),
    workspaceId: v.string(),
    releaseId: v.string(),
    entitlementId: v.string(),
    requestFingerprintHash: maybeString,
    expiresAt: v.number(),
    consumedAt: maybeNumber,
    revokedAt: maybeNumber,
    createdAt: v.number(),
  })
    .index("by_custom_id", ["id"])
    .index("by_nonce_hash", ["nonceHash"])
    .index("by_account_created", ["accountId", "createdAt"])
    .index("by_account", ["accountId"])
    .index("by_entitlement", ["entitlementId"])
    .index("by_expiry", ["expiresAt"]),

  auditEvents: defineTable({
    id: v.string(),
    actorAccountId: maybeString,
    workspaceId: maybeString,
    action: v.string(),
    targetType: v.string(),
    targetId: v.string(),
    outcome: v.string(),
    metadata: maybeString,
    occurredAt: v.number(),
  })
    .index("by_custom_id", ["id"])
    .index("by_workspace_occurred", ["workspaceId", "occurredAt"])
    .index("by_target", ["targetType", "targetId"])
    .index("by_actor", ["actorAccountId"]),

  consentRecords: defineTable({
    id: v.string(),
    accountId: maybeString,
    workspaceId: maybeString,
    purpose: v.string(),
    state: v.string(),
    noticeVersion: v.string(),
    source: v.string(),
    evidenceHash: maybeString,
    occurredAt: v.number(),
    withdrawnAt: maybeNumber,
    createdAt: v.number(),
  })
    .index("by_custom_id", ["id"])
    .index("by_account_purpose", ["accountId", "purpose", "occurredAt"])
    .index("by_account", ["accountId"]),

  dataExports: defineTable({
    id: v.string(),
    accountId: v.string(),
    workspaceId: maybeString,
    status: v.string(),
    storageKey: maybeString,
    checksumSha256: maybeString,
    requestedAt: v.number(),
    completedAt: maybeNumber,
    expiresAt: maybeNumber,
    failureCode: maybeString,
    ...timestamps,
  })
    .index("by_custom_id", ["id"])
    .index("by_account_status", ["accountId", "status"])
    .index("by_account", ["accountId"]),

  dataDeletions: defineTable({
    id: v.string(),
    accountId: v.string(),
    workspaceId: maybeString,
    status: v.string(),
    requestedAt: v.number(),
    verifiedAt: maybeNumber,
    retentionUntil: maybeNumber,
    completedAt: maybeNumber,
    blockerCode: maybeString,
    ...timestamps,
  })
    .index("by_custom_id", ["id"])
    .index("by_account_status", ["accountId", "status"])
    .index("by_account", ["accountId"]),

  outboxMessages: defineTable({
    id: v.string(),
    deduplicationKey: v.string(),
    topic: v.string(),
    aggregateType: v.string(),
    aggregateId: v.string(),
    payload: v.string(),
    payloadHash: v.string(),
    status: v.string(),
    attempts: v.number(),
    nextAttemptAt: maybeNumber,
    providerMessageId: maybeString,
    acceptedAt: maybeNumber,
    providerOccurredAt: maybeNumber,
    deliveredAt: maybeNumber,
    lastErrorCode: maybeString,
    ...timestamps,
  })
    .index("by_custom_id", ["id"])
    .index("by_deduplication_key", ["deduplicationKey"])
    .index("by_provider_message_id", ["providerMessageId"])
    .index("by_status_attempt", ["status", "nextAttemptAt"])
    .index("by_status", ["status"]),

  reconciliationRuns: defineTable({
    id: v.string(),
    providerKind: v.string(),
    scope: v.string(),
    status: v.string(),
    cursor: maybeString,
    checkedCount: v.number(),
    discrepancyCount: v.number(),
    startedAt: maybeNumber,
    completedAt: maybeNumber,
    failureCode: maybeString,
    ...timestamps,
  })
    .index("by_custom_id", ["id"])
    .index("by_provider_status", ["providerKind", "status"]),

  deadLetters: defineTable({
    id: v.string(),
    sourceType: v.string(),
    sourceId: v.string(),
    reasonCode: v.string(),
    payloadHash: v.string(),
    status: v.string(),
    attempts: v.number(),
    firstSeenAt: v.number(),
    lastSeenAt: v.number(),
    resolvedAt: maybeNumber,
    ...timestamps,
  })
    .index("by_custom_id", ["id"])
    .index("by_source", ["sourceType", "sourceId"])
    .index("by_status_seen", ["status", "lastSeenAt"]),

  retentionActions: defineTable({
    id: v.string(),
    recordType: v.string(),
    recordId: v.string(),
    policyRef: v.string(),
    status: v.string(),
    retainUntil: v.number(),
    legalHold: v.boolean(),
    completedAt: maybeNumber,
    failureCode: maybeString,
    ...timestamps,
  })
    .index("by_custom_id", ["id"])
    .index("by_record_policy", ["recordType", "recordId", "policyRef"])
    .index("by_status_due", ["status", "retainUntil"])
    .index("by_record", ["recordType", "recordId"]),

  rateLimitWindows: defineTable({
    scopeHash: v.string(),
    keyHash: v.string(),
    capacity: v.number(),
    windowMs: v.number(),
    windowStartedAt: v.number(),
    windowEndsAt: v.number(),
    count: v.number(),
    expiresAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_scope_key", ["scopeHash", "keyHash"])
    .index("by_expiry", ["expiresAt"]),
});
