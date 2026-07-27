import { describe, expect, it } from "vitest";
import {
  consumeProtectedDownload,
  createDownloadGrant,
  InMemoryProtectedDownloadRepository,
  opaqueId,
  type DownloadAuthorizationInput,
} from "../lib/commerce";

const now = 1_800_000_000_000;
const secret = "protected-download-local-secret-at-least-thirty-two-bytes";
const accountId = opaqueId("acct:local:download", "account");
const workspaceId = opaqueId("workspace:local:download", "workspace");
const licenceId = opaqueId("licence:local:download", "licence");
const entitlementId = opaqueId(
  "entitlement:local:download",
  "entitlement",
);
const releaseId = opaqueId("release:local:download", "release");
const caller = {
  accountId,
  workspaceId,
  fingerprintHash: "fingerprint:request:001",
  session: {
    accountId,
    active: true,
    expiresAt: now + 60_000,
  },
};

function currentFacts(): DownloadAuthorizationInput {
  return {
    now,
    accountId,
    workspaceId,
    releaseId,
    entitlementId,
    allowedRoles: ["member"],
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
      startsAt: now - 1_000,
      expiresAt: null,
      updatesUntil: now + 60_000,
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
      updatesUntil: now + 60_000,
    },
    release: {
      id: releaseId,
      productRef: "product:configured",
      status: "published",
      releasedAt: now - 500,
    },
  };
}

async function issue(repository: InMemoryProtectedDownloadRepository) {
  return createDownloadGrant({
    grantId: opaqueId("grant:local:download", "download-grant"),
    accountId,
    workspaceId,
    releaseId,
    entitlementId,
    fingerprintHash: "fingerprint:request:001",
    now,
    ttlMs: 30_000,
    secret,
    store: repository,
    nonceSource: () => new Uint8Array(24).fill(11),
  });
}

describe("current-state protected download boundary", () => {
  it("re-fetches current state and atomically consumes an authorized grant", async () => {
    const repository = new InMemoryProtectedDownloadRepository();
    repository.setCurrentAuthorization(currentFacts());
    const grant = await issue(repository);
    await expect(
      consumeProtectedDownload({
        token: grant.token,
        now: now + 1,
        secret,
        allowedRoles: ["member"],
        caller,
        repository,
      }),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      consumeProtectedDownload({
        token: grant.token,
        now: now + 2,
        secret,
        allowedRoles: ["member"],
        caller,
        repository,
      }),
    ).resolves.toEqual({
      ok: false,
      status: 404,
      code: "not_found_or_forbidden",
    });
  });

  it.each([
    {
      name: "provider membership removal",
      revoke: (facts: DownloadAuthorizationInput) => {
        facts.providerMembership!.active = false;
      },
    },
    {
      name: "local membership suspension",
      revoke: (facts: DownloadAuthorizationInput) => {
        facts.membership!.status = "suspended";
      },
    },
    {
      name: "seat revocation",
      revoke: (facts: DownloadAuthorizationInput) => {
        facts.seat!.status = "revoked";
      },
    },
    {
      name: "entitlement revocation",
      revoke: (facts: DownloadAuthorizationInput) => {
        facts.entitlement!.status = "revoked";
      },
    },
  ])("denies a valid pre-issued token after $name", async ({ revoke }) => {
    const repository = new InMemoryProtectedDownloadRepository();
    const facts = currentFacts();
    repository.setCurrentAuthorization(facts);
    const grant = await issue(repository);
    revoke(facts);
    repository.setCurrentAuthorization(facts);

    await expect(
      consumeProtectedDownload({
        token: grant.token,
        now: now + 1,
        secret,
        allowedRoles: ["member"],
        caller,
        repository,
      }),
    ).resolves.toEqual({
      ok: false,
      status: 404,
      code: "not_found_or_forbidden",
    });
  });

  it("permits only one concurrent authorization-and-consume transaction", async () => {
    const repository = new InMemoryProtectedDownloadRepository();
    repository.setCurrentAuthorization(currentFacts());
    const grant = await issue(repository);
    const results = await Promise.all([
      consumeProtectedDownload({
        token: grant.token,
        now: now + 1,
        secret,
        allowedRoles: ["member"],
        caller,
        repository,
      }),
      consumeProtectedDownload({
        token: grant.token,
        now: now + 1,
        secret,
        allowedRoles: ["member"],
        caller,
        repository,
      }),
    ]);
    expect(results.filter(({ ok }) => ok)).toHaveLength(1);
    expect(results.filter(({ ok }) => !ok)).toEqual([
      { ok: false, status: 404, code: "not_found_or_forbidden" },
    ]);
  });

  it("denies a signed token without a current caller session", async () => {
    const repository = new InMemoryProtectedDownloadRepository();
    repository.setCurrentAuthorization(currentFacts());
    const grant = await issue(repository);
    await expect(
      consumeProtectedDownload({
        token: grant.token,
        now: now + 1,
        secret,
        allowedRoles: ["member"],
        caller: null,
        repository,
      }),
    ).resolves.toEqual({
      ok: false,
      status: 404,
      code: "not_found_or_forbidden",
    });
  });

  it.each([
    {
      name: "different account",
      caller: {
        ...caller,
        accountId: opaqueId("acct:other:download", "account"),
        session: {
          ...caller.session,
          accountId: opaqueId("acct:other:download", "account"),
        },
      },
    },
    {
      name: "different workspace",
      caller: {
        ...caller,
        workspaceId: opaqueId("workspace:other:download", "workspace"),
      },
    },
    {
      name: "different request fingerprint",
      caller: {
        ...caller,
        fingerprintHash: "fingerprint:other:999",
      },
    },
  ])("denies a signed token used by a $name", async ({ caller: otherCaller }) => {
    const repository = new InMemoryProtectedDownloadRepository();
    repository.setCurrentAuthorization(currentFacts());
    const grant = await issue(repository);
    await expect(
      consumeProtectedDownload({
        token: grant.token,
        now: now + 1,
        secret,
        allowedRoles: ["member"],
        caller: otherCaller,
        repository,
      }),
    ).resolves.toEqual({
      ok: false,
      status: 404,
      code: "not_found_or_forbidden",
    });
  });
});
