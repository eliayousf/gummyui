import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import postcss from "postcss";

const projectRoot = process.cwd();
const sourcePath = path.join(projectRoot, "app/globals.css");
const targetPath = path.join(projectRoot, "app/styles/gummy-core-components.css");
const source = await readFile(sourcePath, "utf8");
const root = postcss.parse(source, { from: sourcePath });
const componentSelectors = [
  ".gummy-input",
  ".gummy-badge",
  ".gummy-card",
  ".gummy-switch",
  ".gummy-tabs",
  ".gummy-menu",
  ".gummy-dialog",
];
const labOnlySelectors = [
  ".workbench__",
  ".badge-specimen",
  ".card-demo",
  ".interaction-specimen",
];

function splitSelectorList(selectorList) {
  const selectors = [];
  let current = "";
  let depth = 0;
  let quote = "";
  for (const character of selectorList) {
    if (quote) {
      current += character;
      if (character === quote) quote = "";
      continue;
    }
    if (character === "'" || character === "\"") {
      quote = character;
      current += character;
      continue;
    }
    if (character === "(" || character === "[") depth += 1;
    if (character === ")" || character === "]") depth -= 1;
    if (character === "," && depth === 0) {
      selectors.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  if (current.trim()) selectors.push(current.trim());
  return selectors;
}

function retainComponentSelectors(node) {
  if (node.type !== "rule") return false;
  const selectors = splitSelectorList(node.selector).filter((selector) =>
    componentSelectors.some((componentSelector) => selector.includes(componentSelector))
      && !labOnlySelectors.some((labSelector) => selector.includes(labSelector)),
  );
  if (!selectors.length) return false;
  node.selector = selectors.join(",\n");
  return true;
}

function filterContainer(container) {
  container.each((node) => {
    if (node.type === "rule" && !retainComponentSelectors(node)) {
      node.remove();
      return;
    }
    if (node.type === "atrule") {
      if (node.name === "keyframes" || node.name.endsWith("keyframes")) {
        if (!node.params.startsWith("gummy-")) node.remove();
        return;
      }
      if (node.nodes) {
        filterContainer(node);
        if (!node.nodes.length) node.remove();
      } else {
        node.remove();
      }
      return;
    }
    if (node.type === "comment") node.remove();
  });
}

filterContainer(root);
const banner = `/*
 * Generated from the seven approved benchmark component sections in
 * app/globals.css. Run npm run styles:build after editing canonical styles.
 * Page, Lab, documentation, and marketing selectors are deliberately omitted.
 */

`;
await writeFile(targetPath, `${banner}${root.toString().trim()}\n`, "utf8");
console.log("Built shared styles for Input, Badge, Card, Switch, Tabs, Dropdown Menu, and Dialog.");
