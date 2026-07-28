import { spawn } from "node:child_process";

const phases = [
  {
    name: "Git whitespace and conflict-marker check",
    command: "git",
    args: ["diff", "--check"],
  },
  {
    name: "Installed dependency tree",
    command: "npm",
    args: ["ls", "--depth=0"],
  },
  {
    name: "TypeScript",
    command: "npm",
    args: ["run", "typecheck"],
  },
  {
    name: "ESLint",
    command: "npm",
    args: ["run", "lint"],
  },
  {
    name: "Route stylesheet reproducibility",
    command: "npm",
    args: ["run", "styles:routes:check"],
  },
  {
    name: "Complete local test and generated-artifact gate",
    command: "npm",
    args: ["test"],
  },
  {
    name: "Vinext production browser gate",
    command: "npm",
    args: ["run", "test:browser:production"],
  },
  {
    name: "Native Next/Vercel production gate",
    command: "npm",
    args: ["run", "test:vercel:production"],
  },
  {
    name: "npm, pnpm, Yarn and Bun clean-consumer matrix",
    command: "npm",
    args: ["run", "registry:verify:matrix"],
  },
  {
    name: "Dependency vulnerability audit",
    command: "npm",
    args: ["audit", "--audit-level=moderate"],
  },
  {
    name: "Tracked source and exact production artifact secret scan",
    command: "npm",
    args: ["run", "security:secrets"],
  },
];

function runPhase({ name, command, args }) {
  console.log(`\n[launch verification] ${name}`);
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        CI: process.env.CI || "1",
        NEXT_TELEMETRY_DISABLED: "1",
      },
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          `${name} failed${signal ? ` with ${signal}` : ` with exit ${code}`}.`,
        ),
      );
    });
  });
}

const startedAt = performance.now();
for (const phase of phases) {
  await runPhase(phase);
}
const elapsedSeconds = ((performance.now() - startedAt) / 1_000).toFixed(1);
console.log(
  `\nLaunch verification passed ${phases.length} phases in ${elapsedSeconds}s.`,
);
