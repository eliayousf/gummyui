/// <reference types="vite/client" />

import { anyApi } from "convex/server";
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import schema from "../convex/schema";

const modules = import.meta.glob("../convex/**/*.ts");
const SERVER_SECRET = "release-operation-test-secret-".padEnd(40, "x");
const PRODUCT_REF = "gummy-ui-pro-blocks";
const VERSION = "1.2.3";
const OBJECT_KEY = `releases/v${VERSION}/gummy-ui-pro-blocks.zip`;
const CHECKSUM = "a".repeat(64);

function releaseTest() {
  const test = convexTest(schema, modules);
  const execute = (
    operation: "releases.publish" | "releases.withdraw" | string,
    input: unknown,
    serverSecret = SERVER_SECRET,
  ) =>
    test.mutation(anyApi.commerce.execute, {
      serverSecret,
      operation,
      input,
    });
  return { test, execute };
}

function publication(overrides: Record<string, unknown> = {}) {
  return {
    productRef: PRODUCT_REF,
    version: VERSION,
    objectKey: OBJECT_KEY,
    outerArchiveSha256: CHECKSUM,
    sizeBytes: 4_096,
    ...overrides,
  };
}

describe("protected Convex release operations", () => {
  const previousSecret = process.env.CONVEX_SERVER_SECRET;

  beforeEach(() => {
    process.env.CONVEX_SERVER_SECRET = SERVER_SECRET;
  });

  afterEach(() => {
    if (previousSecret === undefined) {
      delete process.env.CONVEX_SERVER_SECRET;
    } else {
      process.env.CONVEX_SERVER_SECRET = previousSecret;
    }
  });

  it("requires the server secret and validates every publication boundary", async () => {
    const { execute } = releaseTest();
    await expect(
      execute("releases.publish", publication(), "wrong-secret"),
    ).rejects.toThrow("Commerce operation is unavailable");

    for (const invalid of [
      publication({
        productRef: "gummy-ui-pro-unknown",
        objectKey: `releases/v${VERSION}/unknown.zip`,
      }),
      publication({
        version: "01.2.3",
        objectKey: "releases/v01.2.3/gummy-ui-pro-blocks.zip",
      }),
      publication({
        objectKey: "releases/v1.2.3/../gummy-ui-pro-blocks.zip",
      }),
      publication({
        objectKey: "releases/v1.2.3/gummy-ui-pro-templates.zip",
      }),
      publication({ outerArchiveSha256: "A".repeat(64) }),
      publication({ outerArchiveSha256: "a".repeat(63) }),
      publication({ sizeBytes: 0 }),
      publication({ sizeBytes: 1.5 }),
      { ...publication(), objectUrl: "https://objects.example/release.zip" },
    ]) {
      await expect(execute("releases.publish", invalid))
        .rejects.toThrow("Invalid protected release metadata");
    }
  });

  it("accepts only the three entitlement products and their full product-ref filenames", async () => {
    const { test, execute } = releaseTest();
    for (const productRef of [
      "gummy-ui-pro-blocks",
      "gummy-ui-pro-templates",
      "gummy-ui-pro-design-kit",
    ] as const) {
      await expect(execute("releases.publish", publication({
        productRef,
        version: "2.0.0",
        objectKey: `releases/v2.0.0/${productRef}.zip`,
      }))).resolves.toMatchObject({
        outcome: "published",
        status: "published",
        productRef,
        version: "2.0.0",
      });
    }
    const releases = await test.run((ctx) =>
      ctx.db.query("releaseRecords").collect());
    expect(releases.map(({ storageKey }) => storageKey).sort()).toEqual([
      "releases/v2.0.0/gummy-ui-pro-blocks.zip",
      "releases/v2.0.0/gummy-ui-pro-design-kit.zip",
      "releases/v2.0.0/gummy-ui-pro-templates.zip",
    ]);
  });

  it("publishes once, records a redacted audit and treats an exact retry as a no-op", async () => {
    const { test, execute } = releaseTest();
    await expect(execute(
      "releases.publish",
      publication({
        version: "1.2.3-rc.1+build.7",
        objectKey:
          "releases/v1.2.3-rc.1+build.7/gummy-ui-pro-blocks.zip",
      }),
    )).resolves.toMatchObject({
      outcome: "published",
      status: "published",
      productRef: PRODUCT_REF,
      version: "1.2.3-rc.1+build.7",
    });
    await expect(execute(
      "releases.publish",
      publication({
        version: "1.2.3-rc.1+build.7",
        objectKey:
          "releases/v1.2.3-rc.1+build.7/gummy-ui-pro-blocks.zip",
      }),
    )).resolves.toMatchObject({
      outcome: "unchanged",
      status: "published",
    });

    const state = await test.run(async (ctx) => ({
      releases: await ctx.db.query("releaseRecords").collect(),
      audits: await ctx.db.query("auditEvents").collect(),
    }));
    expect(state.releases).toHaveLength(1);
    expect(state.releases[0]).toMatchObject({
      productRef: PRODUCT_REF,
      version: "1.2.3-rc.1+build.7",
      storageKey:
        "releases/v1.2.3-rc.1+build.7/gummy-ui-pro-blocks.zip",
      checksumSha256: CHECKSUM,
      sizeBytes: 4_096,
      status: "published",
      withdrawnAt: null,
    });
    expect(state.releases[0].releasedAt).toBe(state.releases[0].createdAt);
    expect(state.releases[0].updatedAt).toBe(state.releases[0].createdAt);
    expect(state.audits).toHaveLength(1);
    expect(state.audits[0]).toMatchObject({
      actorAccountId: null,
      workspaceId: null,
      action: "release.published",
      targetType: "release",
      outcome: "succeeded",
    });
    expect(state.audits[0].metadata).not.toContain("releases/");
    expect(state.audits[0].metadata).not.toContain(CHECKSUM);
    expect(state.audits[0].metadata).not.toContain("4096");
  });

  it("fails closed on conflicting metadata or a previously reused object key", async () => {
    const { test, execute } = releaseTest();
    await execute("releases.publish", publication());
    await expect(
      execute("releases.publish", publication({ sizeBytes: 8_192 })),
    ).rejects.toThrow("Protected release metadata conflict");
    await expect(
      execute("releases.publish", publication({
        outerArchiveSha256: "b".repeat(64),
      })),
    ).rejects.toThrow("Protected release metadata conflict");

    const { test: reusedKeyTest, execute: reusedKeyExecute } = releaseTest();
    await reusedKeyTest.run((ctx) =>
      ctx.db.insert("releaseRecords", {
        id: "release:legacy-conflict",
        productRef: "gummy-ui-pro-templates",
        version: "9.9.9",
        storageKey: OBJECT_KEY,
        checksumSha256: "c".repeat(64),
        sizeBytes: 1_024,
        status: "withdrawn",
        releasedAt: 1_800_000_000_000,
        withdrawnAt: 1_800_000_001_000,
        createdAt: 1_800_000_000_000,
        updatedAt: 1_800_000_001_000,
      }));
    await expect(
      reusedKeyExecute("releases.publish", publication()),
    ).rejects.toThrow("Protected release object key conflict");

    expect(await test.run((ctx) =>
      ctx.db.query("releaseRecords").collect())).toHaveLength(1);
  });

  it("authorizes a paid account and denies an otherwise valid unpaid account", async () => {
    const { test, execute } = releaseTest();
    const published = await execute(
      "releases.publish",
      publication(),
    ) as { releaseId: string };
    await seedAccessFixtures(test);

    await expect(execute("downloads.find-authorized", {
      accountId: "account:paid",
      workspaceId: "workspace:paid",
      role: "owner",
      releaseId: published.releaseId,
      now: Date.now() + 1_000,
    })).resolves.toMatchObject({
      releaseId: published.releaseId,
      productRef: PRODUCT_REF,
      version: VERSION,
      storageKey: OBJECT_KEY,
      checksumSha256: CHECKSUM,
      sizeBytes: 4_096,
    });
    await expect(execute("downloads.find-authorized", {
      accountId: "account:unpaid",
      workspaceId: "workspace:unpaid",
      role: "owner",
      releaseId: published.releaseId,
      now: Date.now() + 1_000,
    })).resolves.toBeNull();
    await expect(execute("downloads.register", {
      grantId: "grant:unpaid",
      nonceHash: "f".repeat(64),
      accountId: "account:unpaid",
      workspaceId: "workspace:unpaid",
      releaseId: published.releaseId,
      entitlementId: "entitlement:paid",
      fingerprintHash: null,
      expiresAt: Date.now() + 300_000,
      createdAt: Date.now(),
    })).rejects.toThrow("Download grant could not be registered");
  });

  it("withdraws atomically, revokes unused grants and preserves paid history and object metadata", async () => {
    const { test, execute } = releaseTest();
    const published = await execute(
      "releases.publish",
      publication(),
    ) as { releaseId: string };
    await seedAccessFixtures(test);
    const now = Date.now();
    await execute("downloads.register", {
      grantId: "grant:unused",
      nonceHash: "d".repeat(64),
      accountId: "account:paid",
      workspaceId: "workspace:paid",
      releaseId: published.releaseId,
      entitlementId: "entitlement:paid",
      fingerprintHash: null,
      expiresAt: now + 300_000,
      createdAt: now,
    });
    await test.run((ctx) =>
      ctx.db.insert("downloadGrants", {
        id: "grant:consumed",
        nonceHash: "e".repeat(64),
        accountId: "account:paid",
        workspaceId: "workspace:paid",
        releaseId: published.releaseId,
        entitlementId: "entitlement:paid",
        requestFingerprintHash: null,
        expiresAt: now + 300_000,
        consumedAt: now + 10,
        revokedAt: null,
        createdAt: now,
      }));

    await expect(execute("releases.withdraw", {
      productRef: PRODUCT_REF,
      version: VERSION,
    })).resolves.toMatchObject({
      outcome: "withdrawn",
      status: "withdrawn",
      revokedGrantCount: 1,
    });
    await expect(execute("releases.withdraw", {
      productRef: PRODUCT_REF,
      version: VERSION,
    })).resolves.toMatchObject({
      outcome: "unchanged",
      status: "withdrawn",
    });
    await expect(execute(
      "releases.publish",
      publication(),
    )).resolves.toMatchObject({
      outcome: "unchanged",
      status: "withdrawn",
    });

    const state = await test.run(async (ctx) => ({
      releases: await ctx.db.query("releaseRecords").collect(),
      grants: await ctx.db.query("downloadGrants").collect(),
      entitlements: await ctx.db.query("entitlements").collect(),
      purchases: await ctx.db.query("purchases").collect(),
      audits: await ctx.db.query("auditEvents").collect(),
    }));
    expect(state.releases[0]).toMatchObject({
      status: "withdrawn",
      storageKey: OBJECT_KEY,
      checksumSha256: CHECKSUM,
      sizeBytes: 4_096,
    });
    expect(state.releases[0].withdrawnAt).toEqual(expect.any(Number));
    expect(state.grants.find((grant) => grant.id === "grant:unused")?.revokedAt)
      .toEqual(expect.any(Number));
    expect(
      state.grants.find((grant) => grant.id === "grant:consumed")?.revokedAt,
    ).toBeNull();
    expect(state.entitlements).toHaveLength(1);
    expect(state.entitlements[0].status).toBe("active");
    expect(state.purchases).toHaveLength(1);
    expect(state.purchases[0].status).toBe("completed");
    expect(state.audits.filter((audit) =>
      audit.action === "release.withdrawn")).toHaveLength(1);
    const withdrawalAudit = state.audits.find((audit) =>
      audit.action === "release.withdrawn");
    expect(withdrawalAudit?.metadata).not.toContain(OBJECT_KEY);
    expect(withdrawalAudit?.metadata).not.toContain(CHECKSUM);

    await expect(execute("downloads.find-authorized", {
      accountId: "account:paid",
      workspaceId: "workspace:paid",
      role: "owner",
      releaseId: published.releaseId,
      now: Date.now() + 1_000,
    })).resolves.toBeNull();
  });

  it("fails closed when withdrawing an absent or invalid release", async () => {
    const { execute } = releaseTest();
    await expect(execute("releases.withdraw", {
      productRef: PRODUCT_REF,
      version: VERSION,
    })).rejects.toThrow("Protected release is unavailable");
    await expect(execute("releases.withdraw", {
      productRef: PRODUCT_REF,
      version: "../1.2.3",
    })).rejects.toThrow("Invalid protected release metadata");
    await expect(execute("releases.withdraw", {
      productRef: PRODUCT_REF,
      version: VERSION,
      objectKey: OBJECT_KEY,
    })).rejects.toThrow("Invalid protected release metadata");
  });
});

