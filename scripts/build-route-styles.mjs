import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import postcss from "postcss";

const repositoryRoot = process.cwd();
const checkOnly = process.argv.includes("--check");
const stylesheetNames = [
  "gummy-form-controls.css",
  "gummy-primitives.css",
  "gummy-radix-compat.css",
  "component-inspector.css",
  "frame-studio.css",
  "component-lab.css",
];

const showcaseComponentSelectors = [
  ".gummy-input",
  ".gummy-badge",
  ".gummy-card",
  ".gummy-switch",
  ".gummy-tabs",
];
const showcaseKeyframePrefixes = [
  "gummy-badge-",
  "gummy-card-",
  "gummy-tabs-",
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

function filterShowcaseStyles(container) {
  container.each((node) => {
    if (node.type === "rule") {
      const selectors = splitSelectorList(node.selector).filter((selector) =>
        !selector.startsWith("button:focus-visible:not(")
          && !selector.startsWith("input:focus-visible:not(")
          && !selector.startsWith("a:focus-visible:not(")
          && showcaseComponentSelectors.some((componentSelector) => selector.includes(componentSelector)),
      );
      if (!selectors.length) {
        node.remove();
        return;
      }
      node.selector = selectors.join(",\n");
      return;
    }

    if (node.type === "atrule") {
      if (node.name === "keyframes" || node.name.endsWith("keyframes")) {
        if (!showcaseKeyframePrefixes.some((prefix) => node.params.startsWith(prefix))) {
          node.remove();
        }
        return;
      }
      if (!node.nodes) {
        node.remove();
        return;
      }
      filterShowcaseStyles(node);
      if (!node.nodes.length) node.remove();
      return;
    }

    if (node.type === "comment") node.remove();
  });
}

async function syncPublicStylesheet(name, content) {
  const publicPath = path.join(repositoryRoot, "public", "styles", name);

  if (checkOnly) {
    const current = await readFile(publicPath, "utf8");
    assert.equal(current, content, `${publicPath} is stale; run npm run styles:routes.`);
    return;
  }

  await mkdir(path.dirname(publicPath), { recursive: true });
  await writeFile(publicPath, content);
}

for (const name of stylesheetNames) {
  const sourcePath = path.join(repositoryRoot, "app", "styles", name);
  const source = await readFile(sourcePath, "utf8");
  await syncPublicStylesheet(
    name,
    `/* Generated from app/styles/${name}. Do not edit this public copy. */\n${source}`,
  );
}

const coreSourcePath = path.join(repositoryRoot, "app", "styles", "gummy-core-components.css");
const coreSource = await readFile(coreSourcePath, "utf8");
await syncPublicStylesheet(
  "gummy-core-components.css",
  `/*
 * Generated from app/styles/gummy-core-components.css for routes that render
 * the full canonical component family. The layer preserves page-level
 * composition overrides regardless of stylesheet discovery order.
 * Do not edit this public copy.
 */

@layer gummy-core-components {
${coreSource.trim()}
}
`,
);

const showcaseRoot = postcss.parse(coreSource, {
  from: coreSourcePath,
});
filterShowcaseStyles(showcaseRoot);
await syncPublicStylesheet(
  "showcase-components.css",
  `/*
 * Generated from app/styles/gummy-core-components.css for the homepage.
 * Includes Input, Badge, Card, Switch, Tabs, and their responsive/motion rules.
 * Do not edit this public copy.
 */

@layer gummy-showcase-components {
${showcaseRoot.toString().trim()}
}
`,
);

console.log(
  `${checkOnly ? "Verified" : "Built"} ${stylesheetNames.length + 2} route-scoped public stylesheets.`,
);
