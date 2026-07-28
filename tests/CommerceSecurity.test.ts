import { describe, expect, it } from "vitest";
import {
  createCsrfToken,
  requireAllowedOrigin,
  scrubLogValue,
  serializeSecureCookie,
  verifyCsrfToken,
} from "../lib/commerce";

const secret = "csrf-local-test-secret-with-thirty-two-bytes";
const now = 1_800_000_000_000;

describe("commerce HTTP security primitives", () => {
  it("binds CSRF tokens to a session and expiry", async () => {
    const token = await createCsrfToken({
      sessionId: "session:opaque:001",
      now,
      ttlMs: 60_000,
      secret,
      nonceSource: () => new Uint8Array(18).fill(7),
    });
    await expect(
      verifyCsrfToken({
        token,
        sessionId: "session:opaque:001",
        now: now + 1,
        secret,
      }),
    ).resolves.toBe(true);
    await expect(
      verifyCsrfToken({
        token,
        sessionId: "session:other:999",
        now: now + 1,
        secret,
      }),
    ).resolves.toBe(false);
    await expect(
      verifyCsrfToken({
        token,
        sessionId: "session:opaque:001",
        now: now + 60_000,
        secret,
      }),
    ).resolves.toBe(false);
  });

  it("rejects a custom CSRF nonce with less than 128 bits", async () => {
    await expect(
      createCsrfToken({
        sessionId: "session:opaque:001",
        now,
        ttlMs: 60_000,
        secret,
        nonceSource: () => new Uint8Array(15),
      }),
    ).rejects.toThrow("at least 128 bits");
  });

  it("requires an allowlisted origin for unsafe requests", () => {
    expect(
      requireAllowedOrigin({
        method: "POST",
        originHeader: "https://gummyui.dev",
        allowedOrigins: ["https://gummyui.dev"],
      }),
    ).toEqual({ allowed: true });
    expect(
      requireAllowedOrigin({
        method: "POST",
        originHeader: "https://attacker.invalid",
        allowedOrigins: ["https://gummyui.dev"],
      }),
    ).toEqual({ allowed: false, reason: "origin_not_allowed" });
    expect(
      requireAllowedOrigin({
        method: "POST",
        originHeader: null,
        allowedOrigins: ["https://gummyui.dev"],
      }),
    ).toEqual({ allowed: false, reason: "missing_origin" });
  });

  it("serializes production cookies with secure browser controls", () => {
    expect(
      serializeSecureCookie({
        name: "__Host-session",
        value: "opaque-value",
        maxAgeSeconds: 3600,
        production: true,
        sameSite: "Strict",
      }),
    ).toBe(
      "__Host-session=opaque-value; Path=/; Max-Age=3600; HttpOnly; SameSite=Strict; Secure",
    );
    expect(() =>
      serializeSecureCookie({
        name: "bad name",
        value: "opaque-value",
        maxAgeSeconds: 3600,
        production: true,
      })).toThrow("Invalid cookie name");
  });

  it("scrubs secrets, personal data and signed download paths", () => {
    expect(
      scrubLogValue({
        authorization: "Bearer should-not-escape",
        nested: {
          email: "person@example.test",
          message:
            "failed for person@example.test at /downloads/opaque.token.signature?signature=secret",
        },
      }),
    ).toEqual({
      authorization: "[REDACTED]",
      nested: {
        email: "[REDACTED]",
        message:
          "failed for [REDACTED] at /downloads/[REDACTED]?signature=[REDACTED]",
      },
    });
  });
});
