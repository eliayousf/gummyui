import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Event } from "@workos-inc/node";

const executeConvex = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("../db", () => ({ executeConvex }));

import {
  ConvexWorkOSWebhookStore,
  normalizeWorkOSEvent,
  readWorkOSWebhookConfig,
  WorkOSWebhookAdapter,
} from "../lib/commerce/workos-webhook";
import { POST as workOSWebhookPost } from "../app/api/webhooks/workos/route";

const hash = "a".repeat(64);
const createdAt = "2027-01-15T12:00:00.000Z";
const receivedAt = Date.parse("2027-01-15T12:00:01.000Z");

describe("WorkOS webhook boundary", () => {
  beforeEach(() => {
    executeConvex.mockReset();
  });

  it("requires a complete server-only webhook configuration", () => {
    expect(readWorkOSWebhookConfig({})).toBeNull();
    expect(() =>
      readWorkOSWebhookConfig({
        WORKOS_API_KEY: "sk_test_aaaaaaaa",
      }),
    ).toThrow("Invalid WorkOS webhook configuration");
    expect(
      readWorkOSWebhookConfig({
        WORKOS_API_KEY: "sk_test_aaaaaaaa",
        WORKOS_WEBHOOK_SECRET: "s".repeat(24),
      }),
    ).toEqual({
      apiKey: "sk_test_aaaaaaaa",
      secret: "s".repeat(24),
    });
  });

  it("normalizes user updates without retaining the email address", async () => {
    const projection = await normalizeWorkOSEvent({
      id: "event_123456789",
      event: "user.updated",
      createdAt,
      context: {},
      data: {
        id: "user_123456789",
        email: " Customer@Example.com ",
        name: "Customer",
        locale: "en-GB",
      },
    } as unknown as Event, hash, receivedAt);

    expect(projection).toMatchObject({
      kind: "user",
      action: "upsert",
      userId: "user_123456789",
      displayName: "Customer",
      locale: "en-GB",
      payloadHash: hash,
    });
    expect(projection?.kind === "user" && projection.emailHash)
      .toMatch(/^[a-f0-9]{64}$/u);
    expect(JSON.stringify(projection)).not.toContain(
      "Customer@Example.com",
    );
  });

  it("maps inactive and deleted memberships to immediate revocation states", async () => {
    const inactive = await normalizeWorkOSEvent(
      membershipEvent("organization_membership.updated", "inactive"),
      hash,
      receivedAt,
    );
    const deleted = await normalizeWorkOSEvent(
      membershipEvent("organization_membership.deleted", "active"),
      hash,
      receivedAt,
    );

    expect(inactive).toMatchObject({
      kind: "membership",
      action: "upsert",
      membershipStatus: "suspended",
      role: "admin",
    });
    expect(deleted).toMatchObject({
      kind: "membership",
      action: "delete",
      membershipStatus: "revoked",
    });
  });

  it("projects invitation lifecycle without retaining recipient email", async () => {
    const projection = await normalizeWorkOSEvent({
      id: "event_invitation_123456789",
      event: "invitation.created",
      createdAt,
      context: {},
      data: {
        object: "invitation",
        id: "invitation_123456789",
        email: "teammate@example.com",
        state: "pending",
        acceptedAt: null,
        revokedAt: null,
        expiresAt: "2027-01-22T12:00:00.000Z",
        organizationId: "org_123456789",
        inviterUserId: "user_123456789",
        acceptedUserId: null,
        roleSlug: "member",
        createdAt,
        updatedAt: createdAt,
      },
    } as unknown as Event, hash, receivedAt);

    expect(projection).toMatchObject({
      kind: "invitation",
      action: "upsert",
      providerInvitationId: "invitation_123456789",
      workspaceId: "workspace:workos:org_123456789",
      role: "member",
      invitationStatus: "pending",
      invitedByAccountId: "account:workos:user_123456789",
      acceptedByAccountId: null,
    });
    expect(
      projection?.kind === "invitation"
        ? projection.invitedEmailHash
        : "",
    ).toMatch(/^[a-f0-9]{64}$/u);
    expect(JSON.stringify(projection)).not.toContain(
      "teammate@example.com",
    );
  });

  it("ignores events outside the narrow identity projection", async () => {
    await expect(
      normalizeWorkOSEvent({
        id: "event_123456789",
        event: "session.created",
        createdAt,
        context: {},
        data: {},
      } as unknown as Event, hash, receivedAt),
    ).resolves.toBeNull();
  });

  it("sends membership revocation to the atomic Convex mutation", async () => {
    const projection = await normalizeWorkOSEvent(
      membershipEvent("organization_membership.deleted", "active"),
      hash,
      receivedAt,
    );
    if (!projection) {
      throw new Error("Expected membership projection");
    }

    executeConvex.mockResolvedValue("applied");
    await expect(
      new ConvexWorkOSWebhookStore().apply(projection),
    ).resolves.toBe("applied");
    expect(executeConvex).toHaveBeenCalledWith(
      "workos.webhook.apply",
      projection,
    );
  });

  it("reports an accepted event already marked applied as a duplicate", async () => {
    executeConvex.mockResolvedValue("duplicate");
    const projection = await normalizeWorkOSEvent(
      membershipEvent("organization_membership.updated", "active"),
      hash,
      receivedAt,
    );
    if (!projection) {
      throw new Error("Expected membership projection");
    }
    await expect(
      new ConvexWorkOSWebhookStore().apply(projection),
    ).resolves.toBe("duplicate");
  });

  it("fails closed without a signature and while the route is disabled", async () => {
    const adapter = new WorkOSWebhookAdapter({
      apiKey: "sk_test_aaaaaaaa",
      secret: "s".repeat(24),
    });
    await expect(
      adapter.verify({
        rawBody: "{}",
        signature: null,
      }),
    ).rejects.toThrow("Missing WorkOS webhook signature");

    const previous = process.env.WORKOS_WEBHOOK_ENABLED;
    delete process.env.WORKOS_WEBHOOK_ENABLED;
    try {
      const response = await workOSWebhookPost(
        new Request("https://gummyui.dev/api/webhooks/workos", {
          method: "POST",
          body: "{}",
        }),
      );
      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toEqual({
        error: "service_unavailable",
      });
    } finally {
      if (previous === undefined) {
        delete process.env.WORKOS_WEBHOOK_ENABLED;
      } else {
        process.env.WORKOS_WEBHOOK_ENABLED = previous;
      }
    }
  });
});

function membershipEvent(
  event:
    | "organization_membership.created"
    | "organization_membership.updated"
    | "organization_membership.deleted",
  status: "active" | "inactive" | "pending",
): Event {
  return {
    id: "event_123456789",
    event,
    createdAt,
    context: {},
    data: {
      id: "om_123456789",
      object: "organization_membership",
      userId: "user_123456789",
      organizationId: "org_123456789",
      organizationName: "Design team",
      status,
      role: { slug: "admin" },
      roles: [{ slug: "admin" }],
      directoryManaged: false,
      createdAt,
      updatedAt: createdAt,
      customAttributes: {},
    },
  } as unknown as Event;
}
