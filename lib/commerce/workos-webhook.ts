import "server-only";
import { WorkOS, type Event } from "@workos-inc/node";
import { executeConvex } from "../../db";
import {
  normalizeWorkOSRole,
  workOSAccountId,
  workOSOrganizationWorkspaceId,
} from "./workos-identity";
import { isValidWorkOSApiKey } from "./workos-api-key";
import type {
  AccountId,
  WorkspaceId,
  WorkspaceRole,
} from "./model";

export interface WorkOSWebhookConfig {
  apiKey: string;
  secret: string;
}

export type WorkOSWebhookProjection =
  | {
      kind: "user";
      action: "upsert" | "delete";
      providerEventId: string;
      providerEventType: string;
      providerOccurredAt: number;
      receivedAt: number;
      payloadHash: string;
      userId: string;
      accountId: AccountId;
      emailHash: string;
      displayName: string | null;
      locale: string | null;
    }
  | {
      kind: "organization";
      action: "upsert" | "delete";
      providerEventId: string;
      providerEventType: string;
      providerOccurredAt: number;
      receivedAt: number;
      payloadHash: string;
      organizationId: string;
      workspaceId: WorkspaceId;
      workspaceLabel: string;
    }
  | {
      kind: "membership";
      action: "upsert" | "delete";
      providerEventId: string;
      providerEventType: string;
      providerOccurredAt: number;
      receivedAt: number;
      payloadHash: string;
      providerMembershipId: string;
      userId: string;
      organizationId: string;
      accountId: AccountId;
      workspaceId: WorkspaceId;
      role: WorkspaceRole;
      membershipStatus: "invited" | "active" | "suspended" | "revoked";
    }
  | {
      kind: "invitation";
      action: "upsert";
      providerEventId: string;
      providerEventType: string;
      providerOccurredAt: number;
      receivedAt: number;
      payloadHash: string;
      providerInvitationId: string;
      organizationId: string;
      workspaceId: WorkspaceId;
      invitedEmailHash: string;
      role: WorkspaceRole;
      invitationStatus: "pending" | "accepted" | "expired" | "revoked";
      invitedByAccountId: AccountId | null;
      acceptedByAccountId: AccountId | null;
      expiresAt: number;
      acceptedAt: number | null;
      invitationCreatedAt: number;
    };

export function readWorkOSWebhookConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): WorkOSWebhookConfig | null {
  const apiKey = environment.WORKOS_API_KEY?.trim();
  const secret = environment.WORKOS_WEBHOOK_SECRET?.trim();
  if (!apiKey && !secret) return null;
  if (
    !apiKey
    || !secret
    || !isValidWorkOSApiKey(apiKey)
    || secret.length < 24
    || /[\u0000-\u0020]/u.test(secret)
  ) {
    throw new Error("Invalid WorkOS webhook configuration");
  }
  return { apiKey, secret };
}

export class WorkOSWebhookAdapter {
  constructor(
    private readonly config: WorkOSWebhookConfig,
    private readonly workos = new WorkOS(config.apiKey),
  ) {}

  async verify(input: {
    rawBody: string;
    signature: string | null;
    receivedAt?: number;
  }): Promise<WorkOSWebhookProjection | null> {
    if (!input.signature) {
      throw new Error("Missing WorkOS webhook signature");
    }
    const event = await this.workos.webhooks.constructEvent({
      payload: input.rawBody,
      sigHeader: input.signature,
      secret: this.config.secret,
      tolerance: 300,
    });
    return normalizeWorkOSEvent(
      event,
      await sha256Hex(input.rawBody),
      input.receivedAt ?? Date.now(),
    );
  }
}

