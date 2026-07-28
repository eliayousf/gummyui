import { beforeEach, describe, expect, it, vi } from "vitest";

const executeConvex = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("../db", () => ({ executeConvex }));

import {
  distributedRateLimitResponse,
  enforceDistributedRateLimit,
} from "../lib/commerce/rate-limit";

const environment = {
  RATE_LIMIT_KEY_SECRET: "rate-limit-key-secret-not-real-123",
};

function request(headers: Record<string, string> = {}): Request {
  return new Request("https://gummyui.dev/api/checkout", {
    headers: {
      "x-vercel-forwarded-for": "203.0.113.8",
      ...headers,
    },
  });
}

describe("distributed rate-limit boundary", () => {
  beforeEach(() => executeConvex.mockReset());

  it("sends only non-reversible bucket hashes to Convex", async () => {
    executeConvex.mockResolvedValue({
      allowed: true,
      remaining: 4,
      resetAt: 1_800_000_900_000,
    });
    await expect(enforceDistributedRateLimit({
      policy: "checkout.create",
      request: request({ "x-forwarded-for": "198.51.100.99" }),
      accountId: "account:workos:user_private",
      workspaceId: "workspace:workos:org_private",
      now: 1_800_000_000_000,
      environment,
    })).resolves.toMatchObject({ allowed: true, remaining: 4 });

    const [operation, input] = executeConvex.mock.calls[0] as [
      string,
      { buckets: Array<Record<string, unknown>> },
    ];
    expect(operation).toBe("rate-limit.consume");
    expect(input.buckets).toHaveLength(3);
    for (const bucket of input.buckets) {
      expect(bucket.scopeHash).toMatch(/^[a-f0-9]{64}$/u);
      expect(bucket.keyHash).toMatch(/^[a-f0-9]{64}$/u);
    }
    const serialized = JSON.stringify(input);
    expect(serialized).not.toContain("user_private");
    expect(serialized).not.toContain("org_private");
    expect(serialized).not.toContain("203.0.113.8");
    expect(serialized).not.toContain("198.51.100.99");
  });

  it("uses Vercel's trusted IP and cannot bypass the principal bucket", async () => {
    executeConvex.mockResolvedValue({
      allowed: true,
      remaining: 4,
      resetAt: 1_800_000_900_000,
    });
    const common = {
      policy: "checkout.create" as const,
      accountId: "account:stable",
      workspaceId: "workspace:stable",
      now: 1_800_000_000_000,
      environment,
    };
    await enforceDistributedRateLimit({
      ...common,
      request: request({ "x-forwarded-for": "198.51.100.1" }),
    });
    await enforceDistributedRateLimit({
      ...common,
      request: request({ "x-forwarded-for": "198.51.100.2" }),
    });
    const first = executeConvex.mock.calls[0][1];
    const second = executeConvex.mock.calls[1][1];
    expect(first.buckets).toEqual(second.buckets);
  });

  it("keeps an account bucket stable when the workspace changes", async () => {
    executeConvex.mockResolvedValue({
      allowed: true,
      remaining: 4,
      resetAt: 1_800_000_900_000,
    });
    const common = {
      policy: "checkout.create" as const,
      accountId: "account:stable",
      request: request(),
      now: 1_800_000_000_000,
      environment,
    };
    await enforceDistributedRateLimit({
      ...common,
      workspaceId: "workspace:first",
    });
    await enforceDistributedRateLimit({
      ...common,
      workspaceId: "workspace:second",
    });
    const first = executeConvex.mock.calls[0][1].buckets;
    const second = executeConvex.mock.calls[1][1].buckets;
    expect(first[0]).toEqual(second[0]);
    expect(first[1].keyHash).not.toBe(second[1].keyHash);
  });

  it("fails closed when configuration or Convex is unavailable", async () => {
    const logger = vi.fn(async () => undefined);
    await expect(enforceDistributedRateLimit({
      policy: "auth.sign_in",
      request: request(),
      environment: {},
      logger,
    })).resolves.toEqual({ allowed: false, reason: "unavailable" });
    expect(executeConvex).not.toHaveBeenCalled();
    expect(logger).toHaveBeenCalledWith(expect.objectContaining({
      name: "security.rate_limit.decision",
      severity: "error",
      outcome: "degraded",
      attributes: expect.objectContaining({
        policy: "auth.sign_in",
        decision: "unavailable",
        reasonCode: "configuration",
      }),
    }));

    executeConvex.mockResolvedValue(null);
    const result = await enforceDistributedRateLimit({
      policy: "auth.sign_in",
      request: request(),
      environment,
      logger,
    });
    expect(result).toEqual({ allowed: false, reason: "unavailable" });
  });

  it("logs a redacted suspicious decision without identity or IP material", async () => {
    const logger = vi.fn(async () => undefined);
    executeConvex.mockResolvedValue({
      allowed: false,
      retryAfterMs: 60_000,
      resetAt: 1_800_000_060_000,
    });
    await expect(enforceDistributedRateLimit({
      policy: "checkout.create",
      request: request(),
      accountId: "account:private",
      workspaceId: "workspace:private",
      now: 1_800_000_000_000,
      environment,
      logger,
    })).resolves.toEqual({
      allowed: false,
      reason: "limited",
      retryAfterMs: 60_000,
      resetAt: 1_800_000_060_000,
    });

    const serialized = JSON.stringify(logger.mock.calls);
    expect(serialized).toContain("security.rate_limit.decision");
    expect(serialized).toContain("capacity_exhausted");
    expect(serialized).not.toContain("account:private");
    expect(serialized).not.toContain("workspace:private");
    expect(serialized).not.toContain("203.0.113.8");
    expect(serialized).not.toContain(environment.RATE_LIMIT_KEY_SECRET);
  });

  it("uses a fixed loopback bucket only for the explicit development runtime", async () => {
    executeConvex.mockResolvedValue({
      allowed: true,
      remaining: 19,
      resetAt: 1_800_000_900_000,
    });
    const localRequest = new Request(
      "http://localhost:3000/auth/sign-in",
    );
    await expect(enforceDistributedRateLimit({
      policy: "auth.sign_in",
      request: localRequest,
      now: 1_800_000_000_000,
      environment: {
        ...environment,
        NODE_ENV: "development",
      },
    })).resolves.toMatchObject({ allowed: true, remaining: 19 });
    expect(executeConvex).toHaveBeenCalledTimes(1);

    executeConvex.mockClear();
    await expect(enforceDistributedRateLimit({
      policy: "auth.sign_in",
      request: localRequest,
      now: 1_800_000_000_000,
      environment: {
        ...environment,
        NODE_ENV: "production",
      },
    })).resolves.toEqual({ allowed: false, reason: "unavailable" });
    expect(executeConvex).not.toHaveBeenCalled();
  });

  it("returns a private no-store 429 with a bounded Retry-After", async () => {
    const response = distributedRateLimitResponse({
      allowed: false,
      reason: "limited",
      retryAfterMs: 1_001,
      resetAt: 1_800_000_001_001,
    });
    expect(response.status).toBe(429);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("retry-after")).toBe("2");
    expect(response.headers.get("x-robots-tag")).toContain("noindex");
    await expect(response.json()).resolves.toEqual({
      error: "too_many_requests",
    });
  });
});
