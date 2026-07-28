import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  BETTER_STACK_HEARTBEAT_ENV,
  pingBetterStackHeartbeat,
  readBetterStackHeartbeatConfig,
  type BetterStackHeartbeatJob,
} from "../lib/commerce/better-stack-heartbeats";

const token = "heartbeat_token_not_real_1234";
const heartbeatUrl =
  `https://uptime.betterstack.com/api/v1/heartbeat/${token}`;

describe("Better Stack cron heartbeats", () => {
  it.each(Object.entries(BETTER_STACK_HEARTBEAT_ENV))(
    "reads the optional %s URL only from %s",
    (job, variable) => {
      expect(
        readBetterStackHeartbeatConfig(job as BetterStackHeartbeatJob, {}),
      ).toBeNull();
      expect(readBetterStackHeartbeatConfig(
        job as BetterStackHeartbeatJob,
        { [variable]: heartbeatUrl },
      )).toEqual({ url: heartbeatUrl });
    },
  );

  it.each([
    `http://uptime.betterstack.com/api/v1/heartbeat/${token}`,
    `https://uptime.betterstack.com.attacker.example/api/v1/heartbeat/${token}`,
    `https://uptime.betterstack.com/api/v1/heartbeat/${token}/fail`,
    `https://uptime.betterstack.com/api/v1/heartbeat/${token}?leak=true`,
    "https://uptime.betterstack.com/api/v1/heartbeat/short",
    `https://user:password@uptime.betterstack.com/api/v1/heartbeat/${token}`,
  ])("rejects a heartbeat URL outside the exact provider endpoint", (url) => {
    expect(() => readBetterStackHeartbeatConfig("backup", {
      BETTER_STACK_HEARTBEAT_BACKUP_URL: url,
    })).toThrow("Invalid Better Stack heartbeat configuration");
  });

  it("sends a token-safe GET only when configured", async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 200 }));
    await expect(pingBetterStackHeartbeat("email-outbox", {
      environment: {
        BETTER_STACK_HEARTBEAT_EMAIL_OUTBOX_URL: heartbeatUrl,
      },
      fetcher: fetcher as typeof fetch,
    })).resolves.toBe("sent");
    expect(fetcher).toHaveBeenCalledWith(
      heartbeatUrl,
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        redirect: "error",
      }),
    );

    fetcher.mockClear();
    await expect(pingBetterStackHeartbeat("email-outbox", {
      environment: {},
      fetcher: fetcher as typeof fetch,
    })).resolves.toBe("disabled");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("contains provider and configuration failures without logging the URL", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error")
      .mockImplementation(() => undefined);
    const fetcher = vi.fn(async () => {
      throw new Error(`request failed for ${heartbeatUrl}`);
    });
    try {
      await expect(pingBetterStackHeartbeat("backup", {
        environment: {
          BETTER_STACK_HEARTBEAT_BACKUP_URL: heartbeatUrl,
        },
        fetcher: fetcher as typeof fetch,
      })).resolves.toBe("request_failed");
      await expect(pingBetterStackHeartbeat("backup", {
        environment: {
          BETTER_STACK_HEARTBEAT_BACKUP_URL:
            `https://attacker.example/api/v1/heartbeat/${token}`,
        },
        fetcher: fetcher as typeof fetch,
      })).resolves.toBe("invalid_configuration");
      expect(log).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
      error.mockRestore();
    }
  });
});
