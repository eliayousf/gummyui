import { spawn } from "node:child_process";
import {
  access,
  chmod,
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const fixturesRoot = path.join(projectRoot, "fixtures", "consumers");
const registryRoot = path.join(projectRoot, "public", "r");
const radixRegistry = JSON.parse(
  await readFile(path.join(projectRoot, "registry-radix.json"), "utf8"),
);
const consumerEngines = Object.freeze(["base", "radix"]);

export const shadcnVersion = "4.15.0";
export const consumerFrameworks = Object.freeze(["next", "vite"]);
export const packageManagerPaths = Object.freeze({
  npm: {
    nixPackage: "nodejs_22",
    install: ["npm", "install", "--ignore-scripts", "--no-audit", "--no-fund", "--package-lock=false"],
    registry: ["npx", "--yes", `shadcn@${shadcnVersion}`, "add"],
    typecheck: ["npm", "run", "typecheck"],
    build: ["npm", "run", "build"],
  },
  pnpm: {
    nixPackage: "nodejs_22",
    corepackVersion: "pnpm@11.17.0",
    install: ["pnpm", "install", "--ignore-scripts", "--no-frozen-lockfile", "--reporter=append-only"],
    registry: ["pnpm", "dlx", `shadcn@${shadcnVersion}`, "add"],
    typecheck: ["pnpm", "run", "typecheck"],
    build: ["pnpm", "run", "build"],
  },
  yarn: {
    nixPackage: "nodejs_22",
    corepackVersion: "yarn@4.14.1",
    install: ["yarn", "install"],
    registry: ["yarn", "dlx", `shadcn@${shadcnVersion}`, "add"],
    typecheck: ["yarn", "run", "typecheck"],
    build: ["yarn", "run", "build"],
  },
  bun: {
    nixPackage: "bun",
    install: ["bun", "install", "--ignore-scripts"],
    registry: ["bunx", `shadcn@${shadcnVersion}`, "add"],
    typecheck: ["bun", "run", "typecheck"],
    build: ["bun", "run", "build"],
  },
});

export function createConsumerMatrix({
  frameworks = consumerFrameworks,
  packageManagers = Object.keys(packageManagerPaths),
} = {}) {
  return frameworks.flatMap((framework) =>
    packageManagers.map((packageManager) => ({ framework, packageManager })),
  );
}

function parseListArgument(argv, name, fallback) {
  const flag = `--${name}`;
  const index = argv.indexOf(flag);
  if (index === -1) return [...fallback];
  const raw = argv[index + 1];
  if (!raw || raw.startsWith("--")) {
    throw new Error(`${flag} requires a comma-separated value.`);
  }
  return raw.split(",").map((value) => value.trim()).filter(Boolean);
}

function validateSelection(values, allowed, label) {
  for (const value of values) {
    if (!allowed.includes(value)) {
      throw new Error(`Unknown ${label} "${value}". Expected one of: ${allowed.join(", ")}.`);
    }
  }
}

function commandLabel(command) {
  return command.map((part) => part.includes("127.0.0.1") ? "[local-registry-url]" : part).join(" ");
}

async function runNixCommand({ nixPackage, command, cwd, env }) {
  const startedAt = performance.now();
  process.stdout.write(`  $ nix shell nixpkgs#${nixPackage} -c ${commandLabel(command)}\n`);

  const child = spawn(
    "nix",
    ["shell", `nixpkgs#${nixPackage}`, "-c", ...command],
    {
      cwd,
      env,
      stdio: "inherit",
    },
  );

  const exitCode = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", resolve);
  });
  const elapsedSeconds = ((performance.now() - startedAt) / 1000).toFixed(1);
  if (exitCode !== 0) {
    throw new Error(
      `Command failed after ${elapsedSeconds}s (${commandLabel(command)}).`,
    );
  }
  process.stdout.write(`    passed in ${elapsedSeconds}s\n`);
}

