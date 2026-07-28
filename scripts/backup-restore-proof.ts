import {
  BackblazeBackupArchiveStore,
  ConvexBackupRestoreTarget,
  proveLatestOperationalBackupRestore,
  readOperationalBackupConfig,
  readOperationalRestoreProofConfig,
} from "../lib/commerce/backup-runtime";

async function main(): Promise<void> {
  try {
    const backupConfig = readOperationalBackupConfig();
    const restoreConfig = readOperationalRestoreProofConfig();
    if (!backupConfig || !restoreConfig) {
      throw new Error("Restore proof is not configured");
    }
    const evidence = await proveLatestOperationalBackupRestore({
      backupConfig,
      restoreConfig,
      store: new BackblazeBackupArchiveStore(backupConfig),
      target: new ConvexBackupRestoreTarget(restoreConfig),
    });
    process.stdout.write(`${JSON.stringify({
      ok: true,
      evidence,
    })}\n`);
  } catch {
    // Never print SDK diagnostics, URLs, records, or secrets. Operators use
    // provider-side request logs and the fixed failure code for investigation.
    process.stderr.write(
      `${JSON.stringify({
        ok: false,
        error: "backup_restore_proof_failed",
      })}\n`,
    );
    process.exitCode = 1;
  }
}

await main();
