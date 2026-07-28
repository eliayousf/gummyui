import "server-only";
import { WorkOS } from "@workos-inc/node";
import { executeConvex } from "../../db";
import type { ServerAccountAccess } from "./account";
import { isValidWorkOSApiKey } from "./workos-api-key";

type AuthenticatedAccess = Extract<
  ServerAccountAccess,
  { status: "authenticated" }
>;

const EXPORT_TTL_MS = 7 * 24 * 60 * 60 * 1_000;

export interface PrivacyDeletionJobConfig {
  workosApiKey: string;
  deletionPepper: string;
}

interface ExportProjection {
  export: {
    id: string;
    requestedAt: number;
    expiresAt: number;
  };
  account: unknown[];
  memberships: unknown[];
  purchases: unknown[];
  subscriptions: unknown[];
  invoices: unknown[];
  licences: unknown[];
  consents: unknown[];
  downloadHistory: unknown[];
  auditHistory: unknown[];
}

interface DeletionCandidate {
  deletionId: string;
  accountId: string;
  workspaceId: string | null;
  userId: string;
}

export function readPrivacyDeletionJobConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): PrivacyDeletionJobConfig | null {
  const workosApiKey = environment.WORKOS_API_KEY?.trim();
  const deletionPepper = environment.ACCOUNT_DELETION_PEPPER?.trim();
  if (!workosApiKey && !deletionPepper) return null;
  if (
    !workosApiKey
    || !deletionPepper
    || !isValidWorkOSApiKey(workosApiKey)
    || deletionPepper.length < 32
  ) {
    throw new Error("Invalid privacy job configuration");
  }
  return { workosApiKey, deletionPepper };
}

export async function requestDataExport(
  access: AuthenticatedAccess,
  now = Date.now(),
): Promise<{ id: string; expiresAt: number }> {
  const id = `data-export:${crypto.randomUUID()}`;
  const expiresAt = now + EXPORT_TTL_MS;
  return executeConvex("privacy.export.request", {
    access,
    id,
    now,
    expiresAt,
  });
}

export async function createDataExportResponse(input: {
  access: AuthenticatedAccess;
  exportId: string;
  now?: number;
}): Promise<Response | null> {
  const now = input.now ?? Date.now();
  if (!/^data-export:[0-9a-f-]{36}$/u.test(input.exportId)) {
    return null;
  }
  const projection = await executeConvex<ExportProjection | null>(
    "privacy.export.read",
    {
      access: input.access,
      exportId: input.exportId,
      now,
    },
  );
  if (!projection) return null;
  const body = JSON.stringify({
    format: "gummy-ui-account-export",
    version: 1,
    generatedAt: new Date(now).toISOString(),
    export: {
      id: projection.export.id,
      requestedAt: new Date(projection.export.requestedAt).toISOString(),
      expiresAt: new Date(projection.export.expiresAt).toISOString(),
    },
    account: projection.account,
    memberships: projection.memberships,
    purchases: projection.purchases,
    subscriptions: projection.subscriptions,
    invoices: projection.invoices,
    licences: projection.licences,
    consents: projection.consents,
    downloadHistory: projection.downloadHistory,
    auditHistory: projection.auditHistory,
    note:
      "Authentication and payment-card data are controlled by WorkOS and Stripe and are not stored in Gummy UI.",
  }, null, 2);
  const checksumSha256 = await sha256Hex(body);
  await executeConvex("privacy.export.downloaded", {
    access: input.access,
    exportId: input.exportId,
    checksumSha256,
    auditId:
      `audit:${input.exportId}:download:${crypto.randomUUID()}`,
    now,
  });
  return new Response(body, {
    status: 200,
    headers: {
      "cache-control": "private, no-store",
      "content-disposition":
        `attachment; filename="gummy-ui-data-export-${new Date(now).toISOString().slice(0, 10)}.json"`,
      "content-type": "application/json; charset=utf-8",
      "x-content-type-options": "nosniff",
      "x-robots-tag": "noindex, nofollow, noarchive",
    },
  });
}

export async function requestAccountDeletion(
  access: AuthenticatedAccess,
  now = Date.now(),
): Promise<{
  id: string;
  status: "verified" | "blocked";
  blockerCode: string | null;
  retentionUntil: number | null;
}> {
  return executeConvex("privacy.deletion.request", {
    access,
    id: `data-deletion:${crypto.randomUUID()}`,
    now,
  });
}

export async function cancelAccountDeletion(input: {
  access: AuthenticatedAccess;
  deletionId: string;
  now?: number;
}): Promise<boolean> {
  if (!/^data-deletion:[0-9a-f-]{36}$/u.test(input.deletionId)) {
    return false;
  }
  return executeConvex("privacy.deletion.cancel", {
    access: input.access,
    deletionId: input.deletionId,
    now: input.now ?? Date.now(),
  });
}

export class PrivacyDeletionJob {
  constructor(
    private readonly config: PrivacyDeletionJobConfig,
    private readonly workos = new WorkOS(config.workosApiKey),
  ) {}

  async run(now = Date.now()): Promise<{
    unblocked: number;
    queued: number;
    completed: number;
    deferred: number;
  }> {
    const prepared = await executeConvex<{
      unblocked: number;
      queued: number;
      candidate: DeletionCandidate | null;
    }>("privacy.deletion.prepare", { now });
    if (!prepared.candidate) {
      return {
        unblocked: prepared.unblocked,
        queued: prepared.queued,
        completed: 0,
        deferred: 0,
      };
    }
    const candidate = prepared.candidate;
    try {
      await this.workos.userManagement.deleteUser(candidate.userId);
    } catch (error) {
      const status =
        error && typeof error === "object"
          ? Number((error as { status?: unknown }).status)
          : Number.NaN;
      if (status !== 404) {
        await executeConvex("privacy.deletion.defer", {
          deletionId: candidate.deletionId,
          code: Number.isFinite(status)
            ? `identity_delete_${status}`
            : "identity_delete_unavailable",
          now,
        });
        return {
          unblocked: prepared.unblocked,
          queued: prepared.queued,
          completed: 0,
          deferred: 1,
        };
      }
    }
    const deletedSubject =
      `deleted_${await sha256Hex(
        `${this.config.deletionPepper}:${candidate.userId}`,
      )}`;
    await executeConvex("privacy.deletion.complete", {
      deletionId: candidate.deletionId,
      accountId: candidate.accountId,
      deletedSubject,
      now,
    });
    return {
      unblocked: prepared.unblocked,
      queued: prepared.queued,
      completed: 1,
      deferred: 0,
    };
  }
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")).join("");
}