async function startRegistryServer() {
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
      const match = requestUrl.pathname.match(/^\/r\/([a-z0-9-]+\.json)$/);
      if (!match) {
        response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        response.end("Not found\n");
        return;
      }
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("Local registry server address is unavailable.");
      }
      const localRegistryBaseUrl = `http://127.0.0.1:${address.port}`;
      const payload = (
        await readFile(path.join(registryRoot, match[1]), "utf8")
      ).replaceAll("https://gummyui.dev", localRegistryBaseUrl);
      response.writeHead(200, {
        "access-control-allow-origin": "*",
        "cache-control": "no-store",
        "content-type": "application/json; charset=utf-8",
      });
      response.end(payload);
    } catch (error) {
      response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      response.end(`${error instanceof Error ? error.message : String(error)}\n`);
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Local registry server did not expose a TCP port.");
  }
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve())),
  };
}

async function assertInstalledConsumer(projectDirectory, engine) {
  const requiredFiles = engine === "radix"
    ? [
        "components/gummy-theme.css",
        "components/gummy-button.css",
        "components/gummy-radix-compat.css",
        "components/ui/gummy-button.tsx",
        ...radixRegistry.items
          .filter(({ type }) => type === "registry:ui")
          .flatMap(({ files }) => files.map(({ target }) => target)),
      ]
    : [
        "components/gummy-theme.css",
        "components/gummy-button.css",
        "components/ui/gummy-button.tsx",
      ];
  for (const relativePath of requiredFiles) {
    await access(path.join(projectDirectory, relativePath));
  }
  const nodeModules = await lstat(path.join(projectDirectory, "node_modules"));
  if (nodeModules.isSymbolicLink()) {
    throw new Error("Clean consumer node_modules must not be symlinked from the Gummy UI repository.");
  }
  const representativePath = engine === "radix"
    ? path.join(projectDirectory, "components", "ui", "GummyDialog.tsx")
    : path.join(projectDirectory, "components", "ui", "gummy-button.tsx");
  const representativeSource = await readFile(
    representativePath,
    "utf8",
  );
  if (
    engine === "base" &&
    !representativeSource.includes("export const GummyButton")
  ) {
    throw new Error("The shadcn command did not install the canonical Gummy Button source.");
  }
  if (
    engine === "radix" &&
    !representativeSource.includes("@radix-ui/react-dialog")
  ) {
    throw new Error("The shadcn command did not install the Radix Dialog source.");
  }
  if (
    representativeSource.includes(projectRoot) ||
    representativeSource.includes("app/components/radix/")
  ) {
    throw new Error("Installed source imports from the Gummy UI website repository.");
  }
}

async function prepareCommandShim({ packageManagerPath, runRoot, env }) {
  if (!packageManagerPath.corepackVersion) return env;

  const commandName = packageManagerPath.install[0];
  const shimDirectory = path.join(runRoot, "command-shims");
  const shimPath = path.join(shimDirectory, commandName);
  await mkdir(shimDirectory, { recursive: true });
  await writeFile(
    shimPath,
    `#!/bin/sh\nexec corepack ${packageManagerPath.corepackVersion} "$@"\n`,
    "utf8",
  );
  await chmod(shimPath, 0o755);
  return {
    ...env,
    PATH: `${shimDirectory}${path.delimiter}${env.PATH ?? ""}`,
  };
}

