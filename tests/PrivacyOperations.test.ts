import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ServerAccountAccess } from "../lib/commerce/account";
import { opaqueId } from "../lib/commerce/model";

const executeConvex = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("../db", () => ({ executeConvex }));

import {
  createDataExportResponse,
  PrivacyDeletionJob,
  readPrivacyDeletionJobConfig,
  requestAccountDeletion,
  requestDataExport,
} from "../lib/commerce/privacy-operations";

const access = {
  status: "authenticated",
  accountId: opaqueId(
    "account:workos:user_privacy_test",
    "account",
  ),
  workspaceId: opaqueId(
    "workspace:workos-personal:user_privacy_test",
    "workspace",
  ),
  workspaceLabel: "Personal workspace",
  role: "owner",
  sessionExpiresAt: 1_900_000_000_000,
} satisfies Extract<
  ServerAccountAccess,
  { status: "authenticated" }
>;

describe("account privacy operations", () => {
  beforeEach(() => executeConvex.mockReset());

  it("requires a separate deletion pepper and WorkOS server key", () => {
    expect(readPrivacyDeletionJobConfig({})).toBeNull();
    expect(() =>
      readPrivacyDeletionJobConfig({
        WORKOS_API_KEY: "sk_test_notreal",
        ACCOUNT_DELETION_PEPPER: "short",
      })).toThrow("Invalid privacy job configuration");
    expect(
      readPrivacyDeletionJobConfig({
        WORKOS_API_KEY: "sk_test_notreal",
        ACCOUNT_DELETION_PEPPER: "x".repeat(32),
      }),
    ).toEqual({
      workosApiKey: "sk_test_notreal",
      deletionPepper: "x".repeat(32),
    });
  });

  it("creates a rate-limited audited export with a seven-day expiry", async () => {
    const now = 1_800_000_000_000;
    const id = "data-export:11111111-1111-4111-8111-111111111111";
    executeConvex.mockResolvedValue({
      id,
      expiresAt: now + 7 * 24 * 60 * 60 * 1_000,
    });
    const result = await requestDataExport(access, now);
    expect(result.id).toBe(id);
    expect(result.expiresAt).toBe(now + 7 * 24 * 60 * 60 * 1_000);
    expect(executeConvex).toHaveBeenCalledWith(
      "privacy.export.request",
      expect.objectContaining({
        access,
        id: expect.stringMatching(/^data-export:[0-9a-f-]{36}$/u),
        now,
        expiresAt: result.expiresAt,
      }),
    );
  });

  it("builds an account-scoped JSON export and records its checksum", async () => {
    const now = 1_800_000_000_000;
    const exportId = "data-export:11111111-1111-4111-8111-111111111111";
    executeConvex
      .mockResolvedValueOnce({
        export: {
          id: exportId,
          requestedAt: now - 1_000,
          expiresAt: now + 10_000,
        },
        account: [{ id: access.accountId, status: "active" }],
        memberships: [{ id: "membership:test", role: "owner" }],
        purchases: [],
        subscriptions: [],
        invoices: [],
        licences: [],
        consents: [],
        downloadHistory: [],
        auditHistory: [],
      })
      .mockResolvedValueOnce(null);

    const response = await createDataExportResponse({
      access,
      exportId,
      now,
    });
    expect(response?.status).toBe(200);
    expect(response?.headers.get("content-disposition"))
      .toContain("attachment");
    expect(await response!.json()).toMatchObject({
      format: "gummy-ui-account-export",
      version: 1,
      account: [{ id: access.accountId, status: "active" }],
      memberships: [{ id: "membership:test", role: "owner" }],
    });
    expect(executeConvex).toHaveBeenLastCalledWith(
      "privacy.export.downloaded",
      expect.objectContaining({
        access,
        exportId,
        checksumSha256: expect.stringMatching(/^[a-f0-9]{64}$/u),
      }),
    );
  });

  it("returns the blocker calculated by the Convex deletion transaction", async () => {
    executeConvex.mockResolvedValue({
      id: "data-deletion:22222222-2222-4222-8222-222222222222",
      status: "blocked",
      blockerCode: "active_subscription",
      retentionUntil: null,
    });
    await expect(
      requestAccountDeletion(access, 1_800_000_000_000),
    ).resolves.toMatchObject({
      status: "blocked",
      blockerCode: "active_subscription",
      retentionUntil: null,
    });
  });

  it("deletes WorkOS identity only after Convex releases the final-notice gate", async () => {
    const deletionId =
      "data-deletion:22222222-2222-4222-8222-222222222222";
    executeConvex
      .mockResolvedValueOnce({
        unblocked: 0,
        queued: 0,
        candidate: {
          deletionId,
          accountId: access.accountId,
          workspaceId: access.workspaceId,
          userId: "user_privacy_test",
        },
      })
      .mockResolvedValueOnce(null);
    const workos = {
      userManagement: {
        deleteUser: vi.fn(async () => undefined),
      },
    };
    const job = new PrivacyDeletionJob(
      {
        workosApiKey: "sk_test_notreal",
        deletionPepper: "x".repeat(32),
      },
      workos as never,
    );

    await expect(job.run(1_800_000_000_000)).resolves.toEqual({
      unblocked: 0,
      queued: 0,
      completed: 1,
      deferred: 0,
    });
    expect(workos.userManagement.deleteUser)
      .toHaveBeenCalledWith("user_privacy_test");
    expect(executeConvex).toHaveBeenLastCalledWith(
      "privacy.deletion.complete",
      expect.objectContaining({
        deletionId,
        accountId: access.accountId,
        deletedSubject: expect.stringMatching(/^deleted_[a-f0-9]{64}$/u),
      }),
    );
  });
});
