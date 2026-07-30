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
      restoreStatus: vi.fn(async () => ({
        targetClass: "isolated-test",
        schemaVersion: "2026-07-27",
        tableCount: 24,
      })),
      accountSection: vi.fn(async () => [
        { status: "active" },
        { status: "active" },
        { status: "active" },
      ]),
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

  it("requires both licences and protected downloads to be revoked", async () => {
    const config = readStripeSandboxAttestationConfig(readyEnvironment())!;
    const probe = {
      restoreStatus: vi.fn(async () => ({
        targetClass: "isolated-test",
        schemaVersion: "2026-07-27",
        tableCount: 24,
      })),
      accountSection: vi.fn(async ({ route }: { route: string }) => {
        if (route === "security") return [{}, {}, {}];
        if (route === "purchases") {
          return [{
            id: "purchase:stripe:cs_test_monthly",
            detail: "Completed · 30 Jul 2026",
          }, {
            id: "purchase:stripe:cs_test_lifetime",
            detail: "Refunded · 30 Jul 2026",
          }];
        }
        if (route === "licences") {
          return [{ value: "Refunded", status: "revoked" }];
        }
        if (route === "downloads") return [];
        return [];
      }),
    };

    await expect(attestStripeSandboxApplication(config, {
      challenge: "b".repeat(64),
      phase: "access-revoked",
      accountId: "account:sandbox-test",
      workspaceId: "workspace:sandbox-test",
      checkoutSessionIds: ["cs_test_monthly", "cs_test_lifetime"],
    }, probe)).resolves.toMatchObject({
      accessRevoked: true,
    });

    probe.accountSection.mockImplementation(async ({ route }) => {
      if (route === "security") return [{}, {}, {}];
      if (route === "purchases") {
        return [{
          id: "purchase:stripe:cs_test_monthly",
          detail: "Completed · 30 Jul 2026",
        }, {
          id: "purchase:stripe:cs_test_lifetime",
          detail: "Refunded · 30 Jul 2026",
        }];
      }
      if (route === "licences") {
        return [{ value: "Active", status: "active" }];
      }
      return [];
    });
    await expect(attestStripeSandboxApplication(config, {
      challenge: "c".repeat(64),
      phase: "access-revoked",
      accountId: "account:sandbox-test",
      workspaceId: "workspace:sandbox-test",
      checkoutSessionIds: ["cs_test_monthly", "cs_test_lifetime"],
    }, probe)).rejects.toThrow("access was not revoked");
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