export async function normalizeWorkOSEvent(
  event: Event,
  payloadHash: string,
  receivedAt: number,
): Promise<WorkOSWebhookProjection | null> {
  const base = {
    providerEventId: requireProviderId(event.id, "WorkOS event"),
    providerEventType: event.event,
    providerOccurredAt: parseProviderTime(event.createdAt),
    receivedAt: requireTimestamp(receivedAt, "received"),
    payloadHash: requireSha256(payloadHash),
  };
  switch (event.event) {
    case "user.created":
    case "user.updated":
    case "user.deleted": {
      const userId = requireProviderId(event.data.id, "WorkOS user");
      return {
        ...base,
        kind: "user",
        action: event.event === "user.deleted" ? "delete" : "upsert",
        userId,
        accountId: workOSAccountId(userId),
        emailHash: await sha256Hex(event.data.email.trim().toLowerCase()),
        displayName: normalizeOptionalText(event.data.name, 160),
        locale: normalizeOptionalText(event.data.locale, 32),
      };
    }
    case "organization.created":
    case "organization.updated":
    case "organization.deleted": {
      const organizationId = requireProviderId(
        event.data.id,
        "WorkOS organization",
      );
      return {
        ...base,
        kind: "organization",
        action:
          event.event === "organization.deleted" ? "delete" : "upsert",
        organizationId,
        workspaceId: workOSOrganizationWorkspaceId(organizationId),
        workspaceLabel:
          requireText(event.data.name, "WorkOS organization name", 160),
      };
    }
    case "organization_membership.created":
    case "organization_membership.updated":
    case "organization_membership.deleted": {
      const providerMembershipId = requireProviderId(
        event.data.id,
        "WorkOS organization membership",
      );
      const userId = requireProviderId(event.data.userId, "WorkOS user");
      const organizationId = requireProviderId(
        event.data.organizationId,
        "WorkOS organization",
      );
      const deleted =
        event.event === "organization_membership.deleted";
      return {
        ...base,
        kind: "membership",
        action: deleted ? "delete" : "upsert",
        providerMembershipId,
        userId,
        organizationId,
        accountId: workOSAccountId(userId),
        workspaceId: workOSOrganizationWorkspaceId(organizationId),
        role: normalizeWorkOSRole(event.data.role.slug),
        membershipStatus: deleted
          ? "revoked"
          : normalizeMembershipStatus(event.data.status),
      };
    }
    case "invitation.created":
    case "invitation.accepted":
    case "invitation.revoked":
    case "invitation.resent": {
      const providerInvitationId = requireProviderId(
        event.data.id,
        "WorkOS invitation",
      );
      const organizationId = event.data.organizationId
        ? requireProviderId(
            event.data.organizationId,
            "WorkOS organization",
          )
        : null;
      if (!organizationId) return null;
      return {
        ...base,
        kind: "invitation",
        action: "upsert",
        providerInvitationId,
        organizationId,
        workspaceId: workOSOrganizationWorkspaceId(organizationId),
        invitedEmailHash:
          await sha256Hex(event.data.email.trim().toLowerCase()),
        role: normalizeWorkOSRole(event.data.roleSlug ?? undefined),
        invitationStatus: normalizeInvitationStatus(event.data.state),
        invitedByAccountId: event.data.inviterUserId
          ? workOSAccountId(
              requireProviderId(
                event.data.inviterUserId,
                "WorkOS invitation owner",
              ),
            )
          : null,
        acceptedByAccountId: event.data.acceptedUserId
          ? workOSAccountId(
              requireProviderId(
                event.data.acceptedUserId,
                "WorkOS invited user",
              ),
            )
          : null,
        expiresAt: parseProviderTime(event.data.expiresAt),
        acceptedAt: event.data.acceptedAt
          ? parseProviderTime(event.data.acceptedAt)
          : null,
        invitationCreatedAt: parseProviderTime(event.data.createdAt),
      };
    }
    default:
      return null;
  }
}

export class ConvexWorkOSWebhookStore {
  async apply(
    projection: WorkOSWebhookProjection,
  ): Promise<"applied" | "duplicate"> {
    return executeConvex("workos.webhook.apply", projection);
  }
}

function normalizeInvitationStatus(
  value: string,
): "pending" | "accepted" | "expired" | "revoked" {
  switch (value.toLowerCase()) {
    case "pending":
    case "accepted":
    case "expired":
    case "revoked":
      return value.toLowerCase() as
        | "pending"
        | "accepted"
        | "expired"
        | "revoked";
    default:
      throw new Error("Unsupported WorkOS invitation status");
  }
}

function normalizeMembershipStatus(
  value: string,
): "invited" | "active" | "suspended" | "revoked" {
  switch (value.toLowerCase()) {
    case "pending":
    case "invited":
      return "invited";
    case "active":
      return "active";
    case "inactive":
    case "suspended":
      return "suspended";
    case "revoked":
      return "revoked";
    default:
      throw new Error("Unsupported WorkOS membership status");
  }
}

function parseProviderTime(value: string): number {
  return requireTimestamp(Date.parse(value), "provider");
}

function requireTimestamp(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`Invalid WorkOS ${label} timestamp`);
  }
  return value;
}

function requireProviderId(value: string, label: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{5,127}$/u.test(value)) {
    throw new Error(`${label} identifier is invalid`);
  }
  return value;
}

function requireText(value: string, label: string, limit: number): string {
  const text = normalizeOptionalText(value, limit);
  if (!text) throw new Error(`${label} is invalid`);
  return text;
}

function normalizeOptionalText(
  value: string | null | undefined,
  limit: number,
): string | null {
  const text = value?.trim();
  if (!text) return null;
  if (text.length > limit || /[\u0000-\u001f]/u.test(text)) {
    throw new Error("WorkOS text is invalid");
  }
  return text;
}

function requireSha256(value: string): string {
  if (!/^[a-f0-9]{64}$/u.test(value)) {
    throw new Error("Invalid WorkOS payload hash");
  }
  return value;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")).join("");
}
