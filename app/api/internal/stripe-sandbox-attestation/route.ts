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

  let input: StripeSandboxAttestationInput;
  try {
    input = await readBoundedJson(request) as StripeSandboxAttestationInput;
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

async function readBoundedJson(request: Request): Promise<unknown> {
  if (!request.body) throw new Error("Missing request body");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > 4_096) {
        await reader.cancel();
        throw new Error("Request body is too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (byteLength === 0) throw new Error("Missing request body");
  const body = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
}

function privateJson(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: PRIVATE_HEADERS });
}
