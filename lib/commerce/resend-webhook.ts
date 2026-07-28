import "server-only";
import { executeConvex } from "../../db";
import { ownedArrayBuffer } from "./crypto";

const SIGNATURE_TOLERANCE_MS = 5 * 60 * 1_000;
const PROVIDER_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{5,127}$/u;

export interface ResendWebhookConfig {
  secret: string;
}

export type ResendDeliveryState = "delivered" | "bounced" | "complained";

export interface ResendDeliveryProjection {
  providerEventId: string;
  providerMessageId: string;
  providerEventType:
    | "email.delivered"
    | "email.bounced"
    | "email.complained";
  state: ResendDeliveryState;
  providerOccurredAt: number;
  receivedAt: number;
  payloadHash: string;
}

export function readResendWebhookConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): ResendWebhookConfig | null {
  const secret = environment.RESEND_WEBHOOK_SECRET?.trim();
  if (!secret) return null;
  if (
    !secret.startsWith("whsec_")
    || secret.length < 30
    || secret.length > 256
    || /[\u0000-\u0020]/u.test(secret)
  ) {
    throw new Error("Invalid Resend webhook configuration");
  }
  decodeSecret(secret);
  return { secret };
}

export class ResendWebhookAdapter {
  constructor(private readonly config: ResendWebhookConfig) {}

  async verify(input: {
    rawBody: Uint8Array;
    headers: Headers;
    receivedAt?: number;
  }): Promise<ResendDeliveryProjection | null> {
    const receivedAt = input.receivedAt ?? Date.now();
    const eventId = input.headers.get("svix-id")?.trim() ?? "";
    const timestampValue =
      input.headers.get("svix-timestamp")?.trim() ?? "";
    const signatureValue =
      input.headers.get("svix-signature")?.trim() ?? "";
    const timestampSeconds = Number(timestampValue);
    const timestampMs = timestampSeconds * 1_000;
    if (
      !PROVIDER_ID.test(eventId)
      || !Number.isSafeInteger(timestampSeconds)
      || timestampSeconds <= 0
      || Math.abs(receivedAt - timestampMs) > SIGNATURE_TOLERANCE_MS
      || !signatureValue
    ) {
      throw new Error("Invalid Resend webhook signature metadata");
    }

    const body = new TextDecoder("utf-8", { fatal: true })
      .decode(input.rawBody);
    const signedContent = `${eventId}.${timestampValue}.${body}`;
    const valid = await verifyAnySignature(
      signedContent,
      signatureValue,
      decodeSecret(this.config.secret),
    );
    if (!valid) throw new Error("Invalid Resend webhook signature");

    return normalizeResendEvent(
      body,
      eventId,
      receivedAt,
      await sha256Hex(input.rawBody),
    );
  }
}

export class ConvexResendDeliveryStore {
  async apply(
    projection: ResendDeliveryProjection,
  ): Promise<"applied" | "duplicate" | "ignored"> {
    return executeConvex("email.outbox.provider-event", projection);
  }
}

function normalizeResendEvent(
  rawBody: string,
  providerEventId: string,
  receivedAt: number,
  payloadHash: string,
): ResendDeliveryProjection | null {
  let value: unknown;
  try {
    value = JSON.parse(rawBody);
  } catch {
    throw new Error("Invalid Resend webhook JSON");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid Resend webhook payload");
  }
  const event = value as Record<string, unknown>;
  const eventType = event.type;
  if (
    eventType !== "email.delivered"
    && eventType !== "email.bounced"
    && eventType !== "email.complained"
  ) {
    return null;
  }
  const data =
    event.data && typeof event.data === "object" && !Array.isArray(event.data)
      ? event.data as Record<string, unknown>
      : null;
  const providerMessageId = data?.email_id;
  const occurredAt = parseOccurredAt(event.created_at);
  if (
    typeof providerMessageId !== "string"
    || !PROVIDER_ID.test(providerMessageId)
    || occurredAt === null
  ) {
    throw new Error("Invalid Resend delivery projection");
  }
  const state: ResendDeliveryState =
    eventType === "email.delivered"
      ? "delivered"
      : eventType === "email.bounced"
        ? "bounced"
        : "complained";
  return {
    providerEventId,
    providerMessageId,
    providerEventType: eventType,
    state,
    providerOccurredAt: occurredAt,
    receivedAt,
    payloadHash,
  };
}

function parseOccurredAt(value: unknown): number | null {
  if (typeof value !== "string" || value.length > 64) return null;
  const parsed = Date.parse(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

async function verifyAnySignature(
  content: string,
  header: string,
  secret: Uint8Array,
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    ownedArrayBuffer(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const data = new TextEncoder().encode(content);
  const signatures = header
    .split(/\s+/u)
    .map((entry) => entry.match(/^v1,([A-Za-z0-9+/=_-]+)$/u)?.[1])
    .filter((entry): entry is string => Boolean(entry));
  for (const signature of signatures) {
    try {
      if (
        await crypto.subtle.verify(
          "HMAC",
          key,
          ownedArrayBuffer(decodeBase64(signature)),
          ownedArrayBuffer(data),
        )
      ) {
        return true;
      }
    } catch {
      // Continue checking any rotated signature in the header.
    }
  }
  return false;
}

function decodeSecret(secret: string): Uint8Array {
  const decoded = decodeBase64(secret.slice("whsec_".length));
  if (decoded.byteLength < 16) {
    throw new Error("Invalid Resend webhook configuration");
  }
  return decoded;
}

function decodeBase64(value: string): Uint8Array {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  if (!/^[A-Za-z0-9+/]*={0,2}$/u.test(normalized)) {
    throw new Error("Invalid base64 value");
  }
  const padded = normalized.padEnd(
    normalized.length + ((4 - normalized.length % 4) % 4),
    "=",
  );
  const decoded = atob(padded);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

async function sha256Hex(value: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    ownedArrayBuffer(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")).join("");
}
