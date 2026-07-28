import {
  BackblazeBackupArchiveStore,
  ConvexBackupSnapshotSource,
  createAndVerifyOperationalBackup,
  readOperationalBackupConfig,
} from "../../../../lib/commerce/backup-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const PRIVATE_HEADERS = {
  "cache-control": "private, no-store",
  "content-type": "application/json; charset=utf-8",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow, noarchive",
} as const;

export async function GET(request: Request) {
  if (!authorizedCron(request)) {
    return Response.json(
      { error: "not_found" },
      { status: 404, headers: PRIVATE_HEADERS },
    );
  }
  try {
    const config = readOperationalBackupConfig();
    if (!config) throw new Error("Backup configuration is unavailable");
    const evidence = await createAndVerifyOperationalBackup({
      config,
      source: new ConvexBackupSnapshotSource(),
      store: new BackblazeBackupArchiveStore(config),
    });
    return Response.json(
      {
        ok: true,
        backupId: evidence.backupId,
        createdAt: evidence.createdAt,
        tableCount: evidence.tableCount,
        recordCount: evidence.recordCount,
        verified: evidence.verified,
      },
      { status: 200, headers: PRIVATE_HEADERS },
    );
  } catch {
    return Response.json(
      { error: "backup_unavailable" },
      { status: 503, headers: PRIVATE_HEADERS },
    );
  }
}

function authorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  return Boolean(
    secret
    && secret.length >= 32
    && request.headers.get("authorization") === `Bearer ${secret}`,
  );
}
