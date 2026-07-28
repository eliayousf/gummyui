import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@workos-inc/node";

const executeConvex = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("../db", () => ({ executeConvex }));

import {
  buildWorkOSIdentityProjection,
  ConvexWorkOSIdentityStore,
  normalizeWorkOSRole,
  readWorkOSIdentityConfig,
  workOSAccountId,
  workOSWorkspaceId,
} from "../lib/commerce/workos-identity";

const baseEnvironment = {
  WORKOS_CLIENT_ID: "client_123456789",
  WORKOS_API_KEY: "sk_test_aaaaaaaa",
  WORKOS_COOKIE_PASSWORD: "a".repeat(32),
  WORKOS_REDIRECT_URI:
    "https://gummyui.dev/auth/callback",
  NEXT_PUBLIC_WORKOS_REDIRECT_URI:
    "https://gummyui.dev/auth/callback",
  GUMMYUI_ORIGIN: "https://gummyui.dev",
};

const workOSUser = {
  id: "user_123456789",
  email: " Customer@Example.com ",
  name: "Gummy Customer",
  locale: "en-GB",
} as unknown as User;

describe("WorkOS identity boundary", () => {
  beforeEach(() => {
    executeConvex.mockReset();
  });

  it("accepts only a complete same-origin callback configuration", () => {
    expect(readWorkOSIdentityConfig(baseEnvironment)).toMatchObject({
      clientId: "client_123456789",
      redirectUri: "https://gummyui.dev/auth/callback",
      applicationOrigin: "https://gummyui.dev",
    });
    expect(
      readWorkOSIdentityConfig({
        ...baseEnvironment,
        WORKOS_API_KEY: undefined,
      }),
    ).toBeNull();
    expect(() =>
      readWorkOSIdentityConfig({
        ...baseEnvironment,
        WORKOS_REDIRECT_URI:
          "https://attacker.example/auth/callback",
      }),
    ).toThrow("Invalid WorkOS redirect URI");
    expect(() =>
      readWorkOSIdentityConfig({
        ...baseEnvironment,
        NEXT_PUBLIC_WORKOS_REDIRECT_URI:
          "https://www.gummyui.dev/auth/callback",
      }),
    ).toThrow("Invalid WorkOS redirect URI");
    expect(() =>
      readWorkOSIdentityConfig({
        ...baseEnvironment,
        WORKOS_COOKIE_PASSWORD: "too-short",
      }),
    ).toThrow("Invalid WorkOS server configuration");
  });

  it("derives stable opaque account and personal workspace identifiers", () => {
    expect(workOSAccountId(workOSUser.id)).toBe(
      workOSAccountId(workOSUser.id),
    );
    expect(workOSAccountId(workOSUser.id)).toMatch(/^account:/u);
    expect(workOSWorkspaceId(workOSUser.id)).toMatch(/^workspace:/u);
    expect(workOSWorkspaceId(workOSUser.id)).not.toBe(
      workOSWorkspaceId(workOSUser.id, "org_123456789"),
    );
  });

  it("maps provider roles conservatively", () => {
    expect(normalizeWorkOSRole("owner")).toBe("owner");
    expect(normalizeWorkOSRole("admin")).toBe("admin");
    expect(normalizeWorkOSRole("billing")).toBe("billing");
    expect(normalizeWorkOSRole("viewer")).toBe("viewer");
    expect(normalizeWorkOSRole("unknown-provider-role")).toBe("member");
  });

  it("builds a privacy-minimised personal identity projection", async () => {
    const projection = await buildWorkOSIdentityProjection({
      user: workOSUser,
      now: 1_800_000_000_000,
    });

    expect(projection).toMatchObject({
      userId: "user_123456789",
      organizationId: null,
      providerMembershipId: null,
      displayName: "Gummy Customer",
      locale: "en-GB",
      workspaceLabel: "Personal workspace",
      role: "owner",
      currentSince: 1_800_000_000_000,
    });
    expect(projection.emailHash).toMatch(/^[a-f0-9]{64}$/u);
    expect(projection.emailHash).not.toContain("customer@example.com");
  });

  it("provisions account, profile, workspace and membership atomically", async () => {
    const projection = await buildWorkOSIdentityProjection({
      user: workOSUser,
      organizationId: "org_123456789",
      organizationName: "Design team",
      providerMembershipId: "om_123456789",
      role: "admin",
      now: 1_800_000_000_000,
    });

    executeConvex.mockResolvedValue(null);
    await new ConvexWorkOSIdentityStore().provision(projection);
    expect(executeConvex).toHaveBeenCalledWith(
      "workos.identity.provision",
      projection,
    );
    expect(JSON.stringify(executeConvex.mock.calls))
      .not.toContain("Customer@Example.com");
  });

  it("resolves access only when the local active role matches WorkOS", async () => {
    executeConvex.mockResolvedValueOnce({
      status: "authenticated",
      accountId: "account:workos:user_123456789",
      workspaceId: "workspace:workos:org_123456789",
      role: "admin",
      workspaceLabel: "Design team",
      sessionExpiresAt: 1_900_000_000_000,
    });
    await expect(
      new ConvexWorkOSIdentityStore().resolve({
        userId: workOSUser.id,
        organizationId: "org_123456789",
        providerRole: "admin",
        sessionExpiresAt: 1_900_000_000_000,
      }),
    ).resolves.toMatchObject({
      status: "authenticated",
      workspaceLabel: "Design team",
      role: "admin",
    });

    executeConvex.mockResolvedValueOnce(null);
    await expect(
      new ConvexWorkOSIdentityStore().resolve({
        userId: workOSUser.id,
        organizationId: "org_123456789",
        providerRole: "admin",
        sessionExpiresAt: 1_900_000_000_000,
      }),
    ).resolves.toBeNull();
  });
});
