import { describe, expect, it } from "vitest";
import {
  authorizeDownload,
  opaqueId,
  type DownloadAuthorizationInput,
} from "../lib/commerce";

const accountId = opaqueId("acct:local:001", "account");
const workspaceId = opaqueId("workspace:local:001", "workspace");
const licenceId = opaqueId("licence:local:001", "licence");
const entitlementId = opaqueId("entitlement:local:001", "entitlement");
const releaseId = opaqueId("release:local:001", "release");
const now = 1_800_000_000_000;

function allowedFacts(): DownloadAuthorizationInput {
  return {
    now,
    accountId,
    workspaceId,
    releaseId,
    entitlementId,
    allowedRoles: ["owner", "admin", "member"],
    sources: { identity: "available", localProjection: "available" },
    session: { accountId, active: true, expiresAt: now + 60_000 },
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
      startsAt: now - 10_000,
      expiresAt: null,
      updatesUntil: now + 10_000,
    },
    seat: { accountId, licenceId, status: "active" },
    entitlement: {
      id: entitlementId,
      accountId,
      workspaceId,
      licenceId,
      productRef: "product:configured",
      status: "active",
      validFrom: now - 10_000,
      validUntil: now + 10_000,
      updatesUntil: now + 10_000,
    },
    release: {
      id: releaseId,
      productRef: "product:configured",
      status: "published",
      releasedAt: now - 1_000,
    },
  };
}

describe("fail-closed commerce authorization", () => {
  it("allows only a fully current, correctly bound projection", () => {
    expect(authorizeDownload(allowedFacts())).toEqual({ allowed: true });
  });

  it.each([
    {
      name: "identity provider failure",
      mutate: (facts: DownloadAuthorizationInput) => {
        facts.sources.identity = "unavailable";
      },
      reason: "authorization_source_unavailable",
    },
    {
      name: "deleted account",
      mutate: (facts: DownloadAuthorizationInput) => {
        facts.account!.status = "deleted";
      },
      reason: "account_inactive",
    },
    {
      name: "stale membership",
      mutate: (facts: DownloadAuthorizationInput) => {
        facts.membership!.status = "revoked";
      },
      reason: "membership_inactive",
    },
    {
      name: "removed provider membership",
      mutate: (facts: DownloadAuthorizationInput) => {
        facts.providerMembership!.active = false;
      },
      reason: "membership_inactive",
    },
    {
      name: "provider and local role mismatch",
      mutate: (facts: DownloadAuthorizationInput) => {
        facts.providerMembership!.role = "viewer";
      },
      reason: "membership_conflict",
    },
    {
      name: "forbidden role",
      mutate: (facts: DownloadAuthorizationInput) => {
        facts.membership!.role = "viewer";
        facts.providerMembership!.role = "viewer";
      },
      reason: "role_forbidden",
    },
    {
      name: "revoked seat",
      mutate: (facts: DownloadAuthorizationInput) => {
        facts.seat!.status = "revoked";
      },
      reason: "seat_inactive",
    },
    {
      name: "revoked entitlement",
      mutate: (facts: DownloadAuthorizationInput) => {
        facts.entitlement!.status = "revoked";
      },
      reason: "entitlement_inactive",
    },
    {
      name: "withdrawn release",
      mutate: (facts: DownloadAuthorizationInput) => {
        facts.release!.status = "withdrawn";
      },
      reason: "release_unavailable",
    },
  ])("denies $name", ({ mutate, reason }) => {
    const facts = allowedFacts();
    mutate(facts);
    expect(authorizeDownload(facts)).toEqual({ allowed: false, reason });
  });

  it("does not distinguish guessed or cross-workspace identifiers", () => {
    const facts = allowedFacts();
    facts.releaseId = opaqueId("release:guessed:999", "release");
    expect(authorizeDownload(facts)).toEqual({
      allowed: false,
      reason: "not_found_or_forbidden",
    });

    const crossWorkspace = allowedFacts();
    crossWorkspace.membership!.workspaceId = opaqueId(
      "workspace:other:999",
      "workspace",
    );
    expect(authorizeDownload(crossWorkspace)).toEqual({
      allowed: false,
      reason: "not_found_or_forbidden",
    });

    const staleProvider = allowedFacts();
    staleProvider.providerMembership!.workspaceId = opaqueId(
      "workspace:other:999",
      "workspace",
    );
    expect(authorizeDownload(staleProvider)).toEqual({
      allowed: false,
      reason: "not_found_or_forbidden",
    });
  });

  it("denies a release after either configured update window", () => {
    const facts = allowedFacts();
    facts.release!.releasedAt = now - 1_000;
    facts.entitlement!.updatesUntil = now - 2_000;
    expect(authorizeDownload(facts)).toEqual({
      allowed: false,
      reason: "updates_window_closed",
    });
  });

  it("fails closed when role policy is not configured", () => {
    const facts = allowedFacts();
    facts.allowedRoles = [];
    expect(authorizeDownload(facts)).toEqual({
      allowed: false,
      reason: "policy_not_configured",
    });
  });
});
