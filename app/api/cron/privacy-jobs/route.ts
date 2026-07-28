import {
  PrivacyDeletionJob,
  readPrivacyDeletionJobConfig,
} from "../../../../lib/commerce/privacy-operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIVATE_HEADERS = {
  "cache-control": "private, no-store",
  "content-type": "application/json; charset=utf-8",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow, noarchive",
} as const;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (
    !secret
    || secret.length < 32
    || request.headers.get("authorization") !== `Bearer ${secret}`
  ) {
    return Response.json(
      { error: "not_found" },
      { status: 404, headers: PRIVATE_HEADERS },
    );
  }
  let config: ReturnType<typeof readPrivacyDeletionJobConfig>;
  try {
    config = readPrivacyDeletionJobConfig();
  } catch {
    return Response.json(
      { error: "service_unavailable" },
      { status: 503, headers: PRIVATE_HEADERS },
    );
  }
  if (!config) {
    return Response.json(
      { error: "service_unavailable" },
      { status: 503, headers: PRIVATE_HEADERS },
    );
  }
  try {
    const result = await new PrivacyDeletionJob(config).run();
    return Response.json(
      { ok: true, ...result },
      { status: 200, headers: PRIVATE_HEADERS },
    );
  } catch {
    return Response.json(
      { error: "worker_unavailable" },
      { status: 503, headers: PRIVATE_HEADERS },
    );
  }
}
