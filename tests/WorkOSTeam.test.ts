import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User, WorkOS } from "@workos-inc/node";
import { opaqueId } from "../lib/commerce/model";

const executeConvex = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("../db", () => ({ executeConvex }));

import {
  isOrganizationWorkspace,
  WorkOSTeamService,
} from "../lib/commerce/workos-team";

const personalAccess = {
  status: "authenticated" as const,
  accountId: opaqueId(
    "account:workos:user_123456789",
    "account",
  ),
  workspaceId: opaqueId(
    "workspace:workos-personal:user_123456789",
    "workspace",
  ),
  workspaceLabel: "Personal workspace",
  role: "owner" as const,
  sessionExpiresAt: 1_900_000_000_000,
};

const organizationAccess = {
  ...personalAccess,
  workspaceId: opaqueId(
    "workspace:workos:org_123456789",
    "workspace",
  ),
  workspaceLabel: "Design team",
  role: "admin" as const,
};

const user = {
  id: "user_123456789",
  email: "owner@example.com",
  name: "Owner",
  locale: "en-GB",
} as unknown as User;

describe("WorkOS team operations", () => {
  beforeEach(() => {
    executeConvex.mockReset();
  });

  it("distinguishes personal and organization workspaces", () => {
    expect(isOrganizationWorkspace(personalAccess)).toBe(false);
    expect(isOrganizationWorkspace(organizationAccess)).toBe(true);
  });

  it("creates an organization, membership and local projection", async () => {
    const provision = vi.fn().mockResolvedValue(undefined);
    const workos = {
      organizations: {
        createOrganization: vi.fn().mockResolvedValue({
          id: "org_123456789",
          name: "Design team",
        }),
        deleteOrganization: vi.fn(),
      },
      userManagement: {
        createOrganizationMembership: vi.fn().mockResolvedValue({
          id: "om_123456789",
          organizationId: "org_123456789",
          userId: user.id,
          status: "active",
          updatedAt: "2027-01-15T12:00:00.000Z",
          role: { slug: "admin" },
        }),
      },
    } as unknown as WorkOS;
    const result = await new WorkOSTeamService(
      {
        apiKey: "test-only",
        applicationOrigin: "https://gummyui.dev",
      },
      workos,
      { provision } as never,
    ).createWorkspace({
      access: personalAccess,
      user,
      name: " Design   team ",
      requestId: "browser:1234567890abcdef",
    });

    expect(result).toEqual({
      organizationId: "org_123456789",
    });
    expect(provision).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "workspace:workos:org_123456789",
        workspaceLabel: "Design team",
        role: "admin",
      }),
    );
  });

  it("sends a privacy-minimised organization invitation", async () => {
    const workos = {
      userManagement: {
        sendInvitation: vi.fn().mockResolvedValue({
          id: "invitation_123456789",
          email: "teammate@example.com",
          state: "pending",
          acceptedAt: null,
          expiresAt: "2027-01-22T12:00:00.000Z",
          organizationId: "org_123456789",
          inviterUserId: user.id,
          acceptedUserId: null,
          roleSlug: "member",
          createdAt: "2027-01-15T12:00:00.000Z",
        }),
      },
    } as unknown as WorkOS;
    executeConvex.mockResolvedValue(null);

    await expect(
      new WorkOSTeamService(
        {
          apiKey: "test-only",
          applicationOrigin: "https://gummyui.dev",
        },
        workos,
      ).sendInvitation({
        access: organizationAccess,
        user,
        organizationId: "org_123456789",
        email: "teammate@example.com",
        now: 1_800_000_000_000,
      }),
    ).resolves.toMatchObject({
      id: "invitation:workos:invitation_123456789",
      status: "pending",
    });
    expect(executeConvex).toHaveBeenCalledWith(
      "workos.invitation.record",
      expect.objectContaining({
        workspaceId: "workspace:workos:org_123456789",
        invitedEmailHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
        invitationStatus: "pending",
      }),
    );
    expect(JSON.stringify(executeConvex.mock.calls))
      .not.toContain("teammate@example.com");
  });
});
