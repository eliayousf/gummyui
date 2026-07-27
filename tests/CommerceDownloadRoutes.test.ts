import { describe, expect, it } from "vitest";
import { POST } from "../app/api/download-grants/route";
import { GET } from "../app/downloads/[grant]/route";

describe("fail-closed protected-download HTTP boundaries", () => {
  it("does not issue a grant without approved server bindings", async () => {
    const response = POST();
    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-robots-tag")).toContain("noindex");
    await expect(response.json()).resolves.toEqual({
      error: "not_found_or_forbidden",
    });
  });

  it("returns one generic denial for a direct or guessed grant path", async () => {
    const guessed = "guessed-object-key-or-grant";
    const response = await GET();
    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    const body = await response.text();
    expect(body).toBe('{"error":"not_found_or_forbidden"}');
    expect(body).not.toContain(guessed);
    expect(body).not.toContain("object");
  });
});
