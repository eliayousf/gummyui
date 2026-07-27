import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {
  assertSafeRegistryItemName,
  resolvePublicRegistrySource,
  resolveRegistryTarget,
} from "../scripts/registry-boundary.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..");

test("allows canonical public component and style sources", async () => {
  await assert.doesNotReject(
    resolvePublicRegistrySource(projectRoot, "app/components/ui/GummyButton.tsx"),
  );
  await assert.doesNotReject(
    resolvePublicRegistrySource(projectRoot, "app/styles/gummy-theme.css"),
  );
});

test("rejects traversal, private sibling paths, and unsafe output targets", async () => {
  await assert.rejects(
    resolvePublicRegistrySource(projectRoot, "../gummyui-pro/registry/pro-catalogue.mjs"),
    /outside the public source allowlist/,
  );
  await assert.rejects(
    resolvePublicRegistrySource(projectRoot, "MASTER_SPEC.md"),
    /outside the public source allowlist/,
  );
  assert.throws(
    () => resolveRegistryTarget(projectRoot, "../gummyui-pro/leak.tsx"),
    /outside the install allowlist/,
  );
  assert.throws(
    () => resolveRegistryTarget(projectRoot, "public/private-source.tsx"),
    /outside the install allowlist/,
  );
});

test("requires safe registry item names", () => {
  assert.doesNotThrow(() => assertSafeRegistryItemName("gummy-button"));
  assert.throws(() => assertSafeRegistryItemName("../paid-source"), /Unsafe registry item name/);
  assert.throws(() => assertSafeRegistryItemName("gummy button"), /Unsafe registry item name/);
});
