import { describe, expect, it } from "vitest";
import { GET } from "../app/changelog.xml/route";
import { publicReleases } from "../app/data/changelog";

describe("public changelog feed", () => {
  it("publishes every public release as RSS without commercial claims", async () => {
    const response = GET();
    const body = await response.text();

    expect(response.headers.get("content-type")).toBe(
      "application/rss+xml; charset=utf-8",
    );
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(body).toContain("<title>Gummy UI public changelog</title>");
    expect(body.match(/<item>/g)).toHaveLength(publicReleases.length);
    for (const release of publicReleases) {
      expect(body).toContain(`gummyui-public-${release.version}`);
    }
    expect(body).not.toMatch(/checkout|entitlement|customer|paid download/i);
  });
});
