import "server-only";
import type { User } from "@workos-inc/node";
import { executeConvex } from "../../db";
import type { ServerAccountAccess } from "./account";
import {
  opaqueId,
  type AccountId,
  type WorkspaceId,
  type WorkspaceRole,
} from "./model";

export interface WorkOSIdentityConfig {
  clientId: string;
  apiKey: string;
  cookiePassword: string;
  redirectUri: string;
  applicationOrigin: string;
}

export interface WorkOSIdentityProjection {
  userId: string;
  accountId: AccountId;
  workspaceId: WorkspaceId;
  organizationId: string | null;
  providerMembershipId: string | null;
  emailHash: string;
  displayName: string | null;
  locale: string | null;
  workspaceLabel: string;
  role: WorkspaceRole;
  currentSince: number;
}

export function readWorkOSIdentityConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): WorkOSIdentityConfig | null {
  const clientId = environment.WORKOS_CLIENT_ID?.trim();
  const apiKey = environment.WORKOS_API_KEY?.trim();
  const cookiePassword = environment.WORKOS_COOKIE_PASSWORD?.trim();
  const redirectUri = environment.WORKOS_REDIRECT_URI?.trim();
  const publicRedirectUri =
    environment.NEXT_PUBLIC_WORKOS_REDIRECT_URI?.trim();
  const applicationOrigin = environment.GUMMYUI_ORIGIN?.trim();
  if (
    !clientId
    || !apiKey
    || !cookiePassword
    || !redirectUri
    || !publicRedirectUri
    || !applicationOrigin
  ) {
    return null;
  }
  if (
    !/^client_[A-Za-z0-9]+$/.test(clientId)
    || !/^sk_(?:test|live)_[A-Za-z0-9]+$/.test(apiKey)
    || cookiePassword.length < 32
  ) {
    throw new Error("Invalid WorkOS server configuration");
  }
  const origin = normalizeOrigin(applicationOrigin);
  const callback = new URL(redirectUri);
  if (
    callback.origin !== origin
    || callback.pathname !== "/auth/callback"
    || callback.toString() !== new URL(publicRedirectUri).toString()
    || callback.search
    || callback.hash
    || callback.username
    || callback.password
  ) {
    throw new Error("Invalid WorkOS redirect URI");
  }
  return {
    clientId,
    apiKey,
    cookiePassword,
    redirectUri: callback.toString(),
    applicationOrigin: origin,
  };
}

export async function buildWorkOSIdentityProjection(input: {
  user: User;
  organizationId?: string;
  organizationName?: string;
  providerMembershipId?: string;
  role?: string;
  now?: number;
}): Promise<WorkOSIdentityProjection> {
  const userId = requireProviderId(input.user.id, "WorkOS user");
  const organizationId = input.organizationId
    ? requireProviderId(input.organizationId, "WorkOS organization")
    : null;
  const role = organizationId
    ? normalizeWorkOSRole(input.role)
    : "owner";
  const emailHash = await sha256Hex(input.user.email.trim().toLowerCase());
  const accountId = workOSAccountId(userId);
  const workspaceId = workOSWorkspaceId(userId, organizationId);
  const fallbackName = organizationId
    ? "Gummy UI workspace"
    : "Personal workspace";
  return {
    userId,
    accountId,
    workspaceId,
    organizationId,
    providerMembershipId: input.providerMembershipId
      ? requireProviderId(
          input.providerMembershipId,
          "WorkOS organization membership",
        )
      : null,
    emailHash,
    displayName: normalizeOptionalText(input.user.name, 160),
    locale: normalizeOptionalText(input.user.locale, 32),
    workspaceLabel:
      normalizeOptionalText(input.organizationName, 160) ?? fallbackName,
    role,
    currentSince: input.now ?? Date.now(),
  };
}

export function workOSAccountId(userId: string): AccountId {
  return opaqueId(`account:workos:${userId}`, "account");
}

export function workOSWorkspaceId(
  userId: string,
  organizationId?: string | null,
): WorkspaceId {
  return opaqueId(
    organizationId
      ? `workspace:workos:${organizationId}`
      : `workspace:workos-personal:${userId}`,
    "workspace",
  );
}

export function workOSOrganizationWorkspaceId(
  organizationId: string,
): WorkspaceId {
  return workOSWorkspaceId("organization", organizationId);
}

export function normalizeWorkOSRole(
  role: string | undefined,
): WorkspaceRole {
  switch (role?.trim().toLowerCase()) {
    case "owner":
      return "owner";
    case "admin":
      return "admin";
    case "billing":
      return "billing";
    case "viewer":
      return "viewer";
    default:
      return "member";
  }
}

export class ConvexWorkOSIdentityStore {
  async provision(projection: WorkOSIdentityProjection): Promise<void> {
    await executeConvex("workos.identity.provision", projection);
  }

  async resolve(input: {
    userId: string;
    organizationId?: string;
    providerRole?: string;
    providerMembershipId?: string;
    sessionExpiresAt: number;
  }): Promise<ServerAccountAccess | null> {
    const userId = requireProviderId(input.userId, "WorkOS user");
    const organizationId = input.organizationId
      ? requireProviderId(input.organizationId, "WorkOS organization")
      : null;
    const accountId = workOSAccountId(userId);
    const workspaceId = workOSWorkspaceId(userId, organizationId);
    const role = organizationId
      ? normalizeWorkOSRole(input.providerRole)
      : "owner";
    return executeConvex<ServerAccountAccess | null>(
      "workos.identity.resolve",
      {
        userId,
        organizationId,
        providerMembershipId: input.providerMembershipId ?? null,
        accountId,
        workspaceId,
        role,
        sessionExpiresAt: input.sessionExpiresAt,
      },
    );
  }
}

function normalizeOrigin(value: string): string {
  const url = new URL(value);
  const local =
    url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (
    (url.protocol !== "https:" && !(local && url.protocol === "http:"))
    || url.username
    || url.password
    || url.pathname !== "/"
    || url.search
    || url.hash
  ) {
    throw new Error("Invalid Gummy UI application origin");
  }
  return url.origin;
}

function requireProviderId(value: string, label: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{5,127}$/.test(value)) {
    throw new Error(`${label} identifier is invalid`);
  }
  return value;
}

function normalizeOptionalText(
  value: string | null | undefined,
  limit: number,
): string | null {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }
  if (normalized.length > limit || /[\u0000-\u001f]/.test(normalized)) {
    throw new Error("WorkOS profile text is invalid");
  }
  return normalized;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")).join("");
}
