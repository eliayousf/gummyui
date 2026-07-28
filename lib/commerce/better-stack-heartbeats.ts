import "server-only";

const BETTER_STACK_HEARTBEAT_ORIGIN = "https://uptime.betterstack.com";
const BETTER_STACK_HEARTBEAT_PATH =
  /^\/api\/v1\/heartbeat\/[A-Za-z0-9_-]{16,256}$/u;

export const BETTER_STACK_HEARTBEAT_ENV = {
  "email-outbox": "BETTER_STACK_HEARTBEAT_EMAIL_OUTBOX_URL",
  "privacy-jobs": "BETTER_STACK_HEARTBEAT_PRIVACY_JOBS_URL",
  backup: "BETTER_STACK_HEARTBEAT_BACKUP_URL",
  "backup-verify": "BETTER_STACK_HEARTBEAT_BACKUP_VERIFY_URL",
} as const;

export type BetterStackHeartbeatJob =
  keyof typeof BETTER_STACK_HEARTBEAT_ENV;

export type BetterStackHeartbeatResult =
  | "disabled"
  | "sent"
  | "invalid_configuration"
  | "request_failed";

export interface BetterStackHeartbeatConfig {
  readonly url: string;
}

interface BetterStackHeartbeatDependencies {
  environment?: Readonly<Record<string, string | undefined>>;
  fetcher?: typeof fetch;
}

export function readBetterStackHeartbeatConfig(
  job: BetterStackHeartbeatJob,
  environment: Readonly<Record<string, string | undefined>> = process.env,
): BetterStackHeartbeatConfig | null {
  const value = environment[BETTER_STACK_HEARTBEAT_ENV[job]]?.trim();
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Invalid Better Stack heartbeat configuration");
  }
  if (
    url.origin !== BETTER_STACK_HEARTBEAT_ORIGIN
    || url.username
    || url.password
    || url.search
    || url.hash
    || !BETTER_STACK_HEARTBEAT_PATH.test(url.pathname)
  ) {
    throw new Error("Invalid Better Stack heartbeat configuration");
  }
  return { url: url.toString() };
}

/**
 * Sends a success heartbeat after a cron job has completed. Delivery is
 * deliberately best-effort: a monitoring outage must not make a completed,
 * potentially non-idempotent job retry. The result contains no secret URL.
 */
export async function pingBetterStackHeartbeat(
  job: BetterStackHeartbeatJob,
  dependencies: BetterStackHeartbeatDependencies = {},
): Promise<BetterStackHeartbeatResult> {
  let config: BetterStackHeartbeatConfig | null;
  try {
    config = readBetterStackHeartbeatConfig(
      job,
      dependencies.environment ?? process.env,
    );
  } catch {
    return "invalid_configuration";
  }
  if (!config) return "disabled";

  try {
    const response = await (dependencies.fetcher ?? fetch)(config.url, {
      method: "GET",
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(5_000),
    });
    return response.ok ? "sent" : "request_failed";
  } catch {
    return "request_failed";
  }
}
