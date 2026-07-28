import "server-only";
import {
  getTokenClaims,
  getWorkOS,
  withAuth,
} from "@workos-inc/authkit-nextjs";
import type { ServerAccountAccess } from "./account";
import {
  ConvexWorkOSIdentityStore,
  readWorkOSIdentityConfig,
} from "./workos-identity";

export async function resolveServerAccountAccess(
  options: { requireFreshMembership?: boolean } = {},
): Promise<ServerAccountAccess> {
  let config;
  try {
    config = readWorkOSIdentityConfig();
  } catch {
    return {
      status: "unavailable",
      reason: "service_unavailable",
    };
  }
  if (!config) {
    return {
      status: "unavailable",
      reason: "provider_not_configured",
    };
  }

  try {
    const auth = await withAuth();
    if (!auth.user) {
      return { status: "signed_out" };
    }
    const claims = await getTokenClaims<{ exp?: number }>(auth.accessToken);
    const sessionExpiresAt =
      typeof claims.exp === "number" ? claims.exp * 1000 : Number.NaN;
    if (
      !Number.isSafeInteger(sessionExpiresAt)
      || sessionExpiresAt <= Date.now()
    ) {
      return {
        status: "unavailable",
        reason: "service_unavailable",
      };
    }
    let providerRole = auth.role;
    let providerMembershipId: string | undefined;
    if (auth.organizationId && options.requireFreshMembership) {
      const memberships =
        await getWorkOS().userManagement.listOrganizationMemberships({
          organizationId: auth.organizationId,
          userId: auth.user.id,
          statuses: ["active"],
          limit: 10,
        });
      const membership = memberships.data.find(
        (candidate) =>
          candidate.organizationId === auth.organizationId
          && candidate.userId === auth.user!.id
          && candidate.status === "active",
      );
      if (!membership) {
        return {
          status: "unavailable",
          reason: "service_unavailable",
        };
      }
      providerRole = membership.role.slug;
      providerMembershipId = membership.id;
    }
    const access = await new ConvexWorkOSIdentityStore().resolve({
      userId: auth.user.id,
      organizationId: auth.organizationId,
      providerRole,
      providerMembershipId,
      sessionExpiresAt,
    });
    return access ?? {
      status: "unavailable",
      reason: "service_unavailable",
    };
  } catch {
    return {
      status: "unavailable",
      reason: "service_unavailable",
    };
  }
}
