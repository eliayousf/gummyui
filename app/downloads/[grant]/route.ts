import { BackblazeReleaseStore, readBackblazeReleaseConfig } from
  "../../../lib/commerce/backblaze-downloads";
import {
  consumeAuthorizedRelease,
  readDownloadGrantConfig,
} from "../../../lib/commerce/convex-downloads";
import { resolveServerAccountAccess } from
  "../../../lib/commerce/server-access";
import {
  distributedRateLimitResponse,
  enforceDistributedRateLimit,
} from "../../../lib/commerce/rate-limit";

export const runtime = "nodejs";

const PRIVATE_HEADERS = {
  "cache-control": "private, no-store",
  "content-type": "application/json; charset=utf-8",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow, noarchive",
} as const;

export async function GET(
  request: Request,
  context?: { params: Promise<{ grant: string }> },
) {
  if (!context) {
    return unavailableDownloadResponse();
  }
  const access = await resolveServerAccountAccess({
    requireFreshMembership: true,
  });
  if (access.status !== "authenticated") {
    return unavailableDownloadResponse();
  }
  let grantConfig;
  let storageConfig;
  try {
    grantConfig = readDownloadGrantConfig();
    storageConfig = readBackblazeReleaseConfig();
  } catch {
    return unavailableDownloadResponse();
  }
  if (!grantConfig || !storageConfig) {
    return unavailableDownloadResponse();
  }

  try {
    const { grant } = await context.params;
    const rateLimit = await enforceDistributedRateLimit({
      policy: "download.consume",
      request,
      accountId: access.accountId,
      workspaceId: access.workspaceId,
    });
    if (!rateLimit.allowed) {
      return distributedRateLimitResponse(rateLimit);
    }
    const release = await consumeAuthorizedRelease({
      token: grant,
      accountId: access.accountId,
      workspaceId: access.workspaceId,
      role: access.role,
      sessionExpiresAt: access.sessionExpiresAt,
      now: Date.now(),
      secret: grantConfig.secret,
    });
    if (!release) {
      return unavailableDownloadResponse();
    }
    const object = await new BackblazeReleaseStore(storageConfig).get(
      release,
    );
    const filename =
      `${release.productRef}-${release.version}.zip`;
    return new Response(object.body, {
      status: 200,
      headers: {
        "cache-control": "private, no-store",
        "content-type": "application/zip",
        "content-length": String(object.contentLength),
        "content-disposition": `attachment; filename="${filename}"`,
        "content-digest":
          `sha-256=:${hexToBase64(object.checksumSha256)}:`,
        "x-content-type-options": "nosniff",
        "x-robots-tag": "noindex, nofollow, noarchive",
      },
    });
  } catch {
    return unavailableDownloadResponse();
  }
}

export function unavailableDownloadResponse(): Response {
  return Response.json(
    { error: "not_found_or_forbidden" },
    { status: 404, headers: PRIVATE_HEADERS },
  );
}

function hexToBase64(value: string): string {
  return Buffer.from(value, "hex").toString("base64");
}
