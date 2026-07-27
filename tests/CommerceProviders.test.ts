import { describe, expect, it } from "vitest";
import {
  LocalBillingProvider,
  LocalEmailProvider,
  LocalIdentityProvider,
  LocalMonitoringProvider,
  LocalObjectStorageProvider,
  LocalQueueProvider,
  opaqueId,
  ProviderUnavailableError,
  SequentialIdSource,
} from "../lib/commerce";

const accountId = opaqueId("acct:local:001", "account");
const workspaceId = opaqueId("workspace:local:001", "workspace");

describe("deterministic local provider fakes", () => {
  it("models identity state and provider failure without live credentials", async () => {
    const identity = new LocalIdentityProvider();
    identity.seedSession("local-session", {
      id: "session:local:001",
      accountId,
      expiresAt: 1_800_000_000_000,
      active: true,
    });
    identity.seedMembership({
      id: "membership:local:001",
      accountId,
      workspaceId,
      role: "member",
      active: true,
      currentSince: 1,
    });
    await expect(identity.resolveSession("local-session")).resolves.toMatchObject({
      accountId,
      active: true,
    });
    await identity.revokeSessions(accountId);
    await expect(identity.resolveSession("local-session")).resolves.toMatchObject({
      active: false,
    });
    identity.setFailure("simulated_outage");
    await expect(identity.resolveSession("local-session")).rejects.toEqual(
      expect.objectContaining<Partial<ProviderUnavailableError>>({
        name: "ProviderUnavailableError",
        code: "simulated_outage",
      }),
    );
  });

  it("captures billing, email, queue, storage and monitoring calls in memory", async () => {
    const ids = new SequentialIdSource("test");
    const billing = new LocalBillingProvider(ids);
    const email = new LocalEmailProvider(ids);
    const queue = new LocalQueueProvider(ids);
    const storage = new LocalObjectStorageProvider();
    const monitoring = new LocalMonitoringProvider();

    await expect(
      billing.createCheckout({
        idempotencyKey: "checkout:request:001",
        accountId,
        workspaceId,
        commercialOfferRef: "offer:configured",
        returnPath: "/account",
      }),
    ).resolves.toEqual({ checkoutRef: "test:checkout:000001" });
    await expect(
      email.send({
        idempotencyKey: "message:request:001",
        templateRef: "template:configured",
        recipientRef: "recipient:opaque:001",
        variables: { workspace: "opaque" },
      }),
    ).resolves.toEqual({ messageRef: "test:message:000002" });
    await expect(
      queue.publish({
        idempotencyKey: "queue:request:001",
        topic: "topic:configured",
        payload: { aggregateId: "aggregate:opaque:001" },
      }),
    ).resolves.toEqual({ messageRef: "test:queue-message:000003" });

    const body = new Uint8Array([1, 2, 3]);
    await storage.put({
      key: "objects/opaque",
      body,
      checksumSha256: "a".repeat(64),
      metadata: { kind: "test" },
    });
    body[0] = 9;
    await expect(storage.get("objects/opaque")).resolves.toMatchObject({
      body: new Uint8Array([1, 2, 3]),
    });

    await monitoring.capture({
      name: "local.test",
      severity: "info",
      occurredAt: 1,
      attributes: { healthy: true },
    });
    await monitoring.heartbeat("local-job", 2);
    expect(monitoring.events).toHaveLength(1);
    expect(monitoring.heartbeats).toEqual([{ name: "local-job", at: 2 }]);
  });
});
