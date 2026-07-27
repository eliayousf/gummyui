import { access, opendir, readFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const publicSurfaces = [
  path.join(projectRoot, "public"),
  path.join(projectRoot, "dist", "client"),
];
const forbiddenText = [
  "prerenderSecret",
  `${path.sep}gummyui-pro${path.sep}`,
  '"source":"blocks/',
  '"source": "blocks/',
  "registry/pro-catalogue.mjs",
];
const forbiddenExtensions = new Set([".map", ".fig", ".figma", ".zip", ".tar", ".tgz", ".gz"]);

async function exists(candidate) {
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
  }
}

async function* walk(directory) {
  if (!(await exists(directory))) return;
  const entries = await opendir(directory);
  for await (const entry of entries) {
    const candidate = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`Public artifact contains a symlink: ${path.relative(projectRoot, candidate)}`);
    }
    if (entry.isDirectory()) yield* walk(candidate);
    if (entry.isFile()) yield candidate;
  }
}

let inspected = 0;
for (const surface of publicSurfaces) {
  for await (const file of walk(surface)) {
    inspected += 1;
    const extension = path.extname(file).toLowerCase();
    if (forbiddenExtensions.has(extension)) {
      throw new Error(`Forbidden release artifact on a public surface: ${path.relative(projectRoot, file)}`);
    }
    const contents = await readFile(file);
    const text = contents.toString("utf8");
    for (const marker of forbiddenText) {
      if (text.includes(marker)) {
        throw new Error(
          `Public artifact contains forbidden private/server material (${marker}): ${path.relative(projectRoot, file)}`,
        );
      }
    }
  }
}

if (inspected === 0) {
  throw new Error("No public artifacts were available for boundary verification.");
}

console.log(`Artifact boundary verified across ${inspected} public files: no source maps, archives, private paths, or server prerender secrets.`);
