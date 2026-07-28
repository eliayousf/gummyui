import { beforeEach, describe, expect, it, vi } from "vitest";

const executeConvex = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("../db", () => ({ executeConvex }));

import {
  ConvexResendDeliveryStore,
  readResendWebhookConfig,
  ResendWebhookAdapter,
} from "../lib/commerce/resend-webhook";
import { ownedArrayBuffer } from "../lib/commerce/crypto";

const secretBytes = new TextEncoder().encode(
  "not-a-real-resend-webhook-secret",
);
const secret = `whsec_${toBase64(secretBytes)}`;

describe("Resend delivery webhook", () => {
  beforeEach(() => executeConvex.mockReset());

  it("requires a valid signing secret", () => {
    expect(readResendWebhookConfig({})).toBeNull();
    expect(() =>
      readResendWebhookConfig({
        RESEND_WEBHOOK_SECRET: "whsec_invalid!",
      })).toThrow("Invalid Resend webhook configuration");
    expect(readResendWebhookConfig({
      RESEND_WEBHOOK_SECRET: secret,
    })).toEqual({ secret });
  });

  it("verifies Svix HMAC and projects only non-PII delivery fields", async () => {
    const receivedAt = 1_800_000_000_000;
    const raw = JSON.stringify({
      type: "email.delivered",
      created_at: "2027-01-15T08:00:00.000Z",
      data: {
        email_id: "email_message_123",
        to: ["customer@example.com"],
        subject: "private subject",
      },
    });
    const headers = await signedHeaders(raw, receivedAt);
    const projection = await new ResendWebhookAdapter({ secret }).verify({
      rawBody: new TextEncoder().encode(raw),
      headers,
      receivedAt,
    });

    expect(projection).toEqual({
      providerEventId: "msg_event_123",
      providerMessageId: "email_message_123",
      providerEventType: "email.delivered",
      state: "delivered",
      providerOccurredAt: Date.parse("2027-01-15T08:00:00.000Z"),
      receivedAt,
      payloadHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
    });
    expect(JSON.stringify(projection)).not.toContain("customer@example.com");
    expect(JSON.stringify(projection)).not.toContain("private subject");
  });

  it("rejects tampering and signatures outside the replay window", async () => {
    const receivedAt = 1_800_000_000_000;
    const raw = JSON.stringify({
      type: "email.bounced",
      created_at: "2027-01-15T08:00:00.000Z",
      data: { email_id: "email_message_123" },
    });
    const adapter = new ResendWebhookAdapter({ secret });
    await expect(adapter.verify({
      rawBody: new TextEncoder().encode(`${raw} `),
      headers: await signedHeaders(raw, receivedAt),
      receivedAt,
    })).rejects.toThrow("Invalid Resend webhook signature");
    await expect(adapter.verify({
      rawBody: new TextEncoder().encode(raw),
      headers: await signedHeaders(raw, receivedAt - 600_000),
      receivedAt,
    })).rejects.toThrow("Invalid Resend webhook signature metadata");
  });

  it("stores only the verified projection through the Convex operation", async () => {
    executeConvex.mockResolvedValue("applied");
    const projection = {
      providerEventId: "msg_event_123",
      providerMessageId: "email_message_123",
      providerEventType: "email.complained" as const,
      state: "complained" as const,
      providerOccurredAt: 1_800_000_000_000,
      receivedAt: 1_800_000_000_100,
      payloadHash: "a".repeat(64),
    };
    await expect(new ConvexResendDeliveryStore().apply(projection))
      .resolves.toBe("applied");
    expect(executeConvex).toHaveBeenCalledWith(
      "email.outbox.provider-event",
      projection,
    );
  });
});

async function signedHeaders(
  body: string,
  timestampMs: number,
): Promise<Headers> {
  const timestamp = String(timestampMs / 1_000);
  const content = `msg_event_123.${timestamp}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw",
    ownedArrayBuffer(secretBytes),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    ownedArrayBuffer(new TextEncoder().encode(content)),
  );
  return new Headers({
    "svix-id": "msg_event_123",
    "svix-timestamp": timestamp,
    "svix-signature": `v1,${toBase64(new Uint8Array(signature))}`,
  });
}

function toBase64(value: Uint8Array): string {
  return btoa(String.fromCharCode(...value));
}
