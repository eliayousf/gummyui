import { beforeEach, describe, expect, it, vi } from "vitest";
import { opaqueId } from "../lib/commerce/model";

const convexMock = vi.hoisted(() => ({
  authorized: true,
  consumable: true,
  execute: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("../db", () => ({
  executeConvex: convexMock.execute,
}));

import {
  consumeAuthorizedRelease,
  issueAuthorizedDownloadGrant,
  readDownloadGrantConfig,
} from "../lib/commerce/convex-downloads";
import { readBackblazeReleaseConfig } from
  "../lib/commerce/backblaze-downloads";

const accountId = opaqueId("account:test:download", "account");
const workspaceId = opaqueId("workspace:test:download", "workspace");
const releaseId = opaqueId("release:test:001", "release");
const now = 1_800_000_000_000;
const grantConfig = {
  secret: "protected-download-test-secret-at-least-32-bytes",
  ttlMs: 300_000,
  applicationOrigin: "https://gummyui.dev",
};
const release = {
  releaseId: "release:test:001",
  entitlementId: "entitlement:test:001",
  productRef: "gummy-ui-pro-blocks",
  version: "1.0.0",
  storageKey: "releases/v1.0.0/blocks.zip",
  checksumSha256: "b".repeat(64),
  sizeBytes: 2_048,
};

describe("Convex and Backblaze protected release boundary", () => {
  beforeEach(() => {
    convexMock.authorized = true;
    convexMock.consumable = true;
    convexMock.execute.mockReset();
    convexMock.execute.mockImplementation((operation: string) => {
      if (operation === "downloads.find-authorized") {
        return Promise.resolve(convexMock.authorized ? release : null);
      }
      if (operation === "downloads.consume") {
        return Promise.resolve(convexMock.consumable ? release : null);
      }
      return Promise.resolve(null);
    });
  });

  it("requires bounded same-origin grant configuration", () => {
    expect(readDownloadGrantConfig({})).toBeNull();
    expect(
      readDownloadGrantConfig({
        DOWNLOAD_GRANT_SECRET:
          "protected-download-test-secret-at-least-32-bytes",
        DOWNLOAD_GRANT_TTL_SECONDS: "300",
        GUMMYUI_ORIGIN: "https://gummyui.dev",
      }),
    ).toEqual(grantConfig);
    expect(() =>
      readDownloadGrantConfig({
        DOWNLOAD_GRANT_SECRET: "short",
        GUMMYUI_ORIGIN: "https://gummyui.dev",
      })).toThrow("Invalid protected download configuration");
    expect(() =>
      readDownloadGrantConfig({
        DOWNLOAD_GRANT_SECRET:
          "protected-download-test-secret-at-least-32-bytes",
        DOWNLOAD_GRANT_TTL_SECONDS: "901",
        GUMMYUI_ORIGIN: "https://gummyui.dev",
      })).toThrow("Invalid protected download configuration");
  });

  it("accepts only the private Backblaze S3 endpoint shape", () => {
    expect(readBackblazeReleaseConfig({})).toBeNull();
    expect(
      readBackblazeReleaseConfig({
        BACKBLAZE_B2_ENDPOINT:
          "https://s3.eu-central-003.backblazeb2.com",
        BACKBLAZE_B2_REGION: "eu-central-003",
        BACKBLAZE_B2_BUCKET: "gummyui-pro-releases",
        BACKBLAZE_B2_KEY_ID: "001234567890abcdef",
        BACKBLAZE_B2_APPLICATION_KEY:
          "K001234567890abcdefghijklmnop",
      }),
    ).toMatchObject({
      endpoint: "https://s3.eu-central-003.backblazeb2.com",
      region: "eu-central-003",
      bucket: "gummyui-pro-releases",
    });
    expect(() =>
      readBackblazeReleaseConfig({
        BACKBLAZE_B2_ENDPOINT: "https://s3.attacker.example",
        BACKBLAZE_B2_REGION: "eu-central-003",
        BACKBLAZE_B2_BUCKET: "gummyui-pro-releases",
        BACKBLAZE_B2_KEY_ID: "001234567890abcdef",
        BACKBLAZE_B2_APPLICATION_KEY:
          "K001234567890abcdefghijklmnop",
      })).toThrow("Invalid Backblaze release configuration");
  });

  it("issues a one-use grant only after Convex rechecks entitlement", async () => {
    const grant = await issueAuthorizedDownloadGrant({
      accountId,
      workspaceId,
      role: "owner",
      releaseId,
      now,
      config: grantConfig,
    });
    expect(grant?.path).toMatch(/^\/downloads\/[^/]+\.[^/]+$/u);
    expect(grant?.path).not.toContain("releases/v1.0.0");
    expect(convexMock.execute).toHaveBeenNthCalledWith(
      1,
      "downloads.find-authorized",
      expect.objectContaining({ accountId, workspaceId, releaseId }),
    );
    expect(convexMock.execute).toHaveBeenNthCalledWith(
      2,
      "downloads.register",
      expect.objectContaining({
        accountId,
        workspaceId,
        releaseId,
        entitlementId: "entitlement:test:001",
      }),
    );
  });

  it("returns no grant without a current release entitlement", async () => {
    convexMock.authorized = false;
    await expect(
      issueAuthorizedDownloadGrant({
        accountId,
        workspaceId,
        role: "owner",
        releaseId,
        now,
        config: grantConfig,
      }),
    ).resolves.toBeNull();
  });

  it("rechecks access and consumes the nonce in one Convex mutation", async () => {
    const grant = await issueAuthorizedDownloadGrant({
      accountId,
      workspaceId,
      role: "owner",
      releaseId,
      now,
      config: grantConfig,
    });
    const token = grant!.path.slice("/downloads/".length);
    await expect(
      consumeAuthorizedRelease({
        token,
        accountId,
        workspaceId,
        role: "owner",
        sessionExpiresAt: now + 600_000,
        now: now + 1_000,
        secret: grantConfig.secret,
      }),
    ).resolves.toMatchObject(release);
    expect(convexMock.execute).toHaveBeenCalledWith(
      "downloads.consume",
      expect.objectContaining({
        accountId,
        workspaceId,
        releaseId,
        entitlementId: "entitlement:test:001",
        nonceHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
      }),
    );
  });
});
