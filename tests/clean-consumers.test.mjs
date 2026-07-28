import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  consumerFrameworks,
  createConsumerMatrix,
  packageManagerPaths,
  shadcnVersion,
} from "../scripts/verify-clean-consumers.mjs";

const projectRoot = process.cwd();

test("defines both clean frameworks and all four real package-manager command paths", () => {
  assert.deepEqual(consumerFrameworks, ["next", "vite"]);
  assert.deepEqual(Object.keys(packageManagerPaths), ["npm", "pnpm", "yarn", "bun"]);
  assert.deepEqual(
    createConsumerMatrix().map(({ framework, packageManager }) => `${framework}:${packageManager}`),
    [
      "next:npm",
      "next:pnpm",
      "next:yarn",
      "next:bun",
      "vite:npm",
      "vite:pnpm",
      "vite:yarn",
      "vite:bun",
    ],
  );

  assert.deepEqual(packageManagerPaths.npm.registry.slice(0, 3), ["npx", "--yes", `shadcn@${shadcnVersion}`]);
  assert.deepEqual(packageManagerPaths.pnpm.registry.slice(0, 3), ["pnpm", "dlx", `shadcn@${shadcnVersion}`]);
  assert.deepEqual(packageManagerPaths.yarn.registry.slice(0, 3), ["yarn", "dlx", `shadcn@${shadcnVersion}`]);
  assert.deepEqual(packageManagerPaths.bun.registry.slice(0, 2), ["bunx", `shadcn@${shadcnVersion}`]);
  assert.equal(packageManagerPaths.npm.nixPackage, "nodejs_22");
  assert.equal(packageManagerPaths.pnpm.nixPackage, "nodejs_22");
  assert.equal(packageManagerPaths.pnpm.corepackVersion, "pnpm@11.17.0");
  assert.equal(packageManagerPaths.yarn.nixPackage, "nodejs_22");
  assert.equal(packageManagerPaths.yarn.corepackVersion, "yarn@4.14.1");
  assert.deepEqual(
    packageManagerPaths.yarn.reconcileAfterRegistry,
    ["yarn", "install"],
  );
  assert.equal(packageManagerPaths.bun.nixPackage, "bun");
});

test("commits buildable Next.js and Vite templates that import installed source", async () => {
  const requiredFiles = [
    "next/package.json",
    "next/components.json",
    "next/app/page.tsx",
    "next/app/layout.tsx",
    "next/app/globals.css",
    "vite/package.json",
    "vite/components.json",
    "vite/src/App.tsx",
    "vite/src/main.tsx",
    "vite/src/index.css",
    "vite/vite.config.ts",
  ];
  for (const relativePath of requiredFiles) {
    await access(path.join(projectRoot, "fixtures", "consumers", relativePath));
  }

  const [nextPackage, nextPage, vitePackage, viteApp] = await Promise.all([
    readFile(path.join(projectRoot, "fixtures/consumers/next/package.json"), "utf8"),
    readFile(path.join(projectRoot, "fixtures/consumers/next/app/page.tsx"), "utf8"),
    readFile(path.join(projectRoot, "fixtures/consumers/vite/package.json"), "utf8"),
    readFile(path.join(projectRoot, "fixtures/consumers/vite/src/App.tsx"), "utf8"),
  ]);
  for (const manifest of [JSON.parse(nextPackage), JSON.parse(vitePackage)]) {
    assert.equal(typeof manifest.scripts.typecheck, "string");
    assert.equal(typeof manifest.scripts.build, "string");
    assert.equal(manifest.dependencies.react, "19.2.8");
  }
  assert.match(nextPage, /@\/components\/ui\/gummy-button/);
  assert.match(viteApp, /\.\.\/components\/ui\/gummy-button/);
  assert.doesNotMatch(`${nextPage}\n${viteApp}`, /app\/components\/ui|ComponentLab|gummyui\/app/);
});

test("documents default clean verification and the complete release matrix", async () => {
  const [packageSource, installation] = await Promise.all([
    readFile(path.join(projectRoot, "package.json"), "utf8"),
    readFile(path.join(projectRoot, "docs/installation.md"), "utf8"),
  ]);
  const packageManifest = JSON.parse(packageSource);
  assert.match(packageManifest.scripts["registry:verify"], /registry:verify:consumers/);
  assert.match(packageManifest.scripts["registry:verify:matrix"], /npm,pnpm,yarn,bun/);
  for (const command of ["npx shadcn@latest", "pnpm dlx shadcn@latest", "yarn dlx shadcn@latest", "bunx shadcn@latest"]) {
    assert.match(installation, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
