import { readFile } from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const enforceDistributedRateLimit = vi.hoisted(() => vi.fn());
const createHostedCheckout = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("../lib/commerce/server-access", () => ({
  resolveServerAccountAccess: vi.fn(async () => ({
    status: "authenticated",
    accountId: "account:test",
    workspaceId: "workspace:test",
    workspaceLabel: "Test",
    role: "owner",
    sessionExpiresAt: 1_900_000_000_000,
  })),
}));
vi.mock("../lib/commerce/rate-limit", async (importOriginal) => ({
  ...await importOriginal<typeof import("../lib/commerce/rate-limit")>(),
  enforceDistributedRateLimit,
}));
vi.mock("../lib/commerce/stripe-managed-payments", () => ({
  readStripeManagedPaymentsConfig: vi.fn(() => ({
    applicationOrigin: "https://gummyui.dev",
  })),
  createStripeManagedPaymentsService: vi.fn(() => ({
    createHostedCheckout,
  })),
}));

import { POST as checkoutPost } from "../app/api/checkout/route";

describe("distributed rate limits on customer routes", () => {
  const previousCheckout = process.env.STRIPE_CHECKOUT_ENABLED;

  beforeEach(() => {
    enforceDistributedRateLimit.mockReset();
    createHostedCheckout.mockReset();
    process.env.STRIPE_CHECKOUT_ENABLED = "true";
  });

  afterAll(() => {
    if (previousCheckout === undefined) {
      delete process.env.STRIPE_CHECKOUT_ENABLED;
    } else {
      process.env.STRIPE_CHECKOUT_ENABLED = previousCheckout;
    }
  });

  it("returns 429/no-store before creating a Stripe checkout", async () => {
    enforceDistributedRateLimit.mockResolvedValue({
      allowed: false,
      reason: "limited",
      retryAfterMs: 60_000,
      resetAt: 1_800_000_060_000,
    });
    const response = await checkoutPost(checkoutRequest());
    expect(response.status).toBe(429);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("retry-after")).toBe("60");
    expect(createHostedCheckout).not.toHaveBeenCalled();
    expect(enforceDistributedRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        policy: "checkout.create",
        accountId: "account:test",
        workspaceId: "workspace:test",
      }),
    );
  });

  it("returns 503/no-store when the distributed backend is missing", async () => {
    enforceDistributedRateLimit.mockResolvedValue({
      allowed: false,
      reason: "unavailable",
    });
    const response = await checkoutPost(checkoutRequest());
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.has("retry-after")).toBe(false);
    expect(createHostedCheckout).not.toHaveBeenCalled();
  });

  it("covers every abusive customer-controlled operation but no webhook", async () => {
    const routes: Array<[string, string]> = [
      ["app/api/checkout/route.ts", "checkout.create"],
      ["app/api/download-grants/route.ts", "download.grant"],
      ["app/downloads/[grant]/route.ts", "download.consume"],
      ["app/api/team/workspaces/route.ts", "team.workspace"],
      ["app/api/team/invitations/route.ts", "team.invitation"],
      ["app/api/team/switch/route.ts", "team.switch"],
      ["app/api/privacy/exports/route.ts", "privacy.export.request"],
      [
        "app/api/privacy/exports/[exportId]/route.ts",
        "privacy.export.download",
      ],
      ["app/api/privacy/deletions/route.ts", "privacy.deletion.request"],
      [
        "app/api/privacy/deletions/[deletionId]/route.ts",
        "privacy.deletion.cancel",
      ],
      ["app/auth/sign-in/route.ts", "auth.sign_in"],
      ["app/auth/callback/route.ts", "auth.callback"],
      ["app/api/billing-portal/route.ts", "billing.portal"],
    ];
    for (const [file, policy] of routes) {
      expect(await read(file)).toContain(`policy: "${policy}"`);
    }
    for (const file of [
      "app/api/webhooks/stripe/route.ts",
      "app/api/webhooks/workos/route.ts",
      "app/api/webhooks/resend/route.ts",
    ]) {
      expect(await read(file)).not.toContain("enforceDistributedRateLimit");
    }
  });

  it("switches organization sessions only through a CSRF-checked POST", async () => {
    const source = await read("app/api/team/switch/route.ts");
    expect(source).toContain("export async function POST");
    expect(source).not.toContain("export async function GET");
    expect(source).toContain(
      'request.headers.get("origin") !== config.applicationOrigin',
    );
    expect(source).toContain('revalidationStrategy: "none"');
  });
});

function checkoutRequest(): Request {
  return new Request("https://gummyui.dev/api/checkout", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://gummyui.dev",
      "x-vercel-forwarded-for": "203.0.113.8",
    },
    body: JSON.stringify({
      planId: "individual-monthly",
      requestId: "request:browser:0001",
      immediateSupplyRequested: true,
      cancellationLossAcknowledged: true,
    }),
  });
}

function read(relativePath: string): Promise<string> {
  return readFile(path.join(process.cwd(), relativePath), "utf8");
}
