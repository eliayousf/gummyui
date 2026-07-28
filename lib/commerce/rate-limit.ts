import "server-only";
import { isIP } from "node:net";
import { executeConvex } from "../../db";
import { ownedArrayBuffer } from "./crypto";
import {
  emitOperationalEvent,
  type OperationalLogEvent,
} from "./operational-logging";

export type DistributedRateLimitPolicy =
  | "auth.callback"
  | "auth.sign_in"
  | "billing.portal"
  | "checkout.create"
  | "download.consume"
  | "download.grant"
  | "privacy.deletion.cancel"
  | "privacy.deletion.request"
  | "privacy.export.download"
  | "privacy.export.request"
  | "team.invitation"
  | "team.switch"
  | "team.workspace";

interface Policy {
  windowMs: number;
  principalCapacity?: number;
  ipCapacity: number;
  requirePrincipal: boolean;
  requireIp: boolean;
}

const policies: Readonly<Record<DistributedRateLimitPolicy, Policy>> = {
  "auth.callback": {
    windowMs: 15 * 60_000,
    ipCapacity: 30,
    requirePrincipal: false,
    requireIp: true,
  },
  "auth.sign_in": {
    windowMs: 15 * 60_000,
    ipCapacity: 20,
    requirePrincipal: false,
    requireIp: true,
  },
  "billing.portal": {
    windowMs: 10 * 60_000,
    principalCapacity: 20,
    ipCapacity: 60,
    requirePrincipal: true,
    requireIp: false,
  },
  "checkout.create": {
    windowMs: 15 * 60_000,
    principalCapacity: 5,
    ipCapacity: 20,
    requirePrincipal: true,
    requireIp: false,
  },
  "download.consume": {
    windowMs: 10 * 60_000,
    principalCapacity: 30,
    ipCapacity: 90,
    requirePrincipal: true,
    requireIp: false,
  },
  "download.grant": {
    windowMs: 10 * 60_000,
    principalCapacity: 30,
    ipCapacity: 60,
    requirePrincipal: true,
    requireIp: false,
  },
  "privacy.deletion.cancel": {
    windowMs: 24 * 60 * 60_000,
    principalCapacity: 5,
    ipCapacity: 20,
    requirePrincipal: true,
    requireIp: false,
  },
  "privacy.deletion.request": {
    windowMs: 24 * 60 * 60_000,
    principalCapacity: 3,
    ipCapacity: 12,
    requirePrincipal: true,
    requireIp: false,
  },
  "privacy.export.download": {
    windowMs: 60 * 60_000,
    principalCapacity: 20,
    ipCapacity: 60,
    requirePrincipal: true,
    requireIp: false,
  },
  "privacy.export.request": {
    windowMs: 24 * 60 * 60_000,
    principalCapacity: 2,
    ipCapacity: 10,
    requirePrincipal: true,
    requireIp: false,
  },
  "team.invitation": {
    windowMs: 24 * 60 * 60_000,
    principalCapacity: 20,
    ipCapacity: 50,
    requirePrincipal: true,
    requireIp: false,
  },
  "team.switch": {
    windowMs: 10 * 60_000,
    principalCapacity: 60,
    ipCapacity: 120,
    requirePrincipal: true,
    requireIp: false,
  },
  "team.workspace": {
    windowMs: 24 * 60 * 60_000,
    principalCapacity: 3,
    ipCapacity: 10,
    requirePrincipal: true,
    requireIp: false,
  },
};

interface RateLimitBucket {
  scopeHash: string;
  keyHash: string;
  capacity: number;
  windowMs: number;
}

export type DistributedRateLimitDecision =
  | {
      allowed: true;
      remaining: number;
      resetAt: number;
    }
  | {
      allowed: false;
      reason: "limited";
      retryAfterMs: number;
      resetAt: number;
    }
  | {
      allowed: false;
      reason: "unavailable";
    };

