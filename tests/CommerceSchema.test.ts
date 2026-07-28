import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { COMMERCE_BACKUP_TABLES } from "../lib/commerce/backup-tables";

const requiredTables = [
  "accounts",
  "profiles",
  "workspaces",
  "memberships",
  "invitations",
  "providerEvents",
  "purchases",
  "subscriptions",
  "invoices",
  "licences",
  "licenceSeats",
  "releaseRecords",
  "entitlements",
  "downloadGrants",
  "auditEvents",
  "billingAdjustments",
  "billingCustomers",
  "consentRecords",
  "dataExports",
  "dataDeletions",
  "outboxMessages",
  "reconciliationRuns",
  "deadLetters",
  "retentionActions",
  "rateLimitWindows",
] as const;

describe("commercial Convex schema", () => {
  it("defines the complete commerce and abuse-control foundation", async () => {
    const source = await read("convex/schema.ts");
    for (const table of requiredTables) {
      expect(source).toContain(`${table}: defineTable({`);
    }
    expect([...source.matchAll(/: defineTable\(\{/gu)]).toHaveLength(
      requiredTables.length,
    );
  });

  it("backs up the 24 durable tables and excludes ephemeral rate limits", () => {
    expect(requiredTables).toHaveLength(25);
    expect(COMMERCE_BACKUP_TABLES).toHaveLength(24);
    expect(COMMERCE_BACKUP_TABLES).not.toContain("rateLimitWindows");
    expect([...COMMERCE_BACKUP_TABLES, "rateLimitWindows"].sort()).toEqual(
      [...requiredTables].sort(),
    );
  });

  it("defines indexed replay, provider-event and membership identities", async () => {
    const source = await read("convex/schema.ts");
    for (const index of [
      'index("by_nonce_hash", ["nonceHash"])',
      'index("by_provider_event", ["providerKind", "providerEventId"])',
      'index("by_workspace_account", ["workspaceId", "accountId"])',
      'index("by_scope", [',
      'index("by_provider_customer", [',
      'index("by_provider_adjustment", [',
      'index("by_provider_payment_intent", [',
      'index("by_account_status", ["accountId", "status"])',
      'index("by_provider_message_id", ["providerMessageId"])',
      'index("by_scope_key", ["scopeHash", "keyHash"])',
      'index("by_expiry", ["expiresAt"])',
    ]) {
      expect(source).toContain(index);
    }
  });

  it("keeps all vendor writes behind one authenticated mutation", async () => {
    const source = await read("convex/commerce.ts");
    expect(source).toContain("assertServerSecret(args.serverSecret)");
    expect(source).toContain("CONVEX_SERVER_SECRET");
    expect(source).toContain("acceptProviderEvent");
    expect(source).toContain("signatureVerified: true");
    expect(source).toContain("payloadHash !== input.payloadHash");
    expect(source).toContain("downloads.consume");
    expect(source).toContain("privacy.deletion.complete");
    expect(source).toContain("email.outbox.claim");
    expect(source).toContain("email.outbox.accepted");
    expect(source).toContain("email.outbox.provider-event");
    expect(source).toContain("health.readiness");
    expect(source).toContain("rate-limit.consume");
  });
});

function read(relativePath: string): Promise<string> {
  return readFile(path.join(process.cwd(), relativePath), "utf8");
}
