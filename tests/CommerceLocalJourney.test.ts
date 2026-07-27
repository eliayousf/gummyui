import { describe, expect, it } from "vitest";
import {
  authorizeDownload,
  consumeProtectedDownload,
  createDownloadGrant,
  createLocalWebhookHeaders,
  createProductEmailIntent,
  InMemoryProtectedDownloadRepository,
  InMemoryProviderEventInbox,
  LocalBillingProvider,
  LocalHmacWebhookAdapter,
  LocalIdentityProvider,
  opaqueId,
  ProviderUnavailableError,
  SequentialIdSource,
  transitionDataDeletion,
  transitionDataExport,
  type DownloadAuthorizationInput,
  type NormalizedProviderEvent,
} from "../lib/commerce";

const now = 1_800_000_000_000;
const webhookSecret = "local-journey-webhook-secret-with-thirty-two-bytes";
const downloadSecret = "local-journey-download-secret-with-thirty-two-bytes";
const accountId = opaqueId("acct:journey:001", "account");
const workspaceId = opaqueId("workspace:journey:001", "workspace");
const licenceId = opaqueId("licence:journey:001", "licence");
const entitlementId = opaqueId("entitlement:journey:001", "entitlement");
const releaseId = opaqueId("release:journey:001", "release");
const caller = {
  accountId,
  workspaceId,
  session: {
    accountId,
    active: true,
    expiresAt: now + 120_000,
  },
};

function authorizationFacts(): DownloadAuthorizationInput {
  return {
    now,
    accountId,
    workspaceId,
    releaseId,
    entitlementId,
    allowedRoles: ["member"],
    sources: { identity: "available", localProjection: "available" },
    session: caller.session,
    account: { id: accountId, status: "active" },
    workspace: { id: workspaceId, status: "active" },
    membership: {
      accountId,
      workspaceId,
      role: "member",
      status: "active",
    },
    providerMembership: {
      accountId,
      workspaceId,
      role: "member",
      active: true,
    },
    licence: {
      id: licenceId,
      workspaceId,
      productRef: "product:configured",
      status: "active",
      startsAt: now - 1_000,
      expiresAt: null,
      updatesUntil: now + 120_000,
    },
    seat: { accountId, licenceId, status: "active" },
    entitlement: {
      id: entitlementId,
      accountId,
      workspaceId,
      licenceId,
      productRef: "product:configured",
      status: "active",
      validFrom: now - 1_000,
      validUntil: null,
      updatesUntil: now + 120_000,
    },
    release: {
      id: releaseId,
      productRef: "product:configured",
      status: "published",
      releasedAt: now - 500,
    },
  };
}

async function verifiedEvent(input: {
  eventId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  occurredAt: number;
  state: string;
}) {
  const rawBody = new TextEncoder().encode(JSON.stringify(input));
  const headers = await createLocalWebhookHeaders({
    rawBody,
    timestamp: now,
    secret: webhookSecret,
  });
  const result = await new LocalHmacWebhookAdapter(
    webhookSecret,
    "billing",
  ).verify({ rawBody, headers, receivedAt: now });
  if (!result.verified) throw new Error(result.reason);
  return result.event;
}

