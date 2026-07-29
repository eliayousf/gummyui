import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const readiness = vi.hoisted(() => ({
  emit: vi.fn(async () => undefined),
  failureCode: vi.fn(() => "provider_unavailable"),
  verify: vi.fn(),
}));

vi.mock("../lib/commerce/stripe-production-readiness", () => ({
  stripeReadinessFailureCode: readiness.failureCode,
  verifyStripeProductionReadiness: readiness.verify,
}));
vi.mock("../lib/commerce/operational-logging", () => ({
  emitOperationalEvent: readiness.emit,
}));

import { GET } from "../app/api/cron/stripe-readiness/route";

const secret = "stripe-readiness-cron-secret".padEnd(32, "x");
const previousCronSecret = process.env.CRON_SECRET;

describe("Stripe production readiness cron", () => {
  afterAll(() => {
    if (previousCronSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = previousCronSecret;
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    readiness.failureCode.mockReturnValue("provider_unavailable");
    process.env.CRON_SECRET = secret;
    readiness.verify.mockResolvedValue({
      status: "ready",
      credential: "restricted-live",
      checkout: "disabled",
      verifiedPrices: 9,
    });
  });

  it("is indistinguishable without the cron credential", async () => {
    const response = await GET(
      new Request("https://gummyui.dev/api/cron/stripe-readiness"),
    );
    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(readiness.verify).not.toHaveBeenCalled();
  });

  it("returns only redacted readiness evidence", async () => {
    const response = await GET(request());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      status: "ready",
      credential: "restricted-live",
      checkout: "disabled",
      verifiedPrices: 9,
    });
    expect(readiness.emit).toHaveBeenCalledWith({
      name: "stripe.production.readiness",
      severity: "info",
      outcome: "success",
      attributes: {
        credential: "restricted-live",
        checkout: "disabled",
        verifiedPrices: 9,
      },
    });
  });

  it("fails closed without leaking a provider error", async () => {
    readiness.verify.mockRejectedValueOnce(
      new Error("provider diagnostic containing a credential"),
    );
    const response = await GET(request());
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "provider_unavailable",
    });
    expect(readiness.emit).toHaveBeenCalledWith({
      name: "stripe.production.readiness",
      severity: "error",
      outcome: "failure",
      attributes: { reason: "provider_unavailable" },
    });
  });

  it("records only an allowlisted configuration failure code", async () => {
    readiness.verify.mockRejectedValueOnce(new Error("sensitive detail"));
    readiness.failureCode.mockReturnValueOnce("restricted_key_unavailable");
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(readiness.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        attributes: { reason: "restricted_key_unavailable" },
      }),
    );
  });
});

function request(): Request {
  return new Request("https://gummyui.dev/api/cron/stripe-readiness", {
    headers: { authorization: `Bearer ${secret}` },
  });
}
