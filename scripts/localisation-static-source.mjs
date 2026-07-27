import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { sha256, stableJson } from "./localisation-contract.mjs";

export const staticCoverageSchemaVersion = "1.0";

const excludedRoutePrefixes = [
  "app/account/",
];
const excludedRouteFiles = new Set([
  "app/checkout/page.tsx",
  "app/sign-in/page.tsx",
]);
const visibleAttributeNames = new Set([
  "accessiblelabel",
  "alt",
  "aria-description",
  "aria-label",
  "caption",
  "description",
  "emptymessage",
  "eyebrow",
  "helptext",
  "hint",
  "label",
  "lede",
  "placeholder",
  "text",
  "title",
]);
const visiblePropertyNames = new Set([
  "accessiblelabel",
  "alt",
  "caption",
  "copy",
  "description",
  "emptymessage",
  "eyebrow",
  "helptext",
  "heading",
  "hint",
  "label",
  "lede",
  "name",
  "placeholder",
  "text",
  "title",
]);

async function listFiles(root, relativeDirectory) {
  const absoluteDirectory = path.join(root, relativeDirectory);
  const entries = await readdir(absoluteDirectory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name))) {
    const relativePath = path.posix.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(root, relativePath));
    } else {
      files.push(relativePath);
    }
  }
  return files;
}

export async function listStaticCopySourcePaths(repositoryRoot) {
  const applicationFiles = (await listFiles(repositoryRoot, "app"))
    .filter((sourcePath) => sourcePath.endsWith(".tsx"))
    .filter((sourcePath) =>
      !excludedRoutePrefixes.some((prefix) => sourcePath.startsWith(prefix)))
    .filter((sourcePath) => !excludedRouteFiles.has(sourcePath));
  return [
    ...applicationFiles,
    "app/data/pro-catalogue.public.json",
    "app/data/showcase.ts",
  ].sort((left, right) => left.localeCompare(right));
}

function normalizeVisibleText(value) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\s+([.,:;!?])/g, "$1")
    .trim();
}

function propertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) {
    return node.text.toLocaleLowerCase();
  }
  return "";
}

function jsxTagName(node) {
  if (ts.isIdentifier(node)) return node.text;
  return node.getText().replaceAll(".", "-");
}

function containingJsxTag(node) {
  let current = node.parent;
  while (current) {
    if (ts.isJsxElement(current)) {
      return jsxTagName(current.openingElement.tagName);
    }
    if (ts.isJsxSelfClosingElement(current)) {
      return jsxTagName(current.tagName);
    }
    current = current.parent;
  }
  return "content";
}

function containingScope(node) {
  let current = node.parent;
  while (current) {
    if (ts.isFunctionDeclaration(current) && current.name) {
      return current.name.text;
    }
    if (
      (ts.isArrowFunction(current) || ts.isFunctionExpression(current))
      && ts.isVariableDeclaration(current.parent)
      && ts.isIdentifier(current.parent.name)
    ) {
      return current.parent.name.text;
    }
    if (
      (ts.isMethodDeclaration(current) || ts.isMethodSignature(current))
      && current.name
    ) {
      return current.name.getText().replaceAll(/[^a-zA-Z0-9]+/g, "-");
    }
    current = current.parent;
  }
  return "module";
}

function idPart(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLocaleLowerCase()
    .replace(/\[([^\]]+)\]/g, "$1")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "content";
}

