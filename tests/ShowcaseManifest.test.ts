import { describe, expect, it } from "vitest";
import { showcaseCount, showcaseEntries } from "../app/data/showcase";

describe("community showcase manifest", () => {
  it("derives the public count from verified entries", () => {
    expect(showcaseCount).toBe(showcaseEntries.length);
    expect(new Set(showcaseEntries.map(({ url }) => url)).size).toBe(showcaseEntries.length);
  });

  it("requires evidence and permission fields before an entry can publish", () => {
    for (const entry of showcaseEntries) {
      expect(entry.name.trim()).not.toBe("");
      expect(new URL(entry.url).protocol).toBe("https:");
      expect(entry.description.trim().length).toBeGreaterThan(40);
      expect(entry.submittedBy.trim()).not.toBe("");
      expect(Number.isNaN(Date.parse(entry.permissionRecordedAt))).toBe(false);
    }
  });
});