async function verifyConsumerCase({
  framework,
  packageManager,
  runRoot,
  registryBaseUrl,
  engine,
}) {
  const packageManagerPath = packageManagerPaths[packageManager];
  const projectDirectory = path.join(runRoot, `${framework}-${packageManager}`);
  await cp(path.join(fixturesRoot, framework), projectDirectory, { recursive: true });

  const isolatedCacheRoot = path.join(runRoot, "cache", packageManager);
  let env = {
    ...process.env,
    CI: "1",
    COREPACK_DEFAULT_TO_LATEST: "0",
    COREPACK_ENABLE_DOWNLOAD_PROMPT: "0",
    COREPACK_HOME: path.join(isolatedCacheRoot, "corepack"),
    npm_config_cache: path.join(isolatedCacheRoot, "npm"),
    PNPM_HOME: path.join(isolatedCacheRoot, "pnpm-home"),
    XDG_CACHE_HOME: path.join(isolatedCacheRoot, "xdg"),
    YARN_ENABLE_IMMUTABLE_INSTALLS: "false",
    YARN_ENABLE_SCRIPTS: "false",
    YARN_NODE_LINKER: "node-modules",
    BUN_INSTALL_CACHE_DIR: path.join(isolatedCacheRoot, "bun"),
  };
  env = await prepareCommandShim({ packageManagerPath, runRoot, env });
  const registryUrls = engine === "radix"
    ? [
        `${registryBaseUrl}/r/gummy-button.json`,
        ...radixRegistry.items
          .filter(({ type }) => type === "registry:ui")
          .map(({ name }) => `${registryBaseUrl}/r/${name}.json`),
      ]
    : [
        `${registryBaseUrl}/r/gummy-base.json`,
        `${registryBaseUrl}/r/gummy-button.json`,
      ];

  process.stdout.write(`\n${framework} with ${packageManager} · ${engine}\n`);
  await runNixCommand({
    nixPackage: packageManagerPath.nixPackage,
    command: packageManagerPath.install,
    cwd: projectDirectory,
    env,
  });
  await runNixCommand({
    nixPackage: packageManagerPath.nixPackage,
    command: [...packageManagerPath.registry, ...registryUrls, "--yes", "--overwrite"],
    cwd: projectDirectory,
    env,
  });
  await assertInstalledConsumer(projectDirectory, engine);
  await runNixCommand({
    nixPackage: packageManagerPath.nixPackage,
    command: packageManagerPath.typecheck,
    cwd: projectDirectory,
    env,
  });
  await runNixCommand({
    nixPackage: packageManagerPath.nixPackage,
    command: packageManagerPath.build,
    cwd: projectDirectory,
    env,
  });
}

export async function verifyCleanConsumers({
  frameworks = consumerFrameworks,
  packageManagers = ["npm"],
  keepTemporaryProjects = false,
  engine = "base",
} = {}) {
  validateSelection(frameworks, consumerFrameworks, "framework");
  validateSelection(packageManagers, Object.keys(packageManagerPaths), "package manager");
  validateSelection([engine], consumerEngines, "component engine");
  await access(path.join(registryRoot, "gummy-base.json"));
  await access(
    path.join(
      registryRoot,
      engine === "radix" ? "gummy-radix-dialog.json" : "gummy-button.json",
    ),
  );

  const temporaryParent = process.env.GUMMYUI_CONSUMER_TMPDIR || os.tmpdir();
  const runRoot = await mkdtemp(path.join(temporaryParent, "gummyui-clean-consumers-"));
  const registryServer = await startRegistryServer();
  const startedAt = performance.now();
  try {
    for (const consumerCase of createConsumerMatrix({ frameworks, packageManagers })) {
      await verifyConsumerCase({
        ...consumerCase,
        runRoot,
        registryBaseUrl: registryServer.baseUrl,
        engine,
      });
    }
  } finally {
    await registryServer.close();
    if (!keepTemporaryProjects) {
      await rm(runRoot, { recursive: true, force: true });
    } else {
      process.stdout.write(`Temporary projects retained at ${runRoot}\n`);
    }
  }
  const elapsedSeconds = ((performance.now() - startedAt) / 1000).toFixed(1);
  process.stdout.write(
    `\nClean ${engine} consumer verification passed for ${frameworks.length} framework(s) and ${packageManagers.length} package-manager path(s) in ${elapsedSeconds}s.\n`,
  );
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help")) {
    process.stdout.write(
      "Usage: node scripts/verify-clean-consumers.mjs [--frameworks next,vite] [--package-managers npm,pnpm,yarn,bun] [--engine base|radix] [--keep-temp]\n",
    );
    return;
  }
  const frameworks = parseListArgument(argv, "frameworks", consumerFrameworks);
  const packageManagers = parseListArgument(argv, "package-managers", ["npm"]);
  const engine = parseListArgument(argv, "engine", ["base"])[0];
  await verifyCleanConsumers({
    frameworks,
    packageManagers,
    engine,
    keepTemporaryProjects: argv.includes("--keep-temp"),
  });
}

const isMain = process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  await main();
}
