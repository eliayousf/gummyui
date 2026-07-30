import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  attestStripeSandboxApplication,
  readStripeSandboxAttestationConfig,
} from "../lib/commerce/stripe-sandbox-attestation";
import {
  POST as attestationPost,
} from "../app/api/internal/stripe-sandbox-attestation/route";

const targetUrl = "https://isolated-sandbox.convex.cloud";
const targetServerSecret = "target-server-secret-".padEnd(40, "x");
const restoreSecret = "restore-secret-".padEnd(40, "y");

describe("Stripe sandbox application attestation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("is absent unless explicitly enabled and refuses production", () => {
    expect(readStripeSandboxAttestationConfig({
      STRIPE_SANDBOX_ATTESTATION_ENABLED: "false",
    })).toBeNull();
    expect(() => readStripeSandboxAttestationConfig({
      ...readyEnvironment(),
      NODE_ENV: "production",
    })).toThrow("unavailable in production");
  });

  it("keeps the internal route absent without explicit local enablement", async () => {
    const previous = process.env.STRIPE_SANDBOX_ATTESTATION_ENABLED;
    delete process.env.STRIPE_SANDBOX_ATTESTATION_ENABLED;
    try {
      const response = await attestationPost(new Request(
        "https://gummyui.dev/api/internal/stripe-sandbox-attestation",
        {
          method: "POST",
          body: "{}",
          headers: { "content-type": "application/json" },
        },
      ));
      expect(response.status).toBe(404);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
    } finally {
      if (previous === undefined) {
        delete process.env.STRIPE_SANDBOX_ATTESTATION_ENABLED;
      } else {
        process.env.STRIPE_SANDBOX_ATTESTATION_ENABLED = previous;
      }
    }
  });

  it("requires the app to use the exact isolated target credentials", () => {
    expect(() => readStripeSandboxAttestationConfig({
      ...readyEnvironment(),
      NEXT_PUBLIC_CONVEX_URL: "https://production.convex.cloud",
    })).toThrow("Invalid Stripe sandbox attestation configuration");
    expect(() => readStripeSandboxAttestationConfig({
      ...readyEnvironment(),
      CONVEX_SERVER_SECRET: "different-secret".padEnd(40, "z"),
    })).toThrow("Invalid Stripe sandbox attestation configuration");
  });

  it("proves the isolated target and seeded synthetic identity", async () => {
    const config = readStripeSandboxAttestationConfig(readyEnvironment());
    expect(config).not.toBeNull();
    const probe = {
      attest: vi.fn(async () => ({
        targetClass: "isolated-test",
        schemaVersion: "2026-07-27",
        tableCount: 24,
        phase: "identity",
        identityReady: true,
      })),
    };

    await expect(attestStripeSandboxApplication(config!, {
      challenge: "a".repeat(64),
      phase: "identity",
      accountId: "account:restore-query-proof-20260728",
      workspaceId: "workspace:restore-query-proof-20260728",
    }, probe)).resolves.toMatchObject({
      challenge: "a".repeat(64),
      targetClass: "isolated-test",
      identityReady: true,
    });
  });

  it("requires exact access grant and revocation evidence", async () => {
    const config = readStripeSandboxAttestationConfig(readyEnvironment())!;
    const probe = {
      attest: vi.fn(async (
        input: { phase: "identity" | "access-granted" | "access-revoked" },
      ) => ({
        targetClass: "isolated-test",
        schemaVersion: "2026-07-27",
        tableCount: 24,
        phase: input.phase,
        identityReady: true,
        exactPurchaseCount: 2,
        exactLicenceCount: 6,
        exactEntitlementCount: 6,
        exactSeatCount: 6,
        openGrantCount: 0,
        protectedReleaseAvailable: true,
        protectedReleaseAuthorized: input.phase === "access-granted",
        accessGranted: input.phase === "access-granted",
        accessRevoked: input.phase === "access-revoked",
      })),
    };

    await expect(attestStripeSandboxApplication(config, {
      challenge: "b".repeat(64),
      phase: "access-granted",
      accountId: "account:sandbox-test",
      workspaceId: "workspace:sandbox-test",
      checkoutSessionIds: ["cs_test_monthly", "cs_test_lifetime"],
    }, probe)).resolves.toMatchObject({
      accessGranted: true,
    });

    await expect(attestStripeSandboxApplication(config, {
      challenge: "c".repeat(64),
      phase: "access-revoked",
      accountId: "account:sandbox-test",
      workspaceId: "workspace:sandbox-test",
      checkoutSessionIds: ["cs_test_monthly", "cs_test_lifetime"],
    }, probe)).resolves.toMatchObject({
      accessRevoked: true,
    });

    probe.attest.mockResolvedValueOnce({
      targetClass: "isolated-test",
      schemaVersion: "2026-07-27",
      tableCount: 24,
      phase: "access-revoked",
      identityReady: true,
      exactPurchaseCount: 2,
      exactLicenceCount: 6,
      exactEntitlementCount: 6,
      exactSeatCount: 6,
      openGrantCount: 1,
      protectedReleaseAvailable: true,
      protectedReleaseAuthorized: false,
      accessGranted: false,
      accessRevoked: true,
    });
    await expect(attestStripeSandboxApplication(config, {
      challenge: "d".repeat(64),
      phase: "access-revoked",
      accountId: "account:sandbox-test",
      workspaceId: "workspace:sandbox-test",
      checkoutSessionIds: ["cs_test_monthly", "cs_test_lifetime"],
    }, probe)).rejects.toThrow("access was not revoked");
  });

  it("rejects an oversized streamed body even with a false length header", async () => {
    const previous = Object.fromEntries(
      Object.keys(readyEnvironment()).map((key) => [key, process.env[key]]),
    );
    Object.assign(process.env, readyEnvironment());
    try {
      const response = await attestationPost(new Request(
        "http://127.0.0.1:3000/api/internal/stripe-sandbox-attestation",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "content-length": "1",
          },
          body: JSON.stringify({ padding: "x".repeat(4_096) }),
        },
      ));
      expect(response.status).toBe(400);
    } finally {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
});

function readyEnvironment(): Record<string, string> {
  return {
    STRIPE_SANDBOX_ATTESTATION_ENABLED: "true",
    NODE_ENV: "test",
    GUMMYUI_ORIGIN: "http://127.0.0.1:3000",
    NEXT_PUBLIC_CONVEX_URL: targetUrl,
    CONVEX_SERVER_SECRET: targetServerSecret,
    BACKUP_RESTORE_TARGET_CONVEX_URL: targetUrl,
    BACKUP_RESTORE_TARGET_SERVER_SECRET: targetServerSecret,
    BACKUP_RESTORE_SECRET: restoreSecret,
    BACKUP_RESTORE_TARGET_CLASS: "isolated-test",
    STRIPE_RESTRICTED_KEY: `rk_test_${"r".repeat(24)}`,
    STRIPE_WEBHOOK_ENABLED: "true",
    STRIPE_CHECKOUT_ENABLED: "false",
  };
}
