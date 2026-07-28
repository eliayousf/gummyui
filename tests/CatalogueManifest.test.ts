import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  catalogueGroups,
  componentCount,
  components,
} from "../app/data/catalogue";
import {
  proBlockCategories,
  proBlockCount,
  proBlocks,
  proCategoryCount,
  proCatalogueStatus,
  proDesignKitDefinitionCount,
  proDesignKitExpectedMaterialization,
  proDesignKitExternalMaterialization,
  proDesignKitManualQa,
  proDesignKitMaterializerVersion,
  proDesignKitStatus,
  proImplementedBlockCount,
  proImplementedTemplateCount,
  proReleaseReadyBlockCount,
  proSpecifiedBlockCount,
  proSpecifiedTemplateCount,
  proTemplateCount,
  proTemplates,
} from "../app/data/pro-catalogue";

describe("public catalogue manifest", () => {
  it("contains 57 unique component definitions across every group", () => {
    expect(componentCount).toBe(57);
    expect(new Set(components.map(({ slug }) => slug)).size).toBe(57);
    expect(new Set(components.map(({ registryName }) => registryName)).size).toBe(57);
    for (const group of catalogueGroups) {
      expect(components.some((component) => component.group === group.id)).toBe(true);
    }
  });

  it("maps every definition to public source and one registry item", async () => {
    const projectRoot = process.cwd();
    const registry = JSON.parse(
      await readFile(path.join(projectRoot, "registry.json"), "utf8"),
    ) as { items: Array<{ name: string; type: string }> };
    const radixRegistry = JSON.parse(
      await readFile(path.join(projectRoot, "registry-radix.json"), "utf8"),
    ) as { items: Array<{ name: string; type: string }> };
    const registryNames = new Set(registry.items.map(({ name }) => name));
    const radixRegistryNames = new Set(
      radixRegistry.items.map(({ name }) => name),
    );
    let radixCounterpartCount = 0;
    for (const component of components) {
      await access(path.join(projectRoot, component.source));
      expect(registryNames.has(component.registryName)).toBe(true);
      expect(component.registryUrl).toBe(
        `https://gummyui.dev/r/${component.registryName}.json`,
      );
      if (component.radixRegistryName) {
        radixCounterpartCount += 1;
        expect(radixRegistryNames.has(component.radixRegistryName)).toBe(true);
        expect(component.radixRegistryUrl).toBe(
          `https://gummyui.dev/r/${component.radixRegistryName}.json`,
        );
      }
    }
    expect(registry.items.filter(({ type }) => type === "registry:ui")).toHaveLength(57);
    expect(radixCounterpartCount).toBe(22);
    expect(components.find(({ slug }) => slug === "combobox")?.radixRegistryName)
      .toBeUndefined();
    expect(radixRegistry.items.filter(({ type }) => type === "registry:ui"))
      .toHaveLength(22);
  });

  it("exposes only boundary-safe Pro aggregate status", () => {
    expect(proBlockCount).toBe(158);
    expect(proCategoryCount).toBe(22);
    expect(proTemplateCount).toBe(6);
    expect(proDesignKitDefinitionCount).toBeGreaterThanOrEqual(300);
    expect(proDesignKitStatus).toBe("implemented");
    expect(proDesignKitMaterializerVersion).toBe("0.5.0");
    expect(proDesignKitExpectedMaterialization).toEqual({
      masters: 300,
      responsiveInstances: 900,
      componentSets: 138,
      editableVariants: 2588,
      editablePatternSets: 72,
      editablePatternVariants: 1728,
      rasterComparisonReferences: 72,
    });
    expect(proDesignKitExternalMaterialization)
      .toBe("previous-version-materialized-current-version-live-run-pending");
    expect(proDesignKitManualQa).toBe("pending");
    expect(proCatalogueStatus).toBe("implementation-in-progress");
    expect(proImplementedBlockCount).toBeGreaterThanOrEqual(80);
    expect(proImplementedBlockCount).toBe(
      proBlocks.filter(({ status }) => status === "implemented").length,
    );
    expect(proSpecifiedBlockCount).toBe(
      proBlocks.filter(({ status }) => status === "specified").length,
    );
    expect(proReleaseReadyBlockCount).toBe(0);
    expect(proImplementedTemplateCount).toBe(6);
    expect(proSpecifiedTemplateCount).toBe(0);
    expect(proBlockCategories.reduce((total, category) => total + category.count, 0)).toBe(158);
    expect(new Set(proTemplates.map(({ slug }) => slug)).size).toBe(6);
    expect(proBlocks.every((block) =>
      !Object.hasOwn(block, "source")
      && !Object.hasOwn(block, "tests")
      && !Object.hasOwn(block, "implementationEvidence"))).toBe(true);
    expect(proTemplates.every((template) =>
      !Object.hasOwn(template, "source")
      && !Object.hasOwn(template, "tests")
      && !Object.hasOwn(template, "implementationEvidence"))).toBe(true);
  });
});
