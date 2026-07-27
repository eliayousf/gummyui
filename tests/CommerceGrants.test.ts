import { describe, expect, it } from "vitest";
import {
  createDownloadGrant,
  InMemoryDownloadGrantStore,
  opaqueId,
  verifyAndConsumeDownloadGrant,
} from "../lib/commerce";

const secret = "local-test-secret-with-at-least-thirty-two-bytes";
const now = 1_800_000_000_000;
const binding = {
  accountId: opaqueId("acct:local:001", "account"),
  workspaceId: opaqueId("workspace:local:001", "workspace"),
  releaseId: opaqueId("release:local:001", "release"),
  entitlementId: opaqueId("entitlement:local:001", "entitlement"),
  fingerprintHash: "fingerprint:local",
};

async function issue(store = new InMemoryDownloadGrantStore()) {
  const grant = await createDownloadGrant({
    grantId: opaqueId("grant:local:001", "download-grant"),
    ...binding,
    now,
    ttlMs: 60_000,
    secret,
    store,
    nonceSource: () => Uint8Array.from({ length: 24 }, (_, index) => index + 1),
  });
  return { grant, store };
}

describe("signed one-use download grants", () => {
  it("returns only a same-origin path and consumes exactly once", async () => {
    const { grant, store } = await issue();
    expect(grant.path).toBe(`/downloads/${grant.token}`);
    expect(grant.path.startsWith("http")).toBe(false);

    await expect(
      verifyAndConsumeDownloadGrant({
        token: grant.token,
        expected: binding,
        now: now + 1_000,
        secret,
        store,
      }),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      verifyAndConsumeDownloadGrant({
        token: grant.token,
        expected: binding,
        now: now + 2_000,
        secret,
        store,
      }),
    ).resolves.toEqual({ ok: false, reason: "replayed" });
  });

  it("atomically permits only one of two concurrent consumes", async () => {
    const { grant, store } = await issue();
    const results = await Promise.all([
      verifyAndConsumeDownloadGrant({
        token: grant.token,
        expected: binding,
        now: now + 1_000,
        secret,
        store,
      }),
      verifyAndConsumeDownloadGrant({
        token: grant.token,
        expected: binding,
        now: now + 1_000,
        secret,
        store,
      }),
    ]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok)).toEqual([
      { ok: false, reason: "replayed" },
    ]);
  });

  it("rejects expiration, tampering and a guessed release binding", async () => {
    const expired = await issue();
    await expect(
      verifyAndConsumeDownloadGrant({
        token: expired.grant.token,
        expected: binding,
        now: now + 60_000,
        secret,
        store: expired.store,
      }),
    ).resolves.toEqual({ ok: false, reason: "expired" });

    const tampered = await issue();
    const changed =
      `${tampered.grant.token.slice(0, -1)}${tampered.grant.token.endsWith("A") ? "B" : "A"}`;
    await expect(
      verifyAndConsumeDownloadGrant({
        token: changed,
        expected: binding,
        now: now + 1_000,
        secret,
        store: tampered.store,
      }),
    ).resolves.toEqual({ ok: false, reason: "invalid" });

    const guessed = await issue();
    await expect(
      verifyAndConsumeDownloadGrant({
        token: guessed.grant.token,
        expected: {
          ...binding,
          releaseId: opaqueId("release:guessed:999", "release"),
        },
        now: now + 1_000,
        secret,
        store: guessed.store,
      }),
    ).resolves.toEqual({ ok: false, reason: "binding_mismatch" });
  });
});