export async function enforceDistributedRateLimit(input: {
  policy: DistributedRateLimitPolicy;
  request: Request;
  accountId?: string;
  workspaceId?: string;
  providerSubject?: string;
  now?: number;
  environment?: Readonly<Record<string, string | undefined>>;
  logger?: (event: OperationalLogEvent) => Promise<void>;
}): Promise<DistributedRateLimitDecision> {
  const environment = input.environment ?? process.env;
  const secret = environment.RATE_LIMIT_KEY_SECRET?.trim();
  const now = input.now ?? Date.now();
  const policy = policies[input.policy];
  if (
    !secret
    || secret.length < 32
    || !Number.isSafeInteger(now)
  ) {
    return unavailableDecision(input, environment, "configuration");
  }
  const principals = principalBindings(input);
  const hasPrimaryPrincipal = Boolean(
    input.accountId || input.providerSubject,
  );
  const ip = trustedClientIp(input.request, environment);
  if (
    (policy.requirePrincipal && !hasPrimaryPrincipal)
    || (policy.requireIp && !ip)
  ) {
    return unavailableDecision(input, environment, "request_binding", ip);
  }

  try {
    const buckets: RateLimitBucket[] = [];
    if (policy.principalCapacity !== undefined) {
      for (const principal of principals) {
        buckets.push(await createBucket({
          secret,
          policy: input.policy,
          kind: principal.kind,
          subject: principal.subject,
          capacity: policy.principalCapacity,
          windowMs: policy.windowMs,
        }));
      }
    }
    if (ip) {
      buckets.push(await createBucket({
        secret,
        policy: input.policy,
        kind: "ip",
        subject: ip,
        capacity: policy.ipCapacity,
        windowMs: policy.windowMs,
      }));
    }
    if (buckets.length === 0) {
      return unavailableDecision(input, environment, "empty_bucket_set", ip);
    }
    const result = await executeConvex<unknown>("rate-limit.consume", {
      buckets,
      now,
    });
    const decision = parseDecision(result);
    if (!decision.allowed) {
      await recordRateLimitDecision(
        input,
        environment,
        decision,
        "capacity_exhausted",
        ip,
      );
    }
    return decision;
  } catch {
    return unavailableDecision(input, environment, "backend_error", ip);
  }
}

async function unavailableDecision(
  input: Parameters<typeof enforceDistributedRateLimit>[0],
  environment: Readonly<Record<string, string | undefined>>,
  reasonCode:
    | "backend_error"
    | "configuration"
    | "empty_bucket_set"
    | "request_binding",
  trustedIp?: string | null,
): Promise<DistributedRateLimitDecision> {
  const decision = { allowed: false, reason: "unavailable" } as const;
  await recordRateLimitDecision(
    input,
    environment,
    decision,
    reasonCode,
    trustedIp,
  );
  return decision;
}

async function recordRateLimitDecision(
  input: Parameters<typeof enforceDistributedRateLimit>[0],
  environment: Readonly<Record<string, string | undefined>>,
  decision: Exclude<DistributedRateLimitDecision, { allowed: true }>,
  reasonCode:
    | "backend_error"
    | "capacity_exhausted"
    | "configuration"
    | "empty_bucket_set"
    | "request_binding",
  trustedIp?: string | null,
): Promise<void> {
  const event: OperationalLogEvent = {
    name: "security.rate_limit.decision",
    severity: decision.reason === "limited" ? "warning" : "error",
    outcome: decision.reason === "limited" ? "ignored" : "degraded",
    attributes: {
      policy: input.policy,
      decision: decision.reason,
      reasonCode,
      accountBound: Boolean(input.accountId),
      workspaceBound: Boolean(input.workspaceId),
      providerBound: Boolean(input.providerSubject),
      trustedIpPresent: Boolean(trustedIp),
      ...(decision.reason === "limited"
        ? {
            retryAfterMs: decision.retryAfterMs,
            resetAt: decision.resetAt,
          }
        : {}),
    },
  };
  try {
    if (input.logger) {
      await input.logger(event);
    } else {
      await emitOperationalEvent(event, { environment });
    }
  } catch {
    // Observability must never change the fail-closed access decision.
  }
}

