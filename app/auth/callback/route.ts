import {
  getTokenClaims,
  getWorkOS,
  handleAuth,
} from "@workos-inc/authkit-nextjs";
import type { NextRequest } from "next/server";
import {
  buildWorkOSIdentityProjection,
  ConvexWorkOSIdentityStore,
  readWorkOSIdentityConfig,
} from "../../../lib/commerce/workos-identity";
import {
  distributedRateLimitResponse,
  enforceDistributedRateLimit,
} from "../../../lib/commerce/rate-limit";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const rateLimit = await enforceDistributedRateLimit({
    policy: "auth.callback",
    request,
  });
  if (!rateLimit.allowed) {
    return distributedRateLimitResponse(rateLimit);
  }
  let config;
  try {
    config = readWorkOSIdentityConfig();
  } catch {
    config = null;
  }
  if (!config) {
    return Response.json(
      { error: "service_unavailable" },
      {
        status: 503,
        headers: {
          "cache-control": "private, no-store",
          "x-content-type-options": "nosniff",
          "x-robots-tag": "noindex, nofollow, noarchive",
        },
      },
    );
  }

  return handleAuth({
    baseURL: config.applicationOrigin,
    returnPathname: "/account",
    onSuccess: async ({
      user,
      accessToken,
      organizationId,
    }) => {
      const claims = await getTokenClaims<{ role?: string }>(accessToken);
      let organizationName: string | undefined;
      let providerMembershipId: string | undefined;
      let currentSince: number | undefined;
      let role = typeof claims.role === "string"
        ? claims.role
        : undefined;
      if (organizationId) {
        const workos = getWorkOS();
        const [organization, memberships] = await Promise.all([
          workos.organizations.getOrganization(organizationId),
          workos.userManagement.listOrganizationMemberships({
            organizationId,
            userId: user.id,
            statuses: ["active"],
            limit: 10,
          }),
        ]);
        const membership = memberships.data.find(
          (candidate) =>
            candidate.organizationId === organizationId
            && candidate.userId === user.id
            && candidate.status === "active",
        );
        if (!membership) {
          throw new Error("WorkOS organization membership is unavailable");
        }
        organizationName = organization.name;
        providerMembershipId = membership.id;
        role ??= membership.role.slug;
        currentSince = Date.parse(membership.updatedAt);
        if (!Number.isFinite(currentSince)) {
          throw new Error("WorkOS membership timestamp is unavailable");
        }
      }
      const projection = await buildWorkOSIdentityProjection({
        user,
        organizationId,
        organizationName,
        providerMembershipId,
        role,
        now: currentSince,
      });
      await new ConvexWorkOSIdentityStore().provision(projection);
    },
  })(request);
}
