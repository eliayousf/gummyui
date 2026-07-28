import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const executeFile = promisify(execFile);

describe("backup restore-proof operator runner", () => {
  it("fails with a fixed non-sensitive response when not explicitly configured", async () => {
    const script = path.join(
      process.cwd(),
      "scripts/backup-restore-proof.ts",
    );
    const execution = executeFile(
      process.execPath,
      [
        "--conditions=react-server",
        "--import",
        "tsx",
        script,
      ],
      {
        cwd: process.cwd(),
        env: {
          PATH: process.env.PATH,
          NODE_ENV: "test",
          SECRET_THAT_MUST_NOT_LEAK: "private-test-value",
        },
      },
    );
    await expect(execution).rejects.toMatchObject({
      code: 1,
      stdout: "",
      stderr:
        "{\"ok\":false,\"error\":\"backup_restore_proof_failed\"}\n",
    });
    try {
      await execution;
    } catch (error) {
      expect(JSON.stringify(error)).not.toContain("private-test-value");
    }
  }, 20_000);
});
