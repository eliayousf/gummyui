export interface WebhookVerificationInput {
  rawBody: Uint8Array;
  headers: Headers;
  receivedAt: number;
}

export interface NormalizedProviderEvent<Payload = unknown> {
  providerKind: string;
  eventId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  occurredAt: number;
  payload: Payload;
}

export type WebhookVerificationResult<Payload = unknown> =
  | {
      verified: true;
      event: NormalizedProviderEvent<Payload>;
      payloadHash: string;
    }
  | {
      verified: false;
      reason:
        | "missing_signature"
        | "invalid_signature"
        | "stale_signature"
        | "invalid_payload";
    };

export interface WebhookSignatureAdapter<Payload = unknown> {
  verify(
    input: WebhookVerificationInput,
  ): Promise<WebhookVerificationResult<Payload>>;
}

export interface ProjectionVersion {
  lastOccurredAt: number;
  lastEventId: string;
}

export type ProjectionDecision =
  | { action: "apply" }
  | { action: "ignore_duplicate" }
  | { action: "ignore_out_of_order" }
  | { action: "reject_unverified" };

export function decideProjection(input: {
  signatureVerified: boolean;
  event: Pick<NormalizedProviderEvent, "eventId" | "occurredAt">;
  eventAlreadySeen: boolean;
  current: ProjectionVersion | null;
}): ProjectionDecision {
  if (!input.signatureVerified) {
    return { action: "reject_unverified" };
  }
  if (input.eventAlreadySeen) {
    return { action: "ignore_duplicate" };
  }
  if (
    input.current
    && input.event.occurredAt <= input.current.lastOccurredAt
  ) {
    return { action: "ignore_out_of_order" };
  }
  return { action: "apply" };
}

export class InMemoryProviderEventInbox<State> {
  private readonly seen = new Set<string>();
  private readonly projections = new Map<
    string,
    { state: State; version: ProjectionVersion }
  >();

  apply<Payload>(
    event: NormalizedProviderEvent<Payload>,
    initialState: State,
    reducer: (current: State, event: NormalizedProviderEvent<Payload>) => State,
    signatureVerified = true,
  ): ProjectionDecision {
    const eventKey = `${event.providerKind}:${event.eventId}`;
    const aggregateKey =
      `${event.providerKind}:${event.aggregateType}:${event.aggregateId}`;
    const current = this.projections.get(aggregateKey);
    const decision = decideProjection({
      signatureVerified,
      event,
      eventAlreadySeen: this.seen.has(eventKey),
      current: current?.version ?? null,
    });

    if (decision.action === "reject_unverified") {
      return decision;
    }
    this.seen.add(eventKey);
    if (decision.action !== "apply") {
      return decision;
    }
    this.projections.set(aggregateKey, {
      state: reducer(current?.state ?? initialState, structuredClone(event)),
      version: {
        lastOccurredAt: event.occurredAt,
        lastEventId: event.eventId,
      },
    });
    return decision;
  }

  get(
    providerKind: string,
    aggregateType: string,
    aggregateId: string,
  ): State | null {
    return structuredClone(
      this.projections.get(
        `${providerKind}:${aggregateType}:${aggregateId}`,
      )?.state ?? null,
    );
  }
}

