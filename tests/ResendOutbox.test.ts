import { beforeEach, describe, expect, it, vi } from "vitest";

const executeConvex = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("../db", () => ({ executeConvex }));

import {
  readResendOutboxConfig,
  ResendOutboxWorker,
  type ResendOutboxConfig,
} from "../lib/commerce/resend-outbox";
import { GET as emailCronGet } from "../app/api/cron/email-outbox/route";

const config: ResendOutboxConfig = {
  resendApiKey: "re_test_not_real",
  workosApiKey: "sk_test_notreal",
  from: "Gummy UI <support@kreydlabs.com>",
  replyTo: "support@kreydlabs.com",
  applicationOrigin: "https://gummyui.dev",
};

async function claimedMessage() {
  const payload = JSON.stringify({
    accountId: "account:workos:user_test",
    templateRef: "purchase-access-v1",
  });
  return {
    id: "outbox:stripe:test:access",
    deduplicationKey: "stripe:test:commerce.purchase.access",
    topic: "commerce.purchase.access",
    aggregateType: "purchase",
    aggregateId: "purchase:stripe:cs_test",
    payload,
    payloadHash: await sha256Hex(payload),
    attempts: 1,
    userId: "user_test_recipient",
  };
}

describe("Resend transactional outbox", () => {
  beforeEach(() => executeConvex.mockReset());

  it("requires the complete server-only email configuration", () => {
    expect(readResendOutboxConfig({})).toBeNull();
    expect(() =>
      readResendOutboxConfig({
        RESEND_API_KEY: "browser-value",
        WORKOS_API_KEY: "sk_test_notreal",
        RESEND_FROM_EMAIL: "Gummy UI <support@kreydlabs.com>",
        RESEND_REPLY_TO_EMAIL: "support@kreydlabs.com",
        GUMMYUI_ORIGIN: "https://gummyui.dev",
      })).toThrow("Invalid transactional email configuration");
    expect(
      readResendOutboxConfig({
        RESEND_API_KEY: config.resendApiKey,
        WORKOS_API_KEY: config.workosApiKey,
        RESEND_FROM_EMAIL: config.from,
        RESEND_REPLY_TO_EMAIL: config.replyTo,
        GUMMYUI_ORIGIN: config.applicationOrigin,
      }),
    ).toEqual(config);
  });

  it("claims once, resolves the WorkOS email and sends idempotently", async () => {
    executeConvex
      .mockResolvedValueOnce([await claimedMessage()])
      .mockResolvedValueOnce(null);
    const fetcher = vi.fn(async (...args: Parameters<typeof fetch>) => {
      void args;
      return Response.json(
        { id: "email_test_delivered" },
        { status: 200 },
      );
    });
    const workos = {
      userManagement: {
        getUser: vi.fn(async () => ({
          email: "Customer@Example.com",
        })),
      },
    };
    const worker = new ResendOutboxWorker(
      config,
      fetcher as typeof fetch,
      workos as never,
    );

    await expect(worker.drain(1_800_000_000_000)).resolves.toEqual({
      claimed: 1,
      accepted: 1,
      deferred: 0,
      deadLettered: 0,
    });
    expect(workos.userManagement.getUser)
      .toHaveBeenCalledWith("user_test_recipient");
    const [, request] = fetcher.mock.calls[0];
    expect(request?.headers).toMatchObject({
      authorization: `Bearer ${config.resendApiKey}`,
      "idempotency-key": "stripe:test:commerce.purchase.access",
    });
    const body = JSON.parse(String(request?.body));
    expect(body).toMatchObject({
      from: config.from,
      to: ["customer@example.com"],
      reply_to: config.replyTo,
      subject: "Your Gummy UI Pro access is ready",
    });
    expect(body.text).toContain(
      "https://gummyui.dev/account/downloads",
    );
    expect(executeConvex).toHaveBeenLastCalledWith(
      "email.outbox.accepted",
      expect.objectContaining({
        id: "outbox:stripe:test:access",
        attempts: 1,
        providerMessageId: "email_test_delivered",
      }),
    );
  });

  it("dead-letters a permanent rejection without retaining its body", async () => {
    executeConvex
      .mockResolvedValueOnce([await claimedMessage()])
      .mockResolvedValueOnce(null);
    const worker = new ResendOutboxWorker(
      config,
      vi.fn(async () =>
        new Response("provider diagnostic containing private data", {
          status: 422,
        })) as typeof fetch,
      {
        userManagement: {
          getUser: vi.fn(async () => ({
            email: "customer@example.com",
          })),
        },
      } as never,
    );

    await expect(worker.drain()).resolves.toMatchObject({
      claimed: 1,
      deadLettered: 1,
    });
    expect(executeConvex).toHaveBeenLastCalledWith(
      "email.outbox.failed",
      expect.objectContaining({
        code: "email_http_422",
        deadLetter: true,
      }),
    );
    expect(JSON.stringify(executeConvex.mock.calls))
      .not.toContain("provider diagnostic");
  });

  it("keeps the cron endpoint undiscoverable without its bearer secret", async () => {
    const previous = process.env.CRON_SECRET;
    process.env.CRON_SECRET = "a".repeat(32);
    try {
      const response = await emailCronGet(
        new Request("https://gummyui.dev/api/cron/email-outbox"),
      );
      expect(response.status).toBe(404);
      expect(response.headers.get("cache-control"))
        .toBe("private, no-store");
    } finally {
      if (previous === undefined) {
        delete process.env.CRON_SECRET;
      } else {
        process.env.CRON_SECRET = previous;
      }
    }
  });
});

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")).join("");
}
