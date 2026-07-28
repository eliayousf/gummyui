import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const cron = vi.hoisted(() => ({
  backup: vi.fn(),
  backupVerify: vi.fn(),
  emailOutbox: vi.fn(),
  heartbeat: vi.fn(),
  privacyJobs: vi.fn(),
}));

vi.mock("../lib/commerce/better-stack-heartbeats", () => ({
  pingBetterStackHeartbeat: cron.heartbeat,
}));
vi.mock("../lib/commerce/operational-logging", () => ({
  emitOperationalEvent: vi.fn(async () => undefined),
}));
vi.mock("../lib/commerce/resend-outbox", () => ({
  readResendOutboxConfig: vi.fn(() => ({ configured: true })),
  ResendOutboxWorker: class {
    drain() {
      return cron.emailOutbox();
    }
  },
}));
vi.mock("../lib/commerce/privacy-operations", () => ({
  readPrivacyDeletionJobConfig: vi.fn(() => ({ configured: true })),
  PrivacyDeletionJob: class {
    run() {
      return cron.privacyJobs();
    }
  },
}));
vi.mock("../lib/commerce/backup-runtime", () => ({
  readOperationalBackupConfig: vi.fn(() => ({ configured: true })),
  BackblazeBackupArchiveStore: class {},
  ConvexBackupSnapshotSource: class {},
  createAndVerifyOperationalBackup: cron.backup,
  verifyLatestOperationalBackup: cron.backupVerify,
}));

import { GET as backupCron } from "../app/api/cron/backup/route";
import { GET as backupVerifyCron } from "../app/api/cron/backup-verify/route";
import { GET as emailOutboxCron } from "../app/api/cron/email-outbox/route";
import { GET as privacyJobsCron } from "../app/api/cron/privacy-jobs/route";

const secret = "cron-secret-not-real".padEnd(32, "x");
const previousCronSecret = process.env.CRON_SECRET;
const request = () => new Request("https://gummyui.dev/api/cron/test", {
  headers: { authorization: `Bearer ${secret}` },
});
const evidence = {
  backupId: "backup-test",
  createdAt: 1_800_000_000_000,
  tableCount: 24,
  recordCount: 1,
  verified: true,
};

describe("cron success heartbeats", () => {
  afterAll(() => {
    if (previousCronSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = previousCronSecret;
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = secret;
    cron.heartbeat.mockResolvedValue("sent");
    cron.emailOutbox.mockResolvedValue({
      claimed: 1,
      accepted: 1,
      deferred: 0,
      deadLettered: 0,
    });
    cron.privacyJobs.mockResolvedValue({
      claimed: 1,
      deleted: 1,
      deferred: 0,
    });
    cron.backup.mockResolvedValue(evidence);
    cron.backupVerify.mockResolvedValue(evidence);
  });

  it.each([
    ["email-outbox", emailOutboxCron, cron.emailOutbox],
    ["privacy-jobs", privacyJobsCron, cron.privacyJobs],
    ["backup", backupCron, cron.backup],
    ["backup-verify", backupVerifyCron, cron.backupVerify],
  ] as const)(
    "pings %s only after the corresponding job succeeds",
    async (job, route, worker) => {
      const response = await route(request());
      expect(response.status).toBe(200);
      expect(cron.heartbeat).toHaveBeenCalledExactlyOnceWith(job);
      expect(worker.mock.invocationCallOrder[0])
        .toBeLessThan(cron.heartbeat.mock.invocationCallOrder[0]);
    },
  );

  it.each([
    ["email-outbox", emailOutboxCron, cron.emailOutbox],
    ["privacy-jobs", privacyJobsCron, cron.privacyJobs],
    ["backup", backupCron, cron.backup],
    ["backup-verify", backupVerifyCron, cron.backupVerify],
  ] as const)(
    "does not ping %s when the corresponding job fails",
    async (_job, route, worker) => {
      worker.mockRejectedValueOnce(new Error("job failed"));
      const response = await route(request());
      expect(response.status).toBe(503);
      expect(cron.heartbeat).not.toHaveBeenCalled();
    },
  );
});
