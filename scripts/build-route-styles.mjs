import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repositoryRoot = process.cwd();
const checkOnly = process.argv.includes("--check");
const stylesheetNames = [
  "gummy-form-controls.css",
  "gummy-primitives.css",
  "gummy-radix-compat.css",
  "component-inspector.css",
  "frame-studio.css",
];

for (const name of stylesheetNames) {
  const sourcePath = path.join(repositoryRoot, "app", "styles", name);
  const publicPath = path.join(repositoryRoot, "public", "styles", name);
  const source = await readFile(sourcePath, "utf8");
  const content = `/* Generated from app/styles/${name}. Do not edit this public copy. */\n${source}`;

  if (checkOnly) {
    const current = await readFile(publicPath, "utf8");
    assert.equal(current, content, `${publicPath} is stale; run npm run styles:routes.`);
    continue;
  }

  await mkdir(path.dirname(publicPath), { recursive: true });
  await writeFile(publicPath, content);
}

console.log(
  `${checkOnly ? "Verified" : "Built"} ${stylesheetNames.length} route-scoped public stylesheets.`,
);
