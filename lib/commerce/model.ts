export type OpaqueId<Kind extends string> = string & {
  readonly __opaqueId: Kind;
};

export type AccountId = OpaqueId<"account">;
export type WorkspaceId = OpaqueId<"workspace">;
export type MembershipId = OpaqueId<"membership">;
export type LicenceId = OpaqueId<"licence">;
export type EntitlementId = OpaqueId<"entitlement">;
export type ReleaseId = OpaqueId<"release">;
export type DownloadGrantId = OpaqueId<"download-grant">;

export function opaqueId<Kind extends string>(
  value: string,
  kind: Kind,
): OpaqueId<Kind> {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{5,255}$/.test(value)) {
    throw new Error(`Invalid opaque ${kind} identifier`);
  }
  return value as OpaqueId<Kind>;
}

export type AccountStatus =
  | "active"
  | "disabled"
  | "deletion_pending"
  | "deleted";
export type WorkspaceStatus =
  | "active"
  | "suspended"
  | "deletion_pending"
  | "deleted";
export type MembershipStatus = "invited" | "active" | "suspended" | "revoked";
export type WorkspaceRole = "owner" | "admin" | "billing" | "member" | "viewer";
export type LicenceStatus =
  | "pending"
  | "active"
  | "suspended"
  | "revoked"
  | "expired";
export type EntitlementStatus =
  | "pending"
  | "active"
  | "suspended"
  | "revoked"
  | "expired";
export type ReleaseStatus = "draft" | "published" | "withdrawn" | "retired";

export interface Clock {
  now(): number;
}

export const systemClock: Clock = {
  now: () => Date.now(),
};

export interface IdSource {
  next(kind: string): string;
}

export class SequentialIdSource implements IdSource {
  private value = 0;

  constructor(private readonly prefix = "local") {}

  next(kind: string): string {
    this.value += 1;
    return `${this.prefix}:${kind}:${String(this.value).padStart(6, "0")}`;
  }
}

export function assertNonEmptyOpaqueRef(value: string, label: string): void {
  if (!value || value.length > 255 || /[\u0000-\u001f]/.test(value)) {
    throw new Error(`Invalid ${label}`);
  }
}
