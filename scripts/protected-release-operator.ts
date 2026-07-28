import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import {
  parseProtectedReleasePublication,
  parseProtectedReleaseWithdrawal,
  PROTECTED_RELEASE_METADATA_SCHEMA,
  type ProtectedReleasePublication,
  type ProtectedReleaseWithdrawal,
} from "../lib/commerce/protected-releases";

type ReleaseOperation = "publish" | "withdraw";
type ReleaseInput =
  | ProtectedReleasePublication
  | ProtectedReleaseWithdrawal;

interface OperatorConfig {
  url: string;
  serverSecret: string;
}

interface OperatorDependencies {
  argv?: string[];
  environment?: Readonly<Record<string, string | undefined>>;
  readTextFile?: (path: string) => Promise<string>;
  execute?: (
    config: OperatorConfig,
    operation: `releases.${ReleaseOperation}`,
    input: ReleaseInput,
  ) => Promise<unknown>;
  writeOutput?: (output: string) => void;
}

const commerceExecute = makeFunctionReference<
  "mutation",
  {
    serverSecret: string;
    operation: string;
    input: unknown;
  },
  unknown
>("commerce:execute");

const APPLY_CONFIRMATION = "APPLY_PROTECTED_RELEASE_TO_CONFIGURED_CONVEX";
const MAX_METADATA_BYTES = 16_384;

export async function runProtectedReleaseOperator(
  dependencies: OperatorDependencies = {},
): Promise<void> {
  const argv = dependencies.argv ?? process.argv.slice(2);
  const environment = dependencies.environment ?? process.env;
  const readTextFile = dependencies.readTextFile
    ?? ((path: string) => readFile(path, "utf8"));
  const execute = dependencies.execute ?? executeConfiguredMutation;
  const writeOutput = dependencies.writeOutput
    ?? ((output: string) => console.log(output));
  const { operation, metadataPath, apply } = parseArguments(argv);

  const raw = await readTextFile(metadataPath);
  if (Buffer.byteLength(raw, "utf8") > MAX_METADATA_BYTES) {
    throw new Error("Protected release metadata is too large");
  }
  const input = parseOperatorMetadata(operation, raw);
  const redactedPlan = {
    mode: apply ? "apply" : "dry-run",
    operation,
    productRef: input.productRef,
    version: input.version,
  };

  if (!apply) {
    writeOutput(JSON.stringify(redactedPlan));
    return;
  }

  const config = readOperatorConfig(environment);
  const result = await execute(config, `releases.${operation}`, input);
  writeOutput(JSON.stringify({
    ...redactedPlan,
    ...redactedResult(result),
  }));
}

export function parseOperatorMetadata(
  operation: ReleaseOperation,
  raw: string,
): ReleaseInput {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("Invalid protected release metadata JSON");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid protected release metadata JSON");
  }
  const record = value as Record<string, unknown>;
  if (record.schemaVersion !== PROTECTED_RELEASE_METADATA_SCHEMA) {
    throw new Error("Invalid protected release metadata schema");
  }
  const metadata = { ...record };
  delete metadata.schemaVersion;
  return operation === "publish"
    ? parseProtectedReleasePublication(metadata)
    : parseProtectedReleaseWithdrawal(metadata);
}

function parseArguments(argv: string[]): {
  operation: ReleaseOperation;
  metadataPath: string;
  apply: boolean;
} {
  const apply = argv.includes("--apply");
  const positional = argv.filter((value) => value !== "--apply");
  if (
    positional.length !== 2
    || (positional[0] !== "publish" && positional[0] !== "withdraw")
    || positional[1].length === 0
    || argv.some((value) => value.startsWith("--") && value !== "--apply")
    || argv.filter((value) => value === "--apply").length > 1
  ) {
    throw new Error(
      "Usage: protected-release-operator <publish|withdraw> <metadata.json> [--apply]",
    );
  }
  return {
    operation: positional[0],
    metadataPath: positional[1],
    apply,
  };
}

function readOperatorConfig(
  environment: Readonly<Record<string, string | undefined>>,
): OperatorConfig {
  const urlValue = environment.PROTECTED_RELEASE_CONVEX_URL?.trim();
  const serverSecret = environment.CONVEX_SERVER_SECRET?.trim();
  const confirmation =
    environment.PROTECTED_RELEASE_APPLY_CONFIRMATION?.trim();
  if (
    !urlValue
    || !serverSecret
    || serverSecret.length < 32
    || confirmation !== APPLY_CONFIRMATION
  ) {
    throw new Error("Protected release apply configuration is unavailable");
  }
  const url = new URL(urlValue);
  if (
    url.protocol !== "https:"
    || url.pathname !== "/"
    || url.search
    || url.hash
    || url.username
    || url.password
    || !url.hostname.endsWith(".convex.cloud")
  ) {
    throw new Error("Invalid protected release Convex deployment URL");
  }
  return { url: url.origin, serverSecret };
}

async function executeConfiguredMutation(
  config: OperatorConfig,
  operation: `releases.${ReleaseOperation}`,
  input: ReleaseInput,
): Promise<unknown> {
  const client = new ConvexHttpClient(config.url, { logger: false });
  return client.mutation(commerceExecute, {
    serverSecret: config.serverSecret,
    operation,
    input,
  });
}

function redactedResult(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid protected release operation result");
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.outcome !== "string"
    || typeof record.status !== "string"
  ) {
    throw new Error("Invalid protected release operation result");
  }
  const result: Record<string, unknown> = {
    outcome: record.outcome,
    status: record.status,
  };
  if (
    typeof record.revokedGrantCount === "number"
    && Number.isSafeInteger(record.revokedGrantCount)
    && record.revokedGrantCount >= 0
  ) {
    result.revokedGrantCount = record.revokedGrantCount;
  }
  return result;
}

const directEntryUrl = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : null;
if (directEntryUrl === import.meta.url) {
  runProtectedReleaseOperator().catch((error: unknown) => {
    const message = error instanceof Error
      ? error.message
      : "Unknown protected release operator failure";
    console.error(`Protected release operation failed: ${message}`);
    process.exitCode = 1;
  });
}
