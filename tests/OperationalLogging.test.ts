import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  emitOperationalEvent,
  readBetterStackLogConfig,
} from "../lib/commerce/operational-logging";

describe("operational logging", () => {
  it("requires a complete allow-listed Better Stack configuration", () => {
    expect(readBetterStackLogConfig({})).toBeNull();
    expect(() =>
      readBetterStackLogConfig({
        BETTER_STACK_SOURCE_TOKEN: "x".repeat(24),
      })).toThrow("Invalid Better Stack log configuration");
    expect(() =>
      readBetterStackLogConfig({
        BETTER_STACK_SOURCE_TOKEN: "x".repeat(24),
        BETTER_STACK_INGESTING_HOST: "attacker.example",
      })).toThrow("Invalid Better Stack log configuration");
    expect(readBetterStackLogConfig({
      BETTER_STACK_SOURCE_TOKEN: "x".repeat(24),
      BETTER_STACK_INGESTING_HOST: "in.logs.betterstack.com",
    })).toEqual({
      sourceToken: "x".repeat(24),
      ingestUrl: "https://in.logs.betterstack.com/",
    });
  });

  it("redacts PII and credentials before local and remote output", async () => {
    const writer = vi.fn();
    const fetcher = vi.fn(async () => new Response(null, { status: 202 }));
    await emitOperationalEvent(
      {
        name: "resend.delivery.updated",
        severity: "info",
        outcome: "success",
        occurredAt: 1_800_000_000_000,
        attributes: {
          email: "customer@example.com",
          detail:
            "Bearer private-value customer@example.com ?token=download",
          providerMessageId: "email_safe_123",
        },
      },
      {
        environment: {
          NODE_ENV: "production",
          BETTER_STACK_SOURCE_TOKEN: "source_token_value_12345",
          BETTER_STACK_INGESTING_HOST: "in.logs.betterstack.com",
        },
        writer,
        fetcher: fetcher as typeof fetch,
      },
    );

    expect(writer).toHaveBeenCalledTimes(1);
    const line = writer.mock.calls[0][0] as string;
    expect(line).toContain("email_safe_123");
    expect(line).toContain("[REDACTED]");
    expect(line).not.toContain("customer@example.com");
    expect(line).not.toContain("private-value");
    expect(line).not.toContain("source_token_value_12345");
    expect(fetcher).toHaveBeenCalledWith(
      "https://in.logs.betterstack.com/",
      expect.objectContaining({ body: line }),
    );
  });

  it("keeps customer operations independent of ingestion failure", async () => {
    await expect(emitOperationalEvent(
      {
        name: "health.readiness.degraded",
        severity: "error",
        outcome: "degraded",
      },
      {
        environment: {
          BETTER_STACK_SOURCE_TOKEN: "source_token_value_12345",
          BETTER_STACK_INGESTING_HOST: "in.logs.betterstack.com",
        },
        writer: vi.fn(),
        fetcher: vi.fn(async () => {
          throw new Error("network unavailable");
        }) as typeof fetch,
      },
    )).resolves.toBeUndefined();
  });
});
