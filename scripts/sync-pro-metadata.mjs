import assert from "node:assert/strict";
import { readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const publicRoot = process.cwd();
const localPath = path.join(
  publicRoot,
  "app",
  "data",
  "pro-catalogue.public.json",
);
const privatePath = path.resolve(
  publicRoot,
  "../gummyui-pro/releases/public-metadata/pro-catalogue.public.json",
);
const allowedStatuses = new Set([
  "specified",
  "implemented",
  "verified",
  "release-ready",
]);
const forbiddenKeys = new Set([
  "archive",
  "checksum",
  "composition",
  "entitlement",
  "generatedAt",
  "implementationEvidence",
  "releasePath",
  "sampleContent",
  "source",
  "sourceReference",
  "tests",
]);
const unsafeValuePattern =
  /(?:gummyui-pro|(?:^|[\\/])\.\.(?:[\\/]|$)|^(?:[a-z]:[\\/]|\/(?:Users|home|private|var)\/|file:)|^(?:blocks|figma|registry|releases|templates)[\\/])/i;

export function validatePublicProMetadata(metadata) {
  assert.equal(metadata.schemaVersion, "1.2");
  assert.deepEqual(Object.keys(metadata).sort(), [
    "blocks",
    "categories",
    "counts",
    "designKit",
    "schemaVersion",
    "templates",
  ]);
  assert.deepEqual(metadata.counts, {
    blocks: 158,
    categories: 22,
    templates: 6,
    designKitDefinitions: 300,
  });
  assert.equal(metadata.categories.length, metadata.counts.categories);
  assert.equal(metadata.blocks.length, metadata.counts.blocks);
  assert.equal(metadata.templates.length, metadata.counts.templates);
  assert.equal(
    metadata.categories.reduce((total, category) => total + category.count, 0),
    metadata.counts.blocks,
  );
  assert.equal(new Set(metadata.blocks.map(({ id }) => id)).size, metadata.counts.blocks);
  assert.equal(new Set(metadata.templates.map(({ id }) => id)).size, metadata.counts.templates);
  assert.ok(metadata.blocks.every(({ status }) => allowedStatuses.has(status)));
  assert.ok(metadata.templates.every(({ status }) => allowedStatuses.has(status)));
  assert.deepEqual(Object.keys(metadata.designKit).sort(), [
    "definitionCount",
    "expectedMaterialization",
    "externalMaterialization",
    "manualQa",
    "materializerVersion",
    "status",
  ]);
  assert.ok(allowedStatuses.has(metadata.designKit.status));
  assert.equal(metadata.designKit.definitionCount, metadata.counts.designKitDefinitions);
  assert.equal(typeof metadata.designKit.materializerVersion, "string");
  assert.equal(metadata.designKit.expectedMaterialization.masters, 300);
  assert.equal(metadata.designKit.expectedMaterialization.responsiveInstances, 900);
  assert.equal(
    metadata.designKit.externalMaterialization,
    "not-run-founder-approval-required",
  );
  assert.ok(["pending", "complete"].includes(metadata.designKit.manualQa));

  function visit(value, jsonPath) {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${jsonPath}[${index}]`));
      return;
    }
    if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        assert.equal(
          forbiddenKeys.has(key),
          false,
          `${jsonPath}.${key} exposes forbidden private metadata.`,
        );
        if (key === "preview") {
          assert.equal(
            value.status,
            "release-ready",
            `${jsonPath}.preview is present before release-ready status.`,
          );
        }
        visit(child, `${jsonPath}.${key}`);
      }
      return;
    }
    if (typeof value === "string") {
      assert.equal(
        unsafeValuePattern.test(value),
        false,
        `${jsonPath} exposes an unsafe private path or repository value.`,
      );
    }
  }

  visit(metadata, "$");
  return metadata;
}

async function readValidated(filePath) {
  const serialized = await readFile(filePath, "utf8");
  const metadata = validatePublicProMetadata(JSON.parse(serialized));
  return {
    metadata,
    serialized: `${JSON.stringify(metadata, null, 2)}\n`,
  };
}

if (process.argv.includes("--check")) {
  const local = await readValidated(localPath);
  assert.equal(
    local.serialized,
    await readFile(localPath, "utf8"),
    "Tracked public Pro metadata is not canonically serialized.",
  );
  console.log(
    `Boundary-safe public Pro metadata verified: `
    + `${local.metadata.blocks.filter(({ status }) => status === "implemented").length} blocks and `
    + `${local.metadata.templates.filter(({ status }) => status === "implemented").length} templates implemented.`,
  );
} else {
  const source = await readValidated(privatePath);
  const temporaryPath = `${localPath}.tmp-${process.pid}`;
  try {
    await writeFile(temporaryPath, source.serialized, "utf8");
    await rename(temporaryPath, localPath);
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }
  console.log(
    "Synchronized reviewed boundary-safe Pro metadata from the private export.",
  );
}
