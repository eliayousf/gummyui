import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";

const repositoryRoot = process.cwd();
const scanRoot = mkdtempSync(join(tmpdir(), "gummyui-secret-scan-"));

function fail(message) {
  throw new Error(`Secret scan preparation failed: ${message}`);
}

function safeRepositoryPath(candidate) {
  if (!candidate || isAbsolute(candidate)) {
    fail(`unsafe repository path ${JSON.stringify(candidate)}`);
  }

  const absolute = resolve(repositoryRoot, candidate);
  const repositoryRelative = relative(repositoryRoot, absolute);
  if (
    repositoryRelative === ".." ||
    repositoryRelative.startsWith(`..${sep}`)
  ) {
    fail(`path escapes the repository: ${JSON.stringify(candidate)}`);
  }
  return absolute;
}

function copyFile(candidate) {
  const source = safeRepositoryPath(candidate);
  if (!existsSync(source)) return;

  const stat = lstatSync(source);
  if (!stat.isFile()) {
    fail(`expected a regular file: ${JSON.stringify(candidate)}`);
  }

  const destination = join(scanRoot, candidate);
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination);
}

function copyArtifactDirectory(candidate) {
  const source = safeRepositoryPath(candidate);
  if (!existsSync(source)) return;

  const destination = join(scanRoot, candidate);
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination, {
    recursive: true,
    dereference: false,
    filter(sourcePath) {
      return !lstatSync(sourcePath).isSymbolicLink();
    },
  });
}

try {
  const listed = spawnSync(
    "git",
    [
      "ls-files",
      "--cached",
      "--others",
      "--exclude-standard",
      "--deduplicate",
      "-z",
    ],
    {
      cwd: repositoryRoot,
      encoding: "buffer",
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  if (listed.status !== 0) {
    fail("git could not enumerate repository source");
  }

  for (const entry of listed.stdout.toString("utf8").split("\0")) {
    if (entry) copyFile(entry);
  }

  // Scan the built Vinext artifact and the browser-delivered part of Next's
  // artifact in addition to repository source. Server-only Next output may
  // legitimately contain runtime values and is checked by the separate
  // public-artifact boundary.
  copyArtifactDirectory("dist");
  copyArtifactDirectory(join(".next", "static"));

  const gitleaksArgs = [
    "dir",
    scanRoot,
    "--config",
    join(repositoryRoot, ".gitleaks.toml"),
    "--redact",
    "--no-banner",
  ];
  if (process.env.GUMMYUI_GITLEAKS_REPORT_PATH) {
    gitleaksArgs.push(
      "--report-format",
      "json",
      "--report-path",
      process.env.GUMMYUI_GITLEAKS_REPORT_PATH,
    );
  }

  const result = spawnSync("gitleaks", gitleaksArgs, {
    cwd: repositoryRoot,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exitCode = result.status ?? 1;
} finally {
  rmSync(scanRoot, { recursive: true, force: true });
}