export class LocalHmacWebhookAdapter
  implements WebhookSignatureAdapter<Record<string, unknown>>
{
  constructor(
    private readonly secret: string | Uint8Array,
    private readonly providerKind = "local",
    private readonly toleranceMs = 5 * 60 * 1000,
  ) {}

  async verify(
    input: WebhookVerificationInput,
  ): Promise<WebhookVerificationResult<Record<string, unknown>>> {
    const timestampValue = input.headers.get("x-local-timestamp");
    const signatureValue = input.headers.get("x-local-signature");
    if (!timestampValue || !signatureValue) {
      return { verified: false, reason: "missing_signature" };
    }
    const timestamp = Number(timestampValue);
    if (
      !Number.isSafeInteger(timestamp)
      || Math.abs(input.receivedAt - timestamp) > this.toleranceMs
    ) {
      return { verified: false, reason: "stale_signature" };
    }

    let valid: boolean;
    try {
      valid = await verifyHmac(
        signedWebhookBytes(timestampValue, input.rawBody),
        decodeHex(signatureValue),
        validateSecret(this.secret),
      );
    } catch {
      return { verified: false, reason: "invalid_signature" };
    }
    if (!valid) {
      return { verified: false, reason: "invalid_signature" };
    }
    try {
      const payload = JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(input.rawBody),
      ) as Record<string, unknown>;
      const event = normalizeLocalPayload(payload, this.providerKind);
      if (!event) {
        return { verified: false, reason: "invalid_payload" };
      }
      return {
        verified: true,
        event,
        payloadHash: await sha256Hex(input.rawBody),
      };
    } catch {
      return { verified: false, reason: "invalid_payload" };
    }
  }
}

export async function createLocalWebhookHeaders(input: {
  rawBody: Uint8Array;
  timestamp: number;
  secret: string | Uint8Array;
}): Promise<Headers> {
  if (!Number.isSafeInteger(input.timestamp)) {
    throw new Error("Invalid webhook timestamp");
  }
  const timestamp = String(input.timestamp);
  const signature = await createHmac(
    signedWebhookBytes(timestamp, input.rawBody),
    validateSecret(input.secret),
  );
  return new Headers({
    "x-local-timestamp": timestamp,
    "x-local-signature": encodeHex(signature),
  });
}

function normalizeLocalPayload(
  payload: Record<string, unknown>,
  providerKind: string,
): NormalizedProviderEvent<Record<string, unknown>> | null {
  const { eventId, eventType, aggregateType, aggregateId, occurredAt } = payload;
  if (
    typeof eventId !== "string"
    || typeof eventType !== "string"
    || typeof aggregateType !== "string"
    || typeof aggregateId !== "string"
    || !Number.isSafeInteger(occurredAt)
  ) {
    return null;
  }
  return {
    providerKind,
    eventId,
    eventType,
    aggregateType,
    aggregateId,
    occurredAt: occurredAt as number,
    payload,
  };
}

function signedWebhookBytes(
  timestamp: string,
  rawBody: Uint8Array,
): Uint8Array {
  const prefix = new TextEncoder().encode(`${timestamp}.`);
  const bytes = new Uint8Array(prefix.length + rawBody.length);
  bytes.set(prefix);
  bytes.set(rawBody, prefix.length);
  return bytes;
}

async function createHmac(
  value: Uint8Array,
  secret: Uint8Array,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    ownedArrayBuffer(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(
    await crypto.subtle.sign("HMAC", key, ownedArrayBuffer(value)),
  );
}

async function verifyHmac(
  value: Uint8Array,
  signature: Uint8Array,
  secret: Uint8Array,
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    ownedArrayBuffer(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    "HMAC",
    key,
    ownedArrayBuffer(signature),
    ownedArrayBuffer(value),
  );
}

function validateSecret(secret: string | Uint8Array): Uint8Array {
  const bytes =
    typeof secret === "string" ? new TextEncoder().encode(secret) : secret;
  if (bytes.byteLength < 32) {
    throw new Error("Webhook test secret must contain at least 256 bits");
  }
  return bytes;
}

function encodeHex(value: Uint8Array): string {
  return [...value]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function decodeHex(value: string): Uint8Array {
  if (!/^[a-f0-9]{64}$/iu.test(value)) {
    throw new Error("Invalid signature encoding");
  }
  return Uint8Array.from(
    value.match(/.{2}/gu) ?? [],
    (pair) => Number.parseInt(pair, 16),
  );
}

async function sha256Hex(value: Uint8Array): Promise<string> {
  return encodeHex(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", ownedArrayBuffer(value)),
    ),
  );
}
import { ownedArrayBuffer } from "./crypto";
