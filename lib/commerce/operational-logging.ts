import "server-only";
import { scrubLogValue } from "./security";

const MAX_LOG_BYTES = 32_000;
const EVENT_NAME = /^[a-z][a-z0-9_.-]{2,95}$/u;
const BETTER_STACK_HOST =
  /^(?:in\.logs\.betterstack\.com|s[0-9]+\.[a-z0-9-]+\.betterstackdata\.com)$/u;

export type OperationalLogSeverity =
  | "debug"
  | "info"
  | "warning"
  | "error"
  | "critical";

export interface OperationalLogEvent {
  name: string;
  severity: OperationalLogSeverity;
  outcome: "success" | "failure" | "degraded" | "ignored";
  attributes?: Readonly<Record<string, unknown>>;
  occurredAt?: number;
}

export interface BetterStackLogConfig {
  sourceToken: string;
  ingestUrl: string;
}

interface OperationalLogDependencies {
  environment?: Readonly<Record<string, string | undefined>>;
  fetcher?: typeof fetch;
  writer?: (line: string) => void;
}

export function readBetterStackLogConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): BetterStackLogConfig | null {
  const sourceToken = environment.BETTER_STACK_SOURCE_TOKEN?.trim();
  const host = environment.BETTER_STACK_INGESTING_HOST?.trim().toLowerCase();
  if (!sourceToken && !host) return null;
  if (
    !sourceToken
    || !host
    || sourceToken.length < 20
    || sourceToken.length > 256
    || /[\u0000-\u0020]/u.test(sourceToken)
    || !BETTER_STACK_HOST.test(host)
  ) {
    throw new Error("Invalid Better Stack log configuration");
  }
  return {
    sourceToken,
    ingestUrl: `https://${host}/`,
  };
}

/**
 * Writes one bounded JSON event locally and mirrors it to Better Stack when
 * configured. Remote ingestion is deliberately best-effort so observability
 * can never turn a successful customer operation into a failure.
 */
export async function emitOperationalEvent(
  event: OperationalLogEvent,
  dependencies: OperationalLogDependencies = {},
): Promise<void> {
  if (!EVENT_NAME.test(event.name)) {
    throw new Error("Invalid operational event name");
  }
  const environment = dependencies.environment ?? process.env;
  const document = {
    schemaVersion: "1",
    service: "gummyui-public",
    environment: deploymentEnvironment(environment),
    event: event.name,
    severity: event.severity,
    outcome: event.outcome,
    occurredAt: new Date(event.occurredAt ?? Date.now()).toISOString(),
    attributes: scrubLogValue(event.attributes ?? {}),
  };
  const line = boundedJson(document);
  (dependencies.writer ?? ((value) => console.log(value)))(line);

  let config: BetterStackLogConfig | null;
  try {
    config = readBetterStackLogConfig(environment);
  } catch {
    return;
  }
  if (!config) return;
  try {
    await (dependencies.fetcher ?? fetch)(config.ingestUrl, {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.sourceToken}`,
        "content-type": "application/json",
      },
      body: line,
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    // Local structured output remains the source of truth if ingestion fails.
  }
}

function deploymentEnvironment(
  environment: Readonly<Record<string, string | undefined>>,
): "production" | "preview" | "development" | "test" | "unknown" {
  const value = environment.VERCEL_ENV ?? environment.NODE_ENV;
  return value === "production"
    || value === "preview"
    || value === "development"
    || value === "test"
    ? value
    : "unknown";
}

function boundedJson(value: Record<string, unknown>): string {
  const serialized = JSON.stringify(value);
  if (new TextEncoder().encode(serialized).byteLength <= MAX_LOG_BYTES) {
    return serialized;
  }
  return JSON.stringify({
    ...value,
    attributes: { truncated: true },
  });
}
