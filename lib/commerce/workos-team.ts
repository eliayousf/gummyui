import "server-only";
import {
  WorkOS,
  type Invitation,
  type User,
} from "@workos-inc/node";
import { executeConvex } from "../../db";
import type { ServerAccountAccess } from "./account";
import {
  buildWorkOSIdentityProjection,
  ConvexWorkOSIdentityStore,
  normalizeWorkOSRole,
  readWorkOSIdentityConfig,
  workOSAccountId,
  workOSOrganizationWorkspaceId,
} from "./workos-identity";

type AuthenticatedAccess = Extract<
  ServerAccountAccess,
  { status: "authenticated" }
>;

export interface WorkOSTeamConfig {
  apiKey: string;
  applicationOrigin: string;
}

export function readWorkOSTeamConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): WorkOSTeamConfig | null {
  const identity = readWorkOSIdentityConfig(environment);
  return identity
    ? {
        apiKey: identity.apiKey,
        applicationOrigin: identity.applicationOrigin,
      }
    : null;
}

export function isOrganizationWorkspace(access: AuthenticatedAccess): boolean {
  return String(access.workspaceId).startsWith("workspace:workos:")
    && !String(access.workspaceId).startsWith(
      "workspace:workos-personal:",
    );
}

export class WorkOSTeamService {
  constructor(
    private readonly config: WorkOSTeamConfig,
    private readonly workos = new WorkOS(config.apiKey),
    private readonly identityStore = new ConvexWorkOSIdentityStore(),
  ) {}

  async createWorkspace(input: {
    access: AuthenticatedAccess;
    user: User;
    name: string;
    requestId: string;
    now?: number;
  }): Promise<{ organizationId: string }> {
    if (
      isOrganizationWorkspace(input.access)
      || workOSAccountId(input.user.id) !== input.access.accountId
    ) {
      throw new Error("Workspace creation is unavailable");
    }
    const name = normalizeWorkspaceName(input.name);
    const requestId = normalizeRequestId(input.requestId);
    const organization = await this.workos.organizations.createOrganization(
      {
        name,
        metadata: { product: "gummy-ui" },
      },
      {
        idempotencyKey:
          `gummyui-workspace:${input.access.accountId}:${requestId}`,
      },
    );
    let membership;
    try {
      membership =
        await this.workos.userManagement.createOrganizationMembership({
          organizationId: organization.id,
          userId: input.user.id,
          roleSlug: "admin",
        });
    } catch (error) {
      await this.workos.organizations
        .deleteOrganization(organization.id)
        .catch(() => undefined);
      throw error;
    }
    const currentSince = Date.parse(membership.updatedAt);
    const projection = await buildWorkOSIdentityProjection({
      user: input.user,
      organizationId: organization.id,
      organizationName: organization.name,
      providerMembershipId: membership.id,
      role: membership.role.slug,
      now: Number.isSafeInteger(currentSince)
        ? currentSince
        : input.now ?? Date.now(),
    });
    await this.identityStore.provision(projection);
    return {
      organizationId: organization.id,
    };
  }

  async sendInvitation(input: {
    access: AuthenticatedAccess;
    user: User;
    organizationId: string;
    email: string;
    role?: "member" | "viewer";
    now?: number;
  }): Promise<{ id: string; status: string; expiresAt: number }> {
    if (
      !isOrganizationWorkspace(input.access)
      || !["owner", "admin"].includes(input.access.role)
      || workOSAccountId(input.user.id) !== input.access.accountId
      || workOSOrganizationWorkspaceId(input.organizationId)
        !== input.access.workspaceId
    ) {
      throw new Error("Invitation is unavailable");
    }
    const email = normalizeEmail(input.email);
    if (email === input.user.email.trim().toLowerCase()) {
      throw new Error("Invitation recipient must be another user");
    }
    const invitation = await this.workos.userManagement.sendInvitation({
      email,
      organizationId: input.organizationId,
      expiresInDays: 7,
      inviterUserId: input.user.id,
      roleSlug: input.role ?? "member",
      locale: "en-GB",
    });
    await recordInvitation(
      invitation,
      input.access,
      input.now ?? Date.now(),
    );
    return {
      id: `invitation:workos:${invitation.id}`,
      status: invitation.state,
      expiresAt: Date.parse(invitation.expiresAt),
    };
  }
}

async function recordInvitation(
  invitation: Invitation,
  access: AuthenticatedAccess,
  now: number,
): Promise<void> {
  if (!invitation.organizationId) {
    throw new Error("Organization invitation is required");
  }
  const acceptedAt = invitation.acceptedAt
    ? Date.parse(invitation.acceptedAt)
    : null;
  await executeConvex("workos.invitation.record", {
    providerInvitationId: invitation.id,
    workspaceId: workOSOrganizationWorkspaceId(
      invitation.organizationId,
    ),
    invitedEmailHash:
      await sha256Hex(invitation.email.trim().toLowerCase()),
    role: normalizeWorkOSRole(invitation.roleSlug ?? undefined),
    invitationStatus: invitation.state,
    invitedByAccountId: invitation.inviterUserId
      ? workOSAccountId(invitation.inviterUserId)
      : access.accountId,
    acceptedByAccountId: invitation.acceptedUserId
      ? workOSAccountId(invitation.acceptedUserId)
      : null,
    expiresAt: requireTimestamp(
      Date.parse(invitation.expiresAt),
      "invitation expiry",
    ),
    acceptedAt:
      acceptedAt === null
        ? null
        : requireTimestamp(acceptedAt, "invitation acceptance"),
    invitationCreatedAt: requireTimestamp(
      Date.parse(invitation.createdAt),
      "invitation creation",
    ),
    providerOccurredAt: now,
  });
}

function normalizeWorkspaceName(value: string): string {
  const text = value.trim().replace(/\s+/gu, " ");
  if (
    text.length < 2
    || text.length > 100
    || /[\u0000-\u001f]/u.test(text)
  ) {
    throw new Error("Invalid workspace name");
  }
  return text;
}

function normalizeRequestId(value: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{15,80}$/u.test(value)) {
    throw new Error("Invalid workspace request");
  }
  return value;
}

function normalizeEmail(value: string): string {
  const email = value.trim().toLowerCase();
  if (
    email.length > 254
    || !/^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/iu
      .test(email)
  ) {
    throw new Error("Invalid invitation email");
  }
  return email;
}

function requireTimestamp(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`Invalid ${label}`);
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