async function seedAccessFixtures(
  test: ReturnType<typeof convexTest>,
): Promise<void> {
  const now = Date.now();
  await test.run(async (ctx) => {
    for (const kind of ["paid", "unpaid"] as const) {
      await ctx.db.insert("accounts", {
        id: `account:${kind}`,
        identityProvider: "workos",
        identitySubject: `user_${kind}`,
        emailHash: null,
        status: "active",
        deactivatedAt: null,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("workspaces", {
        id: `workspace:${kind}`,
        identityProvider: "workos",
        providerOrganizationId: null,
        name: `${kind} workspace`,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert("memberships", {
        id: `membership:${kind}`,
        workspaceId: `workspace:${kind}`,
        accountId: `account:${kind}`,
        providerMembershipId: null,
        role: "owner",
        status: "active",
        currentSince: now,
        revokedAt: null,
        createdAt: now,
        updatedAt: now,
      });
    }
    await ctx.db.insert("purchases", {
      id: "purchase:paid",
      billingProvider: "stripe",
      providerPurchaseId: "cs_paid",
      providerPaymentIntentId: "pi_paid",
      accountId: "account:paid",
      workspaceId: "workspace:paid",
      productRef: "individual-lifetime",
      status: "completed",
      currency: "USD",
      amountMinor: 89_900,
      purchasedAt: now,
      providerOccurredAt: now,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("licences", {
      id: "licence:paid",
      workspaceId: "workspace:paid",
      purchaseId: "purchase:paid",
      subscriptionId: null,
      productRef: PRODUCT_REF,
      status: "active",
      startsAt: now,
      expiresAt: null,
      updatesUntil: null,
      seatLimit: 1,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("licenceSeats", {
      id: "seat:paid",
      licenceId: "licence:paid",
      accountId: "account:paid",
      status: "active",
      assignedAt: now,
      revokedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("entitlements", {
      id: "entitlement:paid",
      workspaceId: "workspace:paid",
      accountId: "account:paid",
      licenceId: "licence:paid",
      productRef: PRODUCT_REF,
      status: "active",
      validFrom: now,
      validUntil: null,
      updatesUntil: null,
      sourceEventId: "evt_paid",
      createdAt: now,
      updatedAt: now,
    });
  });
}
