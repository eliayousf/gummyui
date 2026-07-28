import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { handleAuth } = vi.hoisted(() => ({
  handleAuth: vi.fn(() => vi.fn()),
}));

vi.mock("@workos-inc/authkit-nextjs", () => ({
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
  readWorkOSIdentityConfig: vi.fn(),
}));

describe("WorkOS callback route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
