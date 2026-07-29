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
const componentDocsStylesheetNames = [
  "gummy-core-components.css",
  "gummy-form-controls.css",
  "gummy-primitives.css",
  "gummy-radix-compat.css",
  "component-inspector.css",
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
const themeBuilderCoreSelectors = [
  ".gummy-badge",
  ".gummy-card",
  ".gummy-switch",
];
const themeBuilderCoreKeyframePrefixes = [
  "gummy-badge-",
  "gummy-card-",
  "gummy-switch-",
];
const themeBuilderPrimitiveSelectors = [
  ".gummy-progress",
];
const themeBuilderPrimitiveKeyframePrefixes = [
  "gummy-progress-",
];
const rtlComponentSelectors = [
  ".gummy-direction",
  ".gummy-slider",
  ".gummy-pagination",
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

function filterComponentStyles(
  container,
  {
    componentSelectors,
    keyframePrefixes,
  },
) {
  container.each((node) => {
    if (node.type === "rule") {
      const selectors = splitSelectorList(node.selector).filter((selector) =>
        !selector.startsWith("button:focus-visible:not(")
          && !selector.startsWith("input:focus-visible:not(")
          && !selector.startsWith("a:focus-visible:not(")
          && componentSelectors.some((componentSelector) =>
            selector.includes(componentSelector)),
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
        if (!keyframePrefixes.some((prefix) => node.params.startsWith(prefix))) {
          node.remove();
        }
        return;
      }
      if (!node.nodes) {
        node.remove();
        return;
      }
      filterComponentStyles(node, {
        componentSelectors,
        keyframePrefixes,
      });
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
filterComponentStyles(showcaseRoot, {
  componentSelectors: showcaseComponentSelectors,
  keyframePrefixes: showcaseKeyframePrefixes,
});
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

const themeBuilderCoreRoot = postcss.parse(coreSource, {
  from: coreSourcePath,
});
filterComponentStyles(themeBuilderCoreRoot, {
  componentSelectors: themeBuilderCoreSelectors,
  keyframePrefixes: themeBuilderCoreKeyframePrefixes,
});
const primitivesSourcePath = path.join(
  repositoryRoot,
  "app",
  "styles",
  "gummy-primitives.css",
);
const primitivesSource = await readFile(primitivesSourcePath, "utf8");
const themeBuilderPrimitiveRoot = postcss.parse(primitivesSource, {
  from: primitivesSourcePath,
});
filterComponentStyles(themeBuilderPrimitiveRoot, {
  componentSelectors: themeBuilderPrimitiveSelectors,
  keyframePrefixes: themeBuilderPrimitiveKeyframePrefixes,
});
await syncPublicStylesheet(
  "theme-builder-components.css",
  `/*
 * Generated from the canonical Badge, Card, Switch, and Progress rules for
 * /themes. Full component libraries remain available to documentation and
 * registry consumers, but are intentionally not loaded by the Theme Builder.
 * Do not edit this public copy.
 */

@layer gummy-theme-builder-components {
/* app/styles/gummy-core-components.css */
${themeBuilderCoreRoot.toString().trim()}

/* app/styles/gummy-primitives.css */
${themeBuilderPrimitiveRoot.toString().trim()}
}
`,
);

const rtlRoot = postcss.parse(primitivesSource, {
  from: primitivesSourcePath,
});
filterComponentStyles(rtlRoot, {
  componentSelectors: rtlComponentSelectors,
  keyframePrefixes: [],
});
await syncPublicStylesheet(
  "rtl-components.css",
  `/*
 * Generated from the canonical Direction, Slider, and Pagination rules for
 * /rtl. The complete primitive library remains available to documentation and
 * registry consumers, but is intentionally not loaded by this focused route.
 * Do not edit this public copy.
 */

@layer gummy-rtl-components {
${rtlRoot.toString().trim()}
}
`,
);

const componentDocsSections = await Promise.all(
  componentDocsStylesheetNames.map(async (name) => {
    const source = await readFile(
      path.join(repositoryRoot, "app", "styles", name),
      "utf8",
    );
    return `/* app/styles/${name} */\n${source.trim()}`;
  }),
);
await syncPublicStylesheet(
  "component-docs.css",
  `/*
 * Generated component-documentation bundle.
 * Source order matches the previous route-scoped stylesheet links.
 * Individual public stylesheets remain available to registry consumers.
 * Do not edit this public copy.
 */

${componentDocsSections.join("\n\n")}
`,
);

console.log(
  `${checkOnly ? "Verified" : "Built"} ${stylesheetNames.length + 5} route-scoped public stylesheets.`,
);
