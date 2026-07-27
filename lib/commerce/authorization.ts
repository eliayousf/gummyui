import type {
  AccountId,
  AccountStatus,
  EntitlementId,
  EntitlementStatus,
  LicenceId,
  LicenceStatus,
  MembershipStatus,
  ReleaseId,
  ReleaseStatus,
  WorkspaceId,
  WorkspaceRole,
  WorkspaceStatus,
} from "./model";

export type AuthorizationDenial =
  | "authorization_source_unavailable"
  | "unauthenticated"
  | "session_expired"
  | "account_inactive"
  | "workspace_inactive"
  | "membership_inactive"
  | "membership_conflict"
  | "role_forbidden"
  | "licence_inactive"
  | "licence_not_current"
  | "seat_inactive"
  | "entitlement_inactive"
  | "entitlement_not_current"
  | "release_unavailable"
  | "updates_window_closed"
  | "not_found_or_forbidden"
  | "policy_not_configured";

export type AuthorizationDecision =
  | { allowed: true }
  | { allowed: false; reason: AuthorizationDenial };

interface SourceState {
  identity: "available" | "unavailable";
  localProjection: "available" | "unavailable";
}

interface SessionFact {
  accountId: AccountId;
  active: boolean;
  expiresAt: number;
}

interface AccountFact {
  id: AccountId;
  status: AccountStatus;
}

interface WorkspaceFact {
  id: WorkspaceId;
  status: WorkspaceStatus;
}

interface MembershipFact {
  accountId: AccountId;
  workspaceId: WorkspaceId;
  role: WorkspaceRole;
  status: MembershipStatus;
}

interface CurrentProviderMembershipFact {
  accountId: AccountId;
  workspaceId: WorkspaceId;
  role: WorkspaceRole;
  active: boolean;
}

export interface WorkspaceAuthorizationInput {
  now: number;
  accountId: AccountId;
  workspaceId: WorkspaceId;
  allowedRoles: readonly WorkspaceRole[];
  sources: SourceState;
  session?: SessionFact | null;
  account?: AccountFact | null;
  workspace?: WorkspaceFact | null;
  membership?: MembershipFact | null;
  providerMembership?: CurrentProviderMembershipFact | null;
}

interface LicenceFact {
  id: LicenceId;
  workspaceId: WorkspaceId;
  productRef: string;
  status: LicenceStatus;
  startsAt: number;
  expiresAt: number | null;
  updatesUntil: number | null;
}

interface SeatFact {
  accountId: AccountId;
  licenceId: LicenceId;
  status: "active" | "revoked";
}

interface EntitlementFact {
  id: EntitlementId;
  accountId: AccountId | null;
  workspaceId: WorkspaceId;
  licenceId: LicenceId;
  productRef: string;
  status: EntitlementStatus;
  validFrom: number;
  validUntil: number | null;
  updatesUntil: number | null;
}

interface ReleaseFact {
  id: ReleaseId;
  productRef: string;
  status: ReleaseStatus;
  releasedAt: number | null;
}

export interface DownloadAuthorizationInput extends WorkspaceAuthorizationInput {
  releaseId: ReleaseId;
  entitlementId: EntitlementId;
  licence?: LicenceFact | null;
  seat?: SeatFact | null;
  entitlement?: EntitlementFact | null;
  release?: ReleaseFact | null;
}

export function authorizeWorkspace(
  input: WorkspaceAuthorizationInput,
): AuthorizationDecision {
  if (
    input.sources.identity !== "available"
    || input.sources.localProjection !== "available"
  ) {
    return deny("authorization_source_unavailable");
  }
  if (!input.allowedRoles.length) {
    return deny("policy_not_configured");
  }
  if (!input.session?.active) {
    return deny("unauthenticated");
  }
  if (input.session.expiresAt <= input.now) {
    return deny("session_expired");
  }
  if (
    input.session.accountId !== input.accountId
    || input.account?.id !== input.accountId
  ) {
    return deny("not_found_or_forbidden");
  }
  if (input.account.status !== "active") {
    return deny("account_inactive");
  }
  if (input.workspace?.id !== input.workspaceId) {
    return deny("not_found_or_forbidden");
  }
  if (input.workspace.status !== "active") {
    return deny("workspace_inactive");
  }
  if (
    input.membership?.accountId !== input.accountId
    || input.membership.workspaceId !== input.workspaceId
  ) {
    return deny("not_found_or_forbidden");
  }
  if (input.membership.status !== "active") {
    return deny("membership_inactive");
  }
  if (
    input.providerMembership?.accountId !== input.accountId
    || input.providerMembership.workspaceId !== input.workspaceId
  ) {
    return deny("not_found_or_forbidden");
  }
  if (!input.providerMembership.active) {
    return deny("membership_inactive");
  }
  if (input.providerMembership.role !== input.membership.role) {
    return deny("membership_conflict");
  }
  if (!input.allowedRoles.includes(input.membership.role)) {
    return deny("role_forbidden");
  }
  return { allowed: true };
}

export function authorizeDownload(
  input: DownloadAuthorizationInput,
): AuthorizationDecision {
  const workspaceDecision = authorizeWorkspace(input);
  if (!workspaceDecision.allowed) {
    return workspaceDecision;
  }

  const { licence, entitlement, release, seat } = input;
  if (
    !licence
    || !entitlement
    || !release
    || !seat
    || release.id !== input.releaseId
    || entitlement.id !== input.entitlementId
    || licence.workspaceId !== input.workspaceId
    || entitlement.workspaceId !== input.workspaceId
    || entitlement.licenceId !== licence.id
    || entitlement.productRef !== licence.productRef
    || release.productRef !== licence.productRef
    || seat.licenceId !== licence.id
    || seat.accountId !== input.accountId
    || (entitlement.accountId !== null
      && entitlement.accountId !== input.accountId)
  ) {
    return deny("not_found_or_forbidden");
  }
  if (licence.status !== "active") {
    return deny("licence_inactive");
  }
  if (
    licence.startsAt > input.now
    || (licence.expiresAt !== null && licence.expiresAt <= input.now)
  ) {
    return deny("licence_not_current");
  }
  if (seat.status !== "active") {
    return deny("seat_inactive");
  }
  if (entitlement.status !== "active") {
    return deny("entitlement_inactive");
  }
  if (
    entitlement.validFrom > input.now
    || (entitlement.validUntil !== null
      && entitlement.validUntil <= input.now)
  ) {
    return deny("entitlement_not_current");
  }
  if (
    release.status !== "published"
    || release.releasedAt === null
    || release.releasedAt > input.now
  ) {
    return deny("release_unavailable");
  }

  const updateDeadlines = [
    licence.updatesUntil,
    entitlement.updatesUntil,
  ].filter((value): value is number => value !== null);
  if (
    updateDeadlines.some((deadline) => release.releasedAt! > deadline)
  ) {
    return deny("updates_window_closed");
  }
  return { allowed: true };
}

function deny(reason: AuthorizationDenial): AuthorizationDecision {
  return { allowed: false, reason };
}
