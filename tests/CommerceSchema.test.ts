import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const requiredTables = [
  "accounts",
  "profiles",
  "workspaces",
  "memberships",
  "invitations",
  "provider_events",
  "purchases",
  "subscriptions",
  "invoices",
  "licences",
  "licence_seats",
  "release_records",
  "entitlements",
  "download_grants",
  "audit_events",
  "billing_adjustments",
  "billing_customers",
  "consent_records",
  "data_exports",
  "data_deletions",
  "outbox_messages",
  "reconciliation_runs",
  "dead_letters",
  "retention_actions",
] as const;

describe("commercial D1 migration", () => {
  it("contains the complete provider-neutral foundation", async () => {
    const migration = await readMigrations();
    for (const table of requiredTables) {
      expect(migration).toContain(`CREATE TABLE \`${table}\``);
    }
    expect(
      [...migration.matchAll(/CREATE TABLE `(?!__new_)/gu)],
    ).toHaveLength(requiredTables.length);
  });

  it("enforces replay, provider-event and membership uniqueness", async () => {
    const migration = await readMigrations();
    expect(migration).toContain(
      "CREATE UNIQUE INDEX `download_grants_nonce_hash_unique`",
    );
    expect(migration).toContain(
      "CREATE UNIQUE INDEX `provider_events_provider_event_unique`",
    );
    expect(migration).toContain(
      "CREATE UNIQUE INDEX `memberships_workspace_account_unique`",
    );
    expect(migration).toContain(
      "CREATE UNIQUE INDEX `entitlements_account_scope_unique`",
    );
    expect(migration).toContain(
      "CREATE UNIQUE INDEX `entitlements_workspace_scope_unique`",
    );
    expect(migration).toContain('WHERE "entitlements"."account_id" is null');
    expect(migration).toContain(
      "CREATE UNIQUE INDEX `billing_customers_provider_customer_unique`",
    );
    expect(migration).toContain(
      "CREATE UNIQUE INDEX `billing_adjustments_provider_adjustment_unique`",
    );
    expect(migration).toContain("CONSTRAINT \"accounts_status_check\"");
    expect(migration).toContain("CONSTRAINT \"entitlements_status_check\"");
    expect(migration).toContain("CONSTRAINT \"subscriptions_period_check\"");
    expect(migration).toContain("CONSTRAINT \"licences_updates_check\"");
    expect(migration).toContain("CONSTRAINT \"entitlements_updates_check\"");
    expect(migration).toContain(
      "glob '[A-Z][A-Z][A-Z]'",
    );
    expect(migration).toContain(
      "CONSTRAINT \"billing_adjustments_reference_check\"",
    );
    expect(migration).toContain("FOREIGN KEY (`entitlement_id`)");
  });
});

async function readMigrations(): Promise<string> {
  const directory = path.join(process.cwd(), "drizzle");
  const files = (await readdir(directory))
    .filter((file) => /^\d+_.+\.sql$/u.test(file))
    .sort();
  return (
    await Promise.all(
      files.map((file) => readFile(path.join(directory, file), "utf8")),
    )
  ).join("\n");
}
