import { components } from "../../data/catalogue";
import { evaluateCommerceHealth } from "../../../lib/commerce/health-readiness";
import { emitOperationalEvent } from "../../../lib/commerce/operational-logging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const commerce = await evaluateCommerceHealth();
  const degraded = commerce.readiness === "unavailable";
  if (degraded) {
    await emitOperationalEvent({
      name: "health.readiness.degraded",
      severity: "error",
      outcome: "degraded",
      attributes: {
        commerceMode: commerce.mode,
        dependency: "commerce",
      },
    });
  }
  return Response.json(
    {
      status: degraded ? "degraded" : "ok",
      service: "gummyui-public",
      catalogueEntries: components.length,
      registrySchema: "https://ui.shadcn.com/schema/registry.json",
      commerce,
    },
    {
      status: degraded ? 503 : 200,
      headers: {
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    },
  );
}
