import "server-only";
import type { ServerAccountAccess } from "./account";

/**
 * Production remains fail-closed until an approved identity adapter, session
 * verifier and current membership lookup are explicitly wired here.
 */
export async function resolveServerAccountAccess(): Promise<ServerAccountAccess> {
  return {
    status: "unavailable",
    reason: "provider_not_configured",
  };
}
