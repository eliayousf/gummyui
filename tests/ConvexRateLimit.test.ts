/// <reference types="vite/client" />

import { anyApi } from "convex/server";
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import schema from "../convex/schema";

const modules = import.meta.glob("../convex/**/*.ts");
const SERVER_SECRET = "rate-limit-test-secret-".padEnd(40, "x");

function rateLimitTest() {
  const test = convexTest(schema, modules);
  const consume = (input: unknown) =>
    test.mutation(anyApi.commerce.execute, {
      serverSecret: SERVER_SECRET,
      operation: "rate-limit.consume",
      input,
    });
  return { test, consume };
}

function bucket(
  key = "b".repeat(64),
  capacity = 2,
  windowMs = 1_000,
) {
  return {
    scopeHash: "a".repeat(64),
    keyHash: key,
    capacity,
    windowMs,
  };
}

describe("Convex distributed rate limits", () => {
  const previousSecret = process.env.CONVEX_SERVER_SECRET;

  beforeEach(() => {
    process.env.CONVEX_SERVER_SECRET = SERVER_SECRET;
  });

  afterEach(() => {
    if (previousSecret === undefined) {
      delete process.env.CONVEX_SERVER_SECRET;
    } else {
      process.env.CONVEX_SERVER_SECRET = previousSecret;
    }
  });

  it("atomically admits only the configured number of concurrent requests", async () => {
    const { test, consume } = rateLimitTest();
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        consume({
          buckets: [bucket("b".repeat(64), 5)],
          now: 1_800_000_000_000,
        })),
    ) as Array<{ allowed: boolean }>;
    expect(results.filter((result) => result.allowed)).toHaveLength(5);
    expect(results.filter((result) => !result.allowed)).toHaveLength(5);

    const rows = await test.run((ctx) =>
      ctx.db.query("rateLimitWindows").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      scopeHash: "a".repeat(64),
      keyHash: "b".repeat(64),
      count: 5,
    });
    expect(JSON.stringify(rows)).not.toContain("account:");
    expect(JSON.stringify(rows)).not.toContain("@");
  });

  it("resets at the exact fixed-window boundary", async () => {
    const { consume } = rateLimitTest();
    const now = 1_800_000_000_000;
    await expect(consume({ buckets: [bucket()], now }))
      .resolves.toMatchObject({ allowed: true, remaining: 1 });
    await expect(consume({ buckets: [bucket()], now: now + 999 }))
      .resolves.toMatchObject({ allowed: true, remaining: 0 });
    await expect(consume({ buckets: [bucket()], now: now + 999 }))
      .resolves.toMatchObject({
        allowed: false,
        retryAfterMs: 1,
        resetAt: now + 1_000,
      });
    await expect(consume({ buckets: [bucket()], now: now + 1_000 }))
      .resolves.toMatchObject({ allowed: true, remaining: 1 });
  });

  it("does not partially consume a principal bucket when an IP bucket denies", async () => {
    const { test, consume } = rateLimitTest();
    const principal = bucket("b".repeat(64), 2);
    const ip = {
      ...bucket("c".repeat(64), 1),
      scopeHash: "d".repeat(64),
    };
    await expect(consume({
      buckets: [principal, ip],
      now: 1_800_000_000_000,
    })).resolves.toMatchObject({ allowed: true });
    await expect(consume({
      buckets: [principal, ip],
      now: 1_800_000_000_001,
    })).resolves.toMatchObject({ allowed: false });

    const rows = await test.run((ctx) =>
      ctx.db.query("rateLimitWindows").collect());
    expect(rows.map(({ count }) => count).sort()).toEqual([1, 1]);
  });

  it("prunes expired hashed windows without retaining request identity", async () => {
    const { test, consume } = rateLimitTest();
    await consume({ buckets: [bucket("b".repeat(64))], now: 1_000 });
    await consume({
      buckets: [bucket("c".repeat(64))],
      now: 86_402_001,
    });
    const rows = await test.run((ctx) =>
      ctx.db.query("rateLimitWindows").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0].keyHash).toBe("c".repeat(64));
    expect(rows[0].expiresAt).toBe(172_803_001);
  });

  it("rejects raw or duplicate bucket identities", async () => {
    const { consume } = rateLimitTest();
    await expect(consume({
      buckets: [{
        ...bucket(),
        keyHash: "account:raw-identity",
      }],
      now: 1_800_000_000_000,
    })).rejects.toThrow("keyHash");
    await expect(consume({
      buckets: [bucket(), bucket()],
      now: 1_800_000_000_000,
    })).rejects.toThrow("Duplicate rate-limit bucket");
  });
});