describe("complete provider-neutral local customer journey", () => {
  it("covers identity, checkout projection, access, adjustment, revocation and data operations", async () => {
    const identity = new LocalIdentityProvider();
    identity.seedSession("session-token:local", {
      id: "session:journey:001",
      accountId,
      expiresAt: now + 120_000,
      active: true,
    });
    identity.seedMembership({
      id: "membership:journey:001",
      accountId,
      workspaceId,
      role: "member",
      active: true,
      currentSince: now - 1_000,
    });
    await expect(identity.resolveSession("session-token:local")).resolves
      .toMatchObject({ accountId, active: true });
    await expect(identity.getMembership(accountId, workspaceId)).resolves
      .toMatchObject({ role: "member", active: true });

    const billing = new LocalBillingProvider(
      new SequentialIdSource("journey"),
    );
    await expect(
      billing.createCheckout({
        idempotencyKey: "checkout:journey:001",
        accountId,
        workspaceId,
        commercialOfferRef: "offer:founder-configured",
        returnPath: "/account/purchases",
      }),
    ).resolves.toEqual({ checkoutRef: "journey:checkout:000001" });

    const inbox = new InMemoryProviderEventInbox<{ state: string }>();
    const project = (
      _current: { state: string },
      event: NormalizedProviderEvent<Record<string, unknown>>,
    ) => ({ state: String(event.payload.state) });
    const purchaseCompleted = await verifiedEvent({
      eventId: "event:purchase:completed",
      eventType: "purchase.completed",
      aggregateType: "purchase",
      aggregateId: "purchase:journey:001",
      occurredAt: now - 300,
      state: "completed",
    });
    expect(
      inbox.apply(purchaseCompleted, { state: "pending" }, project),
    ).toEqual({ action: "apply" });
    expect(inbox.get("billing", "purchase", "purchase:journey:001")).toEqual({
      state: "completed",
    });

    const repository = new InMemoryProtectedDownloadRepository();
    repository.setCurrentAuthorization(authorizationFacts());
    const grant = await createDownloadGrant({
      grantId: opaqueId("grant:journey:001", "download-grant"),
      accountId,
      workspaceId,
      releaseId,
      entitlementId,
      now,
      ttlMs: 60_000,
      secret: downloadSecret,
      store: repository,
      nonceSource: () => new Uint8Array(24).fill(17),
    });
    await expect(
      consumeProtectedDownload({
        token: grant.token,
        now: now + 1,
        secret: downloadSecret,
        allowedRoles: ["member"],
        caller,
        repository,
      }),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      consumeProtectedDownload({
        token: grant.token,
        now: now + 2,
        secret: downloadSecret,
        allowedRoles: ["member"],
        caller,
        repository,
      }),
    ).resolves.toMatchObject({
      ok: false,
      code: "not_found_or_forbidden",
    });

    const cancellation = await verifiedEvent({
      eventId: "event:subscription:canceled",
      eventType: "subscription.canceled",
      aggregateType: "subscription",
      aggregateId: "subscription:journey:001",
      occurredAt: now + 10,
      state: "canceled",
    });
    expect(inbox.apply(cancellation, { state: "active" }, project)).toEqual({
      action: "apply",
    });
    const adjustment = await verifiedEvent({
      eventId: "event:adjustment:processed",
      eventType: "adjustment.processed",
      aggregateType: "billing_adjustment",
      aggregateId: "adjustment:journey:001",
      occurredAt: now + 20,
      state: "processed",
    });
    expect(inbox.apply(adjustment, { state: "pending" }, project)).toEqual({
      action: "apply",
    });
    expect(
      createProductEmailIntent({
        kind: "refund_workflow",
        recipientRef: "recipient:journey:001",
        accountPath: "/account/purchases",
        adjustmentRef: "adjustment:journey:001",
        state: "completed",
      }).text,
    ).toContain("does not promise settlement timing");

    const revoked = authorizationFacts();
    revoked.entitlement!.status = "revoked";
    repository.setCurrentAuthorization(revoked);
    const revokedGrant = await createDownloadGrant({
      grantId: opaqueId("grant:journey:002", "download-grant"),
      accountId,
      workspaceId,
      releaseId,
      entitlementId,
      now: now + 30,
      ttlMs: 60_000,
      secret: downloadSecret,
      store: repository,
      nonceSource: () => new Uint8Array(24).fill(18),
    });
    await expect(
      consumeProtectedDownload({
        token: revokedGrant.token,
        now: now + 31,
        secret: downloadSecret,
        allowedRoles: ["member"],
        caller,
        repository,
      }),
    ).resolves.toEqual({
      ok: false,
      status: 404,
      code: "not_found_or_forbidden",
    });

    let exportState = transitionDataExport(
      { status: "requested", updatedAt: now + 40 },
      { type: "queue", at: now + 41 },
    );
    exportState = transitionDataExport(exportState, {
      type: "start",
      at: now + 42,
    });
    exportState = transitionDataExport(exportState, {
      type: "complete",
      at: now + 43,
      storageKey: "exports/export:journey:001",
      checksumSha256: "a".repeat(64),
      expiresAt: now + 120_000,
    });
    expect(exportState.status).toBe("ready");

    let deletion = transitionDataDeletion(
      { status: "requested", updatedAt: now + 50 },
      { type: "verify", at: now + 51 },
    );
    deletion = transitionDataDeletion(deletion, {
      type: "queue",
      at: now + 52,
    });
    deletion = transitionDataDeletion(deletion, {
      type: "start",
      at: now + 53,
    });
    deletion = transitionDataDeletion(deletion, {
      type: "complete",
      at: now + 54,
    });
    expect(deletion.status).toBe("completed");

    identity.setFailure("simulated_identity_outage");
    await expect(identity.resolveSession("session-token:local")).rejects
      .toBeInstanceOf(ProviderUnavailableError);
    const unavailable = authorizationFacts();
    unavailable.sources.identity = "unavailable";
    expect(authorizeDownload(unavailable)).toEqual({
      allowed: false,
      reason: "authorization_source_unavailable",
    });
  });
});
