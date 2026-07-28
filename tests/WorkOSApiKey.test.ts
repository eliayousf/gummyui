import { describe, expect, it } from "vitest";
import { isValidWorkOSApiKey } from "../lib/commerce/workos-api-key";

describe("WorkOS API-key shape", () => {
  it("accepts opaque production keys without an environment marker", () => {
    expect(isValidWorkOSApiKey(`sk_${"a".repeat(24)}`)).toBe(true);
  });

  it("keeps compatible test-key suffixes without relying on the marker", () => {
    expect(isValidWorkOSApiKey(`sk_test_${"a".repeat(16)}`)).toBe(true);
  });

  it("rejects public, truncated, whitespace and control-character values", () => {
    expect(isValidWorkOSApiKey(`pk_${"a".repeat(24)}`)).toBe(false);
    expect(isValidWorkOSApiKey("sk_short")).toBe(false);
    expect(isValidWorkOSApiKey(`sk_${"a".repeat(12)} value`)).toBe(false);
    expect(isValidWorkOSApiKey(`sk_${"a".repeat(12)}\nvalue`)).toBe(false);
  });
});