export function distributedRateLimitResponse(
  decision: Exclude<
    DistributedRateLimitDecision,
    { allowed: true }
  >,
): Response {
  const limited = decision.reason === "limited";
  return Response.json(
    { error: limited ? "too_many_requests" : "service_unavailable" },
    {
      status: limited ? 429 : 503,
      headers: {
        "cache-control": "private, no-store",
        "content-type": "application/json; charset=utf-8",
        "x-content-type-options": "nosniff",
        "x-robots-tag": "noindex, nofollow, noarchive",
        ...(limited
          ? {
              "retry-after": String(
                Math.min(
                  86_400,
                  Math.max(1, Math.ceil(decision.retryAfterMs / 1_000)),
                ),
              ),
            }
          : {}),
      },
    },
  );
}

function principalBindings(input: {
  accountId?: string;
  workspaceId?: string;
  providerSubject?: string;
}): Array<{
  kind: "account" | "workspace" | "provider";
  subject: string;
}> {
  const bindings: Array<{
    kind: "account" | "workspace" | "provider";
    subject: string;
  }> = [];
  if (input.accountId) {
    bindings.push({ kind: "account", subject: input.accountId });
  }
  if (input.workspaceId) {
    bindings.push({ kind: "workspace", subject: input.workspaceId });
  }
  if (!input.accountId && input.providerSubject) {
    bindings.push({ kind: "provider", subject: input.providerSubject });
  }
  return bindings;
}

function trustedClientIp(
  request: Request,
  environment: Readonly<Record<string, string | undefined>>,
): string | null {
  const value =
    request.headers.get("x-vercel-forwarded-for")
    ?? request.headers.get("x-forwarded-for")
    ?? request.headers.get("x-real-ip");
  if (!value) {
    const hostname = new URL(request.url).hostname;
    return environment.NODE_ENV === "development"
      && (hostname === "localhost" || hostname === "127.0.0.1")
      ? "127.0.0.1"
      : null;
  }
  if (value.length > 128) return null;
  const candidate = value.split(",", 1)[0]?.trim();
  return candidate && isIP(candidate) !== 0 ? candidate : null;
}

async function createBucket(input: {
  secret: string;
  policy: DistributedRateLimitPolicy;
  kind: "account" | "workspace" | "provider" | "ip";
  subject: string;
  capacity: number;
  windowMs: number;
}): Promise<RateLimitBucket> {
  const [scopeHash, keyHash] = await Promise.all([
    hmacHex(input.secret, `scope:v1:${input.policy}:${input.kind}`),
    hmacHex(
      input.secret,
      `key:v1:${input.policy}:${input.kind}:${input.subject}`,
    ),
  ]);
  return {
    scopeHash,
    keyHash,
    capacity: input.capacity,
    windowMs: input.windowMs,
  };
}

async function hmacHex(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    ownedArrayBuffer(new TextEncoder().encode(secret)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = new Uint8Array(await crypto.subtle.sign(
    "HMAC",
    key,
    ownedArrayBuffer(new TextEncoder().encode(value)),
  ));
  return [...digest]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function parseDecision(value: unknown): DistributedRateLimitDecision {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid distributed rate-limit response");
  }
  const result = value as Record<string, unknown>;
  if (
    result.allowed === true
    && Number.isSafeInteger(result.remaining)
    && Number(result.remaining) >= 0
    && Number.isSafeInteger(result.resetAt)
  ) {
    return {
      allowed: true,
      remaining: Number(result.remaining),
      resetAt: Number(result.resetAt),
    };
  }
  if (
    result.allowed === false
    && Number.isSafeInteger(result.retryAfterMs)
    && Number(result.retryAfterMs) > 0
    && Number.isSafeInteger(result.resetAt)
  ) {
    return {
      allowed: false,
      reason: "limited",
      retryAfterMs: Number(result.retryAfterMs),
      resetAt: Number(result.resetAt),
    };
  }
  throw new Error("Invalid distributed rate-limit response");
}