function fileId(sourcePath) {
  const withoutExtension = sourcePath
    .replace(/^app\//, "")
    .replace(/\.tsx$/, "")
    .replace(/\/page$/, ".page")
    .replace(/^page$/, "home.page");
  return withoutExtension
    .split(/[/.]/)
    .map(idPart)
    .join(".");
}

function placeholderName(expression, index, used) {
  const expressionText = expression.getText();
  const identifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(expressionText)
    ? expressionText.replaceAll("$", "")
    : "";
  const property = /(?:^|\.)([a-zA-Z_$][a-zA-Z0-9_$]*)$/.exec(expressionText)?.[1]
    ?.replaceAll("$", "");
  const base = idPart(identifier || property || `value-${index}`)
    .replaceAll("-", "") || `value${index}`;
  let candidate = /^[a-zA-Z]/.test(base) ? base : `value${index}`;
  let suffix = 2;
  while (used.has(candidate)) {
    candidate = `${base}${suffix}`;
    suffix += 1;
  }
  used.add(candidate);
  return candidate;
}

function templateSource(node) {
  if (ts.isNoSubstitutionTemplateLiteral(node)) {
    return {
      source: normalizeVisibleText(node.text),
      placeholders: [],
    };
  }
  const used = new Set();
  const placeholders = [];
  let source = node.head.text;
  node.templateSpans.forEach((span, index) => {
    const name = placeholderName(span.expression, index + 1, used);
    source += `{${name}}${span.literal.text}`;
    placeholders.push({
      name,
      type: "string",
      example: `[${span.expression.getText()}]`,
    });
  });
  return {
    source: normalizeVisibleText(source),
    placeholders,
  };
}

function extractExpressionSources(expression) {
  if (ts.isStringLiteralLike(expression)) {
    return [{
      source: normalizeVisibleText(expression.text),
      placeholders: [],
      node: expression,
    }];
  }
  if (
    ts.isTemplateExpression(expression)
    || ts.isNoSubstitutionTemplateLiteral(expression)
  ) {
    const primary = { ...templateSource(expression), node: expression };
    if (!ts.isTemplateExpression(expression)) return [primary];
    return [
      primary,
      ...expression.templateSpans.flatMap((span) =>
        extractExpressionSources(span.expression)),
    ];
  }
  if (ts.isParenthesizedExpression(expression)) {
    return extractExpressionSources(expression.expression);
  }
  if (ts.isConditionalExpression(expression)) {
    return [
      ...extractExpressionSources(expression.whenTrue),
      ...extractExpressionSources(expression.whenFalse),
    ];
  }
  if (
    ts.isBinaryExpression(expression)
    && (
      expression.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
      || expression.operatorToken.kind === ts.SyntaxKind.BarBarToken
    )
  ) {
    return [
      ...extractExpressionSources(expression.left),
      ...extractExpressionSources(expression.right),
    ];
  }
  return [];
}

function hasHumanCopy(source) {
  const lexicalSource = source
    .replaceAll(/\{[a-zA-Z][a-zA-Z0-9]*\}/g, "")
    .replaceAll(/<\/?[a-zA-Z][a-zA-Z0-9]*>/g, "");
  return /[\p{L}\p{N}]/u.test(lexicalSource)
    && !/^#[a-f0-9]{3,8}$/i.test(lexicalSource);
}

function literalKind(node) {
  const tag = containingJsxTag(node).toLocaleLowerCase();
  if (tag === "code" || tag === "kbd") return "code";
  return "plain";
}

const richTextTags = new Set([
  "a",
  "code",
  "em",
  "kbd",
  "link",
  "span",
  "strong",
]);
const textContainerTags = new Set([
  "a",
  "button",
  "dd",
  "dt",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "label",
  "li",
  "link",
  "p",
  "span",
]);

function flattenRichTextElement(element) {
  const tagName = jsxTagName(element.openingElement.tagName).toLocaleLowerCase();
  if (!textContainerTags.has(tagName)) return null;
  let nestedIndex = 0;
  let dynamicIndex = 0;
  let source = "";
  let hasLiteral = false;
  let hasRelationship = false;
  const placeholders = [];
  const protectedSpans = [];
  const usedNames = new Set();

  function appendChildren(children, nested = false) {
    for (const child of children) {
      if (ts.isJsxText(child)) {
        const text = child.getFullText();
        source += text;
        hasLiteral ||= hasHumanCopy(normalizeVisibleText(text));
        continue;
      }
      if (ts.isJsxExpression(child) && child.expression) {
        const extracted = (
          ts.isTemplateExpression(child.expression)
          || ts.isNoSubstitutionTemplateLiteral(child.expression)
        )
          ? [{ ...templateSource(child.expression), node: child.expression }]
          : extractExpressionSources(child.expression);
        if (extracted.length === 1) {
          source += extracted[0].source;
          placeholders.push(...extracted[0].placeholders);
          hasLiteral ||= hasHumanCopy(extracted[0].source);
          hasRelationship = true;
          continue;
        }
        dynamicIndex += 1;
        const name = placeholderName(child.expression, dynamicIndex, usedNames);
        source += `{${name}}`;
        placeholders.push({
          name,
          type: "string",
          example: `[${child.expression.getText()}]`,
        });
        hasRelationship = true;
        continue;
      }
      if (ts.isJsxElement(child)) {
        const childTag = jsxTagName(child.openingElement.tagName).toLocaleLowerCase();
        if (!richTextTags.has(childTag)) return false;
        nestedIndex += 1;
        const marker = `${idPart(childTag)}${nestedIndex}`;
        source += `<${marker}>`;
        protectedSpans.push(
          { value: `<${marker}>`, reason: "rich-text-marker" },
          { value: `</${marker}>`, reason: "rich-text-marker" },
        );
        if (!appendChildren(child.children, true)) return false;
        source += `</${marker}>`;
        hasRelationship = true;
        continue;
      }
      if (ts.isJsxSelfClosingElement(child)) {
        dynamicIndex += 1;
        const name = `component${dynamicIndex}`;
        source += `{${name}}`;
        placeholders.push({
          name,
          type: "rich-text-node",
          example: `[${jsxTagName(child.tagName)}]`,
        });
        hasRelationship = true;
        continue;
      }
      if (nested) return false;
    }
    return true;
  }

  if (!appendChildren(element.children)) return null;
  const normalized = normalizeVisibleText(source);
  if (!hasLiteral || !hasRelationship || !hasHumanCopy(normalized)) return null;
  return {
    source: normalized,
    placeholders,
    protectedSpans,
  };
}

function containingRichTextRoot(node) {
  let current = node.parent;
  while (current) {
    if (ts.isJsxElement(current) && flattenRichTextElement(current)) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

function sourceLine(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function isProtectedIdentifier(source, contentType) {
  return contentType === "code"
    || /^(?:[A-Z][A-Z0-9.+/-]{1,}|[\d.]+(?:px|%|ms|kb|mb|gb))$/.test(source);
}

function extractTsxCandidates(sourcePath, sourceText) {
  const sourceFile = ts.createSourceFile(
    sourcePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const candidates = [];
  const ordinals = new Map();

  function addCandidate(
    node,
    rawSource,
    kind,
    placeholders = [],
    options = {},
  ) {
    const source = normalizeVisibleText(rawSource);
    if (!source || !hasHumanCopy(source)) return;
    const scope = idPart(containingScope(node));
    const semanticKind = idPart(kind);
    const ordinalKey = `${scope}.${semanticKind}`;
    const ordinal = (ordinals.get(ordinalKey) ?? 0) + 1;
    ordinals.set(ordinalKey, ordinal);
    const line = sourceLine(sourceFile, node);
    const contentType = options.contentType ?? literalKind(node);
    const protectedIdentifier = isProtectedIdentifier(source, contentType);
    const id = [
      "static",
      fileId(sourcePath),
      scope,
      semanticKind,
      String(ordinal).padStart(2, "0"),
    ].join(".");
    candidates.push({
      key: `${sourcePath}:${node.getStart(sourceFile)}:${semanticKind}:${sha256(source).slice(0, 12)}`,
      id,
      source,
      description: `Static ${kind.replaceAll("-", " ")} copy in ${sourcePath}, ${scope} scope.`,
      translatable: !protectedIdentifier,
      contentType: protectedIdentifier
        ? contentType === "code" ? "code" : "identifier"
        : contentType,
      placeholders,
      protectedSpans: [
        ...placeholders.map(({ name }) => ({
          value: `{${name}}`,
          reason: "runtime-placeholder",
        })),
        ...(options.protectedSpans ?? []),
        ...(protectedIdentifier
          ? [{ value: source, reason: contentType === "code" ? "code-or-command" : "identifier" }]
          : []),
      ],
      sourceReferences: [`${sourcePath}:${line}`],
    });
  }

  function visit(node) {
    if (ts.isJsxElement(node)) {
      const richText = flattenRichTextElement(node);
      const parentRichText = containingRichTextRoot(node);
      if (richText && !parentRichText) {
        addCandidate(
          node,
          richText.source,
          `rich-${jsxTagName(node.openingElement.tagName)}`,
          richText.placeholders,
          {
            contentType: "rich-text",
            protectedSpans: richText.protectedSpans,
          },
        );
      }
    } else if (ts.isJsxText(node)) {
      if (containingRichTextRoot(node)) {
        ts.forEachChild(node, visit);
        return;
      }
      addCandidate(
        node,
        node.getFullText(sourceFile),
        `jsx-${containingJsxTag(node)}`,
      );
    } else if (ts.isJsxAttribute(node)) {
      const name = propertyName(node.name);
      if (visibleAttributeNames.has(name) && node.initializer) {
        if (ts.isStringLiteral(node.initializer)) {
          addCandidate(node.initializer, node.initializer.text, `attribute-${name}`);
        } else if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
          for (const extracted of extractExpressionSources(node.initializer.expression)) {
            addCandidate(
              extracted.node,
              extracted.source,
              `attribute-${name}`,
              extracted.placeholders,
            );
          }
        }
      }
    } else if (ts.isPropertyAssignment(node)) {
      const name = propertyName(node.name);
      if (visiblePropertyNames.has(name)) {
        for (const extracted of extractExpressionSources(node.initializer)) {
          addCandidate(
            extracted.node,
            extracted.source,
            `property-${name}`,
            extracted.placeholders,
          );
        }
      }
    } else if (
      ts.isJsxExpression(node)
      && node.expression
      && ts.isConditionalExpression(node.expression)
      && (
        ts.isJsxElement(node.parent)
        || ts.isJsxFragment(node.parent)
      )
    ) {
      if (containingRichTextRoot(node)) {
        for (const extracted of extractExpressionSources(node.expression)) {
          addCandidate(
            extracted.node,
            extracted.source,
            `rich-variant-${containingJsxTag(node)}`,
            extracted.placeholders,
          );
        }
        ts.forEachChild(node, visit);
        return;
      }
      for (const extracted of extractExpressionSources(node.expression)) {
        addCandidate(
          extracted.node,
          extracted.source,
          `jsx-${containingJsxTag(node)}`,
          extracted.placeholders,
        );
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return candidates;
}

function extractProMetadataCandidates(sourcePath, sourceText) {
  const metadata = JSON.parse(sourceText);
  const candidates = [];
  function add(
    id,
    source,
    description,
    sourceReference,
    { translatable = true, contentType = "plain" } = {},
  ) {
    candidates.push({
      key: `${sourceReference}:${sha256(source).slice(0, 12)}`,
      id: `static.pro-metadata.${id}`,
      source,
      description,
      translatable,
      contentType,
      placeholders: [],
      protectedSpans: translatable
        ? []
        : [{ value: source, reason: contentType === "code" ? "code-or-command" : "identifier" }],
      sourceReferences: [sourceReference],
    });
  }
  for (const category of metadata.categories) {
    add(
      `category.${idPart(category.slug)}.name`,
      category.name,
      `Public display name for the ${category.slug} Pro block category.`,
      `${sourcePath}#/categories/${category.slug}/name`,
    );
    add(
      `category.${idPart(category.slug)}.purpose`,
      category.purpose,
      `Public purpose copy for the ${category.slug} Pro block category.`,
      `${sourcePath}#/categories/${category.slug}/purpose`,
    );
  }
  for (const block of metadata.blocks) {
    add(
      `block.${idPart(block.id)}.name`,
      block.name,
      `Public display name for ${block.id}.`,
      `${sourcePath}#/blocks/${block.id}/name`,
    );
    add(
      `block.${idPart(block.id)}.purpose`,
      block.purpose,
      `Public purpose copy for ${block.id}.`,
      `${sourcePath}#/blocks/${block.id}/purpose`,
    );
    for (const [field, values] of [
      ["dependencies", block.dependencies],
      ["requirements", block.requirements],
      ["status", [block.status]],
    ]) {
      values.forEach((value, index) => add(
        `block.${idPart(block.id)}.${field}.${String(index + 1).padStart(2, "0")}`,
        value,
        `Protected public ${field} identifier for ${block.id}.`,
        `${sourcePath}#/blocks/${block.id}/${field}/${index}`,
        { translatable: false, contentType: "identifier" },
      ));
    }
  }
  for (const template of metadata.templates) {
    add(
      `template.${idPart(template.id)}.name`,
      template.name,
      `Public display name for ${template.id}.`,
      `${sourcePath}#/templates/${template.id}/name`,
    );
    add(
      `template.${idPart(template.id)}.brief`,
      template.brief,
      `Public product brief for ${template.id}.`,
      `${sourcePath}#/templates/${template.id}/brief`,
    );
    for (const [field, values, contentType] of [
      ["routes", template.routes, "code"],
      ["states", template.states, "identifier"],
      ["requirements", template.requirements, "identifier"],
      ["status", [template.status], "identifier"],
    ]) {
      values.forEach((value, index) => add(
        `template.${idPart(template.id)}.${field}.${String(index + 1).padStart(2, "0")}`,
        value,
        `Protected public ${field} value for ${template.id}.`,
        `${sourcePath}#/templates/${template.id}/${field}/${index}`,
        { translatable: false, contentType },
      ));
    }
  }
  return candidates;
}

export async function extractStaticCopyCandidates(repositoryRoot) {
  const sourcePaths = await listStaticCopySourcePaths(repositoryRoot);
  const candidates = [];
  for (const sourcePath of sourcePaths) {
    const sourceText = await readFile(path.join(repositoryRoot, sourcePath), "utf8");
    if (sourcePath.endsWith(".tsx") || sourcePath.endsWith(".ts")) {
      candidates.push(...extractTsxCandidates(sourcePath, sourceText));
    } else if (sourcePath === "app/data/pro-catalogue.public.json") {
      candidates.push(...extractProMetadataCandidates(sourcePath, sourceText));
    }
  }
  assert.equal(
    new Set(candidates.map(({ key }) => key)).size,
    candidates.length,
    "Static-copy candidate keys must be unique.",
  );
  assert.equal(
    new Set(candidates.map(({ id }) => id)).size,
    candidates.length,
    "Static-copy candidate IDs must be unique.",
  );
  return { sourcePaths, candidates };
}

export function auditStaticCopyCoverage({
  sourcePaths,
  candidates,
  coverage,
}) {
  const uncaptured = candidates
    .filter(({ key }) => !coverage.has(key))
    .map(({ key, id, sourceReferences }) => ({ key, id, sourceReferences }));
  const fileCandidateCounts = Object.fromEntries(
    sourcePaths.map((sourcePath) => [
      sourcePath,
      candidates.filter(({ sourceReferences }) =>
        sourceReferences.some((reference) =>
          reference === sourcePath
          || reference.startsWith(`${sourcePath}:`)
          || reference.startsWith(`${sourcePath}#`))).length,
    ]),
  );
  return {
    schemaVersion: staticCoverageSchemaVersion,
    extractor: "scripts/localisation-static-source.mjs",
    scope: {
      included: [
        "public app TSX route metadata and rendered JSX copy",
        "shared and canonical interactive TSX surface copy",
        "boundary-safe Pro category, block, and template display metadata",
        "future structured community showcase entries",
      ],
      excludedAsSeparatelyStructured: [
        "app/account/**",
        "app/checkout/page.tsx",
        "app/sign-in/page.tsx",
      ],
      limitations: [
        "The audit is static and cannot prove copy assembled only at runtime, returned by a remote provider, or hidden behind arbitrary computed expressions.",
        "String values are candidates only in JSX text, visible/accessibility attributes, recognised display-data properties, and approved boundary-safe metadata fields.",
        "Coverage is an English source contract; it does not provide runtime translation, linguistic review, rendered locale QA, or publication evidence.",
      ],
    },
    scannedFileCount: sourcePaths.length,
    scannedFiles: sourcePaths,
    candidateCount: candidates.length,
    coveredCandidateCount: candidates.length - uncaptured.length,
    uncapturedCandidateCount: uncaptured.length,
    uncaptured,
    fileCandidateCounts,
    candidateChecksum: sha256(stableJson(candidates.map((candidate) => ({
      key: candidate.key,
      id: candidate.id,
      source: candidate.source,
      sourceReferences: candidate.sourceReferences,
    })))),
  };
}

export function assertStaticCopyCoverage(audit) {
  assert.equal(audit.schemaVersion, staticCoverageSchemaVersion);
  assert.equal(audit.scannedFileCount, audit.scannedFiles.length);
  assert.equal(
    audit.coveredCandidateCount + audit.uncapturedCandidateCount,
    audit.candidateCount,
  );
  assert.equal(
    audit.uncapturedCandidateCount,
    0,
    `Uncaptured static localisation copy:\n${audit.uncaptured
      .map(({ id, sourceReferences }) => `- ${id} (${sourceReferences.join(", ")})`)
      .join("\n")}`,
  );
  assert.deepEqual(audit.uncaptured, []);
  assert.match(audit.candidateChecksum, /^[a-f0-9]{64}$/);
  return audit;
}
