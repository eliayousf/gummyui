import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

const projectRoot = path.resolve(import.meta.dirname, "..");
const clientRoot = path.join(projectRoot, "dist", "client");
const manifest = JSON.parse(
  await readFile(path.join(clientRoot, ".vite", "manifest.json"), "utf8"),
);

const entryBudgets = {
  "app/components/SiteChrome.tsx": 95_000,
  "app/components/CompositionShowcase.tsx": 165_000,
  "app/components/DocsShell.tsx": 155_000,
  "app/components/ComponentInspector.tsx": 220_000,
  "app/components/ComponentLab.tsx": 250_000,
  "app/components/ThemeBuilder.tsx": 185_000,
  "app/components/GummyFrameStudio.tsx": 130_000,
};

const failures = [];

async function gzipBytes(relativePath) {
  const contents = await readFile(path.join(clientRoot, relativePath));
  return gzipSync(contents, { level: 9 }).byteLength;
}

function collectEntryFiles(entryKey, seen = new Set()) {
  if (seen.has(entryKey)) return seen;
  seen.add(entryKey);
  const entry = manifest[entryKey];
  if (!entry) return seen;
  for (const imported of entry.imports ?? []) {
    collectEntryFiles(imported, seen);
  }
  return seen;
}

const evidence = [];
for (const [entryKey, budget] of Object.entries(entryBudgets)) {
  if (!manifest[entryKey]) {
    failures.push(`Missing representative client entry: ${entryKey}`);
    continue;
  }
  const keys = [...collectEntryFiles(entryKey)];
  const files = [...new Set(keys.map((key) => manifest[key]?.file).filter(Boolean))];
  const gzipTotal = (
    await Promise.all(files.map((file) => gzipBytes(file)))
  ).reduce((sum, size) => sum + size, 0);
  evidence.push({ entry: entryKey, gzipBytes: gzipTotal, budget });
  if (gzipTotal > budget) {
    failures.push(
      `${entryKey} transitive client JavaScript is ${gzipTotal} gzip bytes; budget is ${budget}.`,
    );
  }
}

const assetsDirectory = path.join(clientRoot, "assets");
for (const filename of await readdir(assetsDirectory)) {
  const filePath = path.join(assetsDirectory, filename);
  const details = await stat(filePath);
  if (!details.isFile()) continue;
  if (filename.endsWith(".js") && details.size > 450_000) {
    failures.push(`${filename} is ${details.size} bytes; per-chunk JS budget is 450000.`);
  }
  if (filename.endsWith(".css") && details.size > 220_000) {
    failures.push(`${filename} is ${details.size} bytes; shared CSS budget is 220000.`);
  }
}

const routeStyleBudgets = {
  "component-inspector.css": 12_000,
  "frame-studio.css": 6_000,
  "gummy-form-controls.css": 40_000,
  "gummy-primitives.css": 80_000,
};
const routeStyleDirectory = path.join(clientRoot, "styles");
const routeStyleEvidence = [];
for (const [filename, budget] of Object.entries(routeStyleBudgets)) {
  const details = await stat(path.join(routeStyleDirectory, filename));
  routeStyleEvidence.push({ filename, bytes: details.size, budget });
  if (details.size > budget) {
    failures.push(
      `${filename} is ${details.size} bytes; route stylesheet budget is ${budget}.`,
    );
  }
}

const labStudies = (await readdir(clientRoot)).filter((filename) =>
  /^gummy-(?:stage3|badge|card|switch|dropdown|input).*-imagegen-.*\.(?:png|webp)$/.test(filename),
);
const studyBytes = (
  await Promise.all(labStudies.map(async (filename) =>
    (await stat(path.join(clientRoot, filename))).size))
).reduce((sum, size) => sum + size, 0);
if (studyBytes > 800_000) {
  failures.push(
    `Component Lab art-direction studies total ${studyBytes} bytes; budget is 800000.`,
  );
}
for (const filename of labStudies) {
  const details = await stat(path.join(clientRoot, filename));
  if (details.size > 220_000) {
    failures.push(`${filename} is ${details.size} bytes; study-image budget is 220000.`);
  }
}

const ogBytes = (await stat(path.join(clientRoot, "og.png"))).size;
if (ogBytes > 1_000_000) {
  failures.push(`og.png is ${ogBytes} bytes; social-image budget is 1000000.`);
}

if (failures.length) {
  throw new Error(`Performance budgets failed:\n- ${failures.join("\n- ")}`);
}

console.log("Representative client budgets passed:");
for (const item of evidence) {
  console.log(
    `- ${item.entry}: ${item.gzipBytes}/${item.budget} gzip bytes`,
  );
}
for (const item of routeStyleEvidence) {
  console.log(`- route CSS ${item.filename}: ${item.bytes}/${item.budget} bytes`);
}
console.log(
  `Component Lab study images: ${studyBytes}/800000 bytes; social image: ${ogBytes}/1000000 bytes.`,
);
