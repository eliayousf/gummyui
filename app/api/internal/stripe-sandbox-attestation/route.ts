import {
  attestStripeSandboxApplication,
  readStripeSandboxAttestationConfig,
  type StripeSandboxAttestationInput,
} from "../../../../lib/commerce/stripe-sandbox-attestation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIVATE_HEADERS = {
  "cache-control": "private, no-store",
  "content-type": "application/json; charset=utf-8",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow, noarchive",
} as const;

export async function POST(request: Request): Promise<Response> {
  let config;
  try {
    config = readStripeSandboxAttestationConfig();
  } catch {
    return privateJson({ error: "not_found" }, 404);
  }
  if (!config) return privateJson({ error: "not_found" }, 404);

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 4_096) {
    return privateJson({ error: "invalid_request" }, 400);
  }
  let input: StripeSandboxAttestationInput;
  try {
    input = await request.json() as StripeSandboxAttestationInput;
  } catch {
    return privateJson({ error: "invalid_request" }, 400);
  }
  try {
    return privateJson(
      await attestStripeSandboxApplication(config, input),
      200,
    );
  } catch {
    return privateJson({ error: "attestation_unavailable" }, 503);
  }
}

function privateJson(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: PRIVATE_HEADERS });
}
