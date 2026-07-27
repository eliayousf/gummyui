import { describe, expect, it } from "vitest";
import {
  componentApiCount,
  componentApiRecords,
  getComponentApi,
} from "../app/data/component-api";
import { componentCount, components } from "../app/data/catalogue";

describe("source-derived component API documentation", () => {
  it("covers the exact public catalogue without invented parts", () => {
    expect(componentApiCount).toBe(componentCount);
    expect(componentApiRecords).toHaveLength(componentCount);
    expect(new Set(componentApiRecords.map(({ slug }) => slug))).toEqual(
      new Set(components.map(({ slug }) => slug)),
    );

    for (const component of components) {
      const api = getComponentApi(component.slug);
      expect(api, component.slug).toBeDefined();
      expect(api?.source).toBe(component.source);
      expect(api?.components.length, component.slug).toBeGreaterThan(0);
      expect(api?.components.every((part) => part.startsWith("Gummy"))).toBe(true);
    }
  });

  it("records typed public contracts where canonical source exports them", () => {
    const button = getComponentApi("button");
    expect(button?.types.some(({ name }) => name === "GummyButtonProps")).toBe(true);
    expect(
      button?.types.flatMap(({ extends: bases }) => bases).join(" "),
    ).toContain("ButtonHTMLAttributes");
  });
});
