import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  assertSafeRegistryItemName,
  resolvePublicRegistrySource,
} from "./registry-boundary.mjs";

const projectRoot = process.cwd();
const registry = JSON.parse(await readFile(path.join(projectRoot, "registry.json"), "utf8"));
const radixRegistry = JSON.parse(
  await readFile(path.join(projectRoot, "registry-radix.json"), "utf8"),
);
const outputDirectory = path.join(projectRoot, "public", "r");
const radixRegistryDependencies = [
  "https://gummyui.dev/r/gummy-base.json",
  "https://gummyui.dev/r/gummy-core-styles.json",
  "https://gummyui.dev/r/gummy-primitives-styles.json",
  "https://gummyui.dev/r/gummy-radix-compat.json",
];

await mkdir(outputDirectory, { recursive: true });

for (const item of [...registry.items, ...radixRegistry.items]) {
  assertSafeRegistryItemName(item.name);
  const files = await Promise.all(item.files.map(async (file) => {
    const source = await resolvePublicRegistrySource(projectRoot, file.path);
    return {
      path: file.target,
      type: file.type,
      content: await readFile(source, "utf8"),
    };
  }));

  const payload = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: item.name,
    type: item.type,
    title: item.title,
    description: item.description,
    ...((item.registryDependencies || item.name.startsWith("gummy-radix-")) &&
      item.name !== "gummy-radix-compat"
      ? {
          registryDependencies:
            item.registryDependencies ?? radixRegistryDependencies,
        }
      : {}),
    ...(item.dependencies ? { dependencies: item.dependencies } : {}),
    files,
  };

  await writeFile(
    path.join(outputDirectory, `${item.name}.json`),
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8",
  );
}

await writeFile(
  path.join(outputDirectory, "radix.json"),
  `${JSON.stringify(radixRegistry, null, 2)}\n`,
  "utf8",
);

console.log(
  `Built ${registry.items.length} canonical items and ${radixRegistry.items.length} Radix items in public/r.`,
);
