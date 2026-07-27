import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  assertSafeRegistryItemName,
  resolvePublicRegistrySource,
  resolveRegistryTarget,
} from "./registry-boundary.mjs";

const projectRoot = process.cwd();
const registry = JSON.parse(await readFile(path.join(projectRoot, "registry.json"), "utf8"));
const names = new Set();
const targets = new Set();
const expectedStage3Items = [
  "gummy-input",
  "gummy-badge",
  "gummy-card",
  "gummy-switch",
  "gummy-tabs",
  "gummy-dropdown-menu",
  "gummy-dialog",
  "gummy-label",
  "gummy-field",
  "gummy-textarea",
  "gummy-checkbox",
  "gummy-radio-group",
  "gummy-native-select",
  "gummy-separator",
  "gummy-typography",
  "gummy-kbd",
  "gummy-spinner",
  "gummy-skeleton",
  "gummy-aspect-ratio",
  "gummy-alert",
  "gummy-avatar",
  "gummy-empty",
  "gummy-item",
  "gummy-progress",
  "gummy-accordion",
  "gummy-breadcrumb",
  "gummy-collapsible",
  "gummy-pagination",
  "gummy-button-group",
  "gummy-slider",
  "gummy-toggle",
  "gummy-toggle-group",
  "gummy-alert-dialog",
  "gummy-drawer",
  "gummy-hover-card",
  "gummy-popover",
  "gummy-sheet",
  "gummy-tooltip",
  "gummy-context-menu",
  "gummy-menubar",
  "gummy-navigation-menu",
  "gummy-sidebar",
  "gummy-calendar",
  "gummy-combobox",
  "gummy-command",
  "gummy-date-picker",
  "gummy-input-group",
  "gummy-input-otp",
  "gummy-select",
  "gummy-carousel",
  "gummy-data-table",
  "gummy-direction",
  "gummy-resizable",
  "gummy-scroll-area",
  "gummy-table",
  "gummy-sonner",
];

if (registry.$schema !== "https://ui.shadcn.com/schema/registry.json") throw new Error("Registry schema is missing.");
if (!Array.isArray(registry.items) || registry.items.length < 2) throw new Error("Registry foundation must include base and Button items.");

for (const item of registry.items) {
  assertSafeRegistryItemName(item.name);
  if (names.has(item.name)) throw new Error(`Duplicate registry item: ${item.name}`);
  names.add(item.name);
  if (!item.title || !item.description || !Array.isArray(item.files) || item.files.length === 0) throw new Error(`Incomplete registry item: ${item.name}`);
  for (const file of item.files) {
    if (targets.has(file.target)) throw new Error(`Duplicate install target: ${file.target}`);
    targets.add(file.target);
    await resolvePublicRegistrySource(projectRoot, file.path);
    resolveRegistryTarget(projectRoot, file.target);
  }
  for (const dependency of item.registryDependencies ?? []) {
    if (!dependency.startsWith("https://gummyui.dev/r/")) {
      throw new Error(`Registry dependency must use the public registry URL: ${dependency}`);
    }
  }
}

for (const itemName of expectedStage3Items) {
  if (!names.has(itemName)) throw new Error(`Missing Stage 3 registry item: ${itemName}`);
}

for (const item of registry.items) {
  const payloadPath = path.join(projectRoot, "public", "r", `${item.name}.json`);
  const payload = JSON.parse(await readFile(payloadPath, "utf8"));
  if (payload.name !== item.name || payload.type !== item.type) {
    throw new Error(`Generated payload metadata does not match registry.json: ${item.name}`);
  }
  if (!Array.isArray(payload.files) || payload.files.length !== item.files.length) {
    throw new Error(`Generated payload files do not match registry.json: ${item.name}`);
  }
}

console.log("Registry integrity passed: 57 component items and four shared material payloads are safe, readable, and generated.");
