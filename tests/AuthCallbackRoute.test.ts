import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  CallbackError,
  handleAuth,
  readWorkOSIdentityConfig,
} = vi.hoisted(() => {
  class MockCallbackError extends Error {}
  return {
    CallbackError: MockCallbackError,
    handleAuth: vi.fn(() => vi.fn()),
    readWorkOSIdentityConfig: vi.fn(),
  };
});

vi.mock("@workos-inc/authkit-nextjs", () => ({
  CallbackError,
  getTokenClaims: vi.fn(),
  getWorkOS: vi.fn(),
  handleAuth,
}));

vi.mock("../lib/commerce/rate-limit", () => ({
  distributedRateLimitResponse: vi.fn(),
  enforceDistributedRateLimit: vi.fn(async () => ({
    allowed: true,
    source: "convex",
  })),
}));

vi.mock("../lib/commerce/workos-identity", () => ({
  buildWorkOSIdentityProjection: vi.fn(),
  ConvexWorkOSIdentityStore: vi.fn(),
  readWorkOSIdentityConfig,
}));

describe("WorkOS callback route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readWorkOSIdentityConfig.mockReturnValue({
      applicationOrigin: "https://gummyui.dev",
    });
  });

  it.each([
    "https://gummyui.dev/auth/callback",
    "https://gummyui.dev/auth/callback?code=",
    "https://gummyui.dev/auth/callback?error=",
    "https://gummyui.dev/auth/callback?code=%20%20&error=%20",
    "https://gummyui.dev/auth/callback?code=authorization-code",
    "https://gummyui.dev/auth/callback?error=access_denied",
    "https://gummyui.dev/auth/callback?error=access_denied&state=callback-state",
    "https://gummyui.dev/auth/callback?state=callback-state",
  ])("rejects a callback without a non-empty authorization result: %s", async (url) => {
    const { GET } = await import("../app/auth/callback/route");
    const response = await GET(new NextRequest(url));

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual({
      error: "invalid_auth_callback",
    });
    expect(handleAuth).not.toHaveBeenCalled();
  });

  it("maps a rejected AuthKit callback to a hardened 400 response", async () => {
    handleAuth.mockImplementationOnce((options) => async (request) => (
      options.onError?.({
        error: new CallbackError("OAuth state mismatch"),
        request,
      })
    ));
    const { GET } = await import("../app/auth/callback/route");
    const response = await GET(new NextRequest(
      "https://gummyui.dev/auth/callback?code=invalid-code&state=invalid-state",
    ));

    expect(response?.status).toBe(400);
    expect(response?.headers.get("cache-control")).toBe("private, no-store");
    expect(response?.headers.get("x-robots-tag")).toBe(
      "noindex, nofollow, noarchive",
    );
    await expect(response?.json()).resolves.toEqual({
      error: "invalid_auth_callback",
    });
  });

  it("keeps unexpected callback failures distinct and retryable", async () => {
    handleAuth.mockImplementationOnce((options) => async (request) => (
      options.onError?.({
        error: new Error("provider unavailable"),
        request,
      })
    ));
    const { GET } = await import("../app/auth/callback/route");
    const response = await GET(new NextRequest(
      "https://gummyui.dev/auth/callback?code=authorization-code&state=callback-state",
    ));

    expect(response?.status).toBe(503);
    expect(response?.headers.get("cache-control")).toBe("private, no-store");
    await expect(response?.json()).resolves.toEqual({
      error: "service_unavailable",
    });
  });
});
