import { describe, expect, it } from "vitest";
import {
  createLocalWebhookHeaders,
  InMemoryProviderEventInbox,
  LocalHmacWebhookAdapter,
  type NormalizedProviderEvent,
} from "../lib/commerce";

const secret = "provider-neutral-local-webhook-test-secret";
const now = 1_800_000_000_000;

function rawEvent(
  eventId: string,
  occurredAt: number,
  state: string,
): Uint8Array {
  return new TextEncoder().encode(JSON.stringify({
    eventId,
    eventType: "aggregate.changed",
    aggregateType: "subscription",
    aggregateId: "aggregate:opaque:001",
    occurredAt,
    state,
  }));
}

describe("raw webhook verification and projection ordering", () => {
  it("verifies the exact raw bytes and rejects a changed body", async () => {
    const rawBody = rawEvent("event:001", now - 1_000, "active");
    const headers = await createLocalWebhookHeaders({
      rawBody,
      timestamp: now,
      secret,
    });
    const adapter = new LocalHmacWebhookAdapter(secret, "billing");
    const verified = await adapter.verify({ rawBody, headers, receivedAt: now });
    expect(verified).toMatchObject({
      verified: true,
      event: { eventId: "event:001", providerKind: "billing" },
    });

    const reformatted = new TextEncoder().encode(
      `${new TextDecoder().decode(rawBody)} `,
    );
    await expect(
      adapter.verify({ rawBody: reformatted, headers, receivedAt: now }),
    ).resolves.toEqual({ verified: false, reason: "invalid_signature" });
  });

  it("ignores duplicate and out-of-order events without regressing state", () => {
    const inbox = new InMemoryProviderEventInbox<{ state: string }>();
    const reducer = (
      _current: { state: string },
      event: NormalizedProviderEvent<Record<string, unknown>>,
    ) => ({ state: String(event.payload.state) });
    const newer: NormalizedProviderEvent<Record<string, unknown>> = {
      providerKind: "billing",
      eventId: "event:new",
      eventType: "aggregate.changed",
      aggregateType: "subscription",
      aggregateId: "aggregate:opaque:001",
      occurredAt: now,
      payload: { state: "active" },
    };
    const older = {
      ...newer,
      eventId: "event:old",
      occurredAt: now - 1,
      payload: { state: "past_due" },
    };

    expect(inbox.apply(newer, { state: "unknown" }, reducer)).toEqual({
      action: "apply",
    });
    expect(inbox.apply(newer, { state: "unknown" }, reducer)).toEqual({
      action: "ignore_duplicate",
    });
    expect(inbox.apply(older, { state: "unknown" }, reducer)).toEqual({
      action: "ignore_out_of_order",
    });
    expect(inbox.get("billing", "subscription", "aggregate:opaque:001")).toEqual({
      state: "active",
    });
  });

  it("does not record or project an unverified event", () => {
    const inbox = new InMemoryProviderEventInbox<{ applied: number }>();
    const event: NormalizedProviderEvent = {
      providerKind: "billing",
      eventId: "event:unverified",
      eventType: "aggregate.changed",
      aggregateType: "subscription",
      aggregateId: "aggregate:opaque:001",
      occurredAt: now,
      payload: {},
    };
    expect(
      inbox.apply(event, { applied: 0 }, (state) => ({
        applied: state.applied + 1,
      }), false),
    ).toEqual({ action: "reject_unverified" });
    expect(inbox.get("billing", "subscription", "aggregate:opaque:001")).toBeNull();
  });
});
