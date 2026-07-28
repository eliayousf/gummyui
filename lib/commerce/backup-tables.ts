export const COMMERCE_BACKUP_SCHEMA_VERSION = "convex-commerce-v1";

export const COMMERCE_BACKUP_TABLES = [
  "accounts",
  "profiles",
  "workspaces",
  "memberships",
  "invitations",
  "providerEvents",
  "billingCustomers",
  "purchases",
  "subscriptions",
  "invoices",
  "billingAdjustments",
  "licences",
  "licenceSeats",
  "releaseRecords",
  "entitlements",
  "downloadGrants",
  "auditEvents",
  "consentRecords",
  "dataExports",
  "dataDeletions",
  "outboxMessages",
  "reconciliationRuns",
  "deadLetters",
  "retentionActions",
] as const;

export type CommerceBackupTable = typeof COMMERCE_BACKUP_TABLES[number];
