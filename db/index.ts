import "server-only";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

const executeCommerce = makeFunctionReference<
  "mutation",
  {
    serverSecret: string;
    operation: string;
    input: unknown;
  },
  unknown
>("commerce:execute");

export async function executeConvex<T>(
  operation: string,
  input: unknown,
): Promise<T> {
  const config = readConvexConfig();
  const client = new ConvexHttpClient(config.url, { logger: false });
  return await client.mutation(executeCommerce, {
    serverSecret: config.serverSecret,
    operation,
    input,
  }) as T;
}

export function readConvexConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): { url: string; serverSecret: string } {
  const urlValue = environment.NEXT_PUBLIC_CONVEX_URL?.trim();
  const serverSecret = environment.CONVEX_SERVER_SECRET?.trim();
  if (!urlValue && !serverSecret) {
    throw new Error("Convex is unavailable");
  }
  if (!urlValue || !serverSecret || serverSecret.length < 32) {
    throw new Error("Invalid Convex server configuration");
  }
  const url = new URL(urlValue);
  const local =
    url.hostname === "127.0.0.1" || url.hostname === "localhost";
  if (
    (url.protocol !== "https:" && !(local && url.protocol === "http:"))
    || url.pathname !== "/"
    || url.search
    || url.hash
    || url.username
    || url.password
    || (!local && !url.hostname.endsWith(".convex.cloud"))
  ) {
    throw new Error("Invalid Convex deployment URL");
  }
  return { url: url.origin, serverSecret };
}
