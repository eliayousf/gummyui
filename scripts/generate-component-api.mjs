import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { components } from "../app/data/catalogue.ts";

const projectRoot = path.resolve(import.meta.dirname, "..");
const outputPath = path.join(
  projectRoot,
  "app",
  "data",
  "component-api.generated.json",
);
const typePrinter = ts.createPrinter({ removeComments: true });

function isExported(node) {
  return node.modifiers?.some(
    (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
  ) ?? false;
}

function cleanTypeText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function printTypeNode(node, sourceFile) {
  return cleanTypeText(
    typePrinter.printNode(ts.EmitHint.Unspecified, node, sourceFile),
  );
}

function propertyFromMember(member, sourceFile) {
  if (!ts.isPropertySignature(member) && !ts.isMethodSignature(member)) {
    return undefined;
  }
  const name = member.name?.getText(sourceFile);
  if (!name) return undefined;
  const type = member.type
    ? printTypeNode(member.type, sourceFile)
    : ts.isMethodSignature(member)
      ? "method"
      : "unknown";
  return {
    name,
    optional: Boolean(member.questionToken),
    type,
  };
}

function declarationContainsForwardRef(node) {
  let found = false;
  function visit(child) {
    if (
      ts.isPropertyAccessExpression(child) &&
      child.name.text === "forwardRef"
    ) {
      found = true;
      return;
    }
    if (
      ts.isIdentifier(child) &&
      child.text === "forwardRef"
    ) {
      found = true;
      return;
    }
    ts.forEachChild(child, visit);
  }
  visit(node);
  return found;
}

function inspectSource(sourceText, sourcePath) {
  const sourceFile = ts.createSourceFile(
    sourcePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const components = [];
  const hooks = [];
  const types = [];

  for (const statement of sourceFile.statements) {
    if (!isExported(statement)) continue;

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          declaration.initializer &&
          declarationContainsForwardRef(declaration.initializer)
        ) {
          components.push(declaration.name.text);
        }
      }
      continue;
    }

    if (ts.isFunctionDeclaration(statement) && statement.name) {
      if (/^[A-Z]/.test(statement.name.text)) {
        components.push(statement.name.text);
      } else if (/^use[A-Z]/.test(statement.name.text)) {
        hooks.push(statement.name.text);
      }
      continue;
    }

    if (ts.isInterfaceDeclaration(statement)) {
      const ownProps = statement.members
        .map((member) => propertyFromMember(member, sourceFile))
        .filter(Boolean);
      types.push({
        name: statement.name.text,
        extends: statement.heritageClauses?.flatMap((clause) =>
          clause.types.map((type) => printTypeNode(type, sourceFile)),
        ) ?? [],
        props: ownProps,
      });
      continue;
    }

    if (ts.isTypeAliasDeclaration(statement)) {
      const ownProps = ts.isTypeLiteralNode(statement.type)
        ? statement.type.members
          .map((member) => propertyFromMember(member, sourceFile))
          .filter(Boolean)
        : [];
      types.push({
        name: statement.name.text,
        extends: ts.isTypeLiteralNode(statement.type)
          ? []
          : [printTypeNode(statement.type, sourceFile)],
        props: ownProps,
      });
    }
  }

  return {
    components: [...new Set(components)].sort(),
    hooks: [...new Set(hooks)].sort(),
    types: types
      .filter(({ name }) => name.endsWith("Props"))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

const records = [];
for (const component of components) {
  const sourceText = await readFile(
    path.join(projectRoot, component.source),
    "utf8",
  );
  const inspected = inspectSource(sourceText, component.source);
  if (inspected.components.length === 0) {
    throw new Error(
      `${component.slug} exposes no source-derived React component anatomy.`,
    );
  }
  records.push({
    slug: component.slug,
    source: component.source,
    ...inspected,
  });
}

const output = {
  schemaVersion: "1.0",
  generatedFrom: "app/data/catalogue.ts and canonical component source",
  count: records.length,
  records,
};

const serialized = `${JSON.stringify(output, null, 2)}\n`;
if (process.argv.includes("--check")) {
  const current = await readFile(outputPath, "utf8");
  if (current !== serialized) {
    throw new Error(
      "Source-derived component API documentation is stale. Run npm run docs:api.",
    );
  }
  console.log(
    `Source-derived anatomy and API records are current for ${records.length} public components.`,
  );
} else {
  await writeFile(outputPath, serialized, "utf8");
  console.log(
    `Generated source-derived anatomy and API records for ${records.length} public components.`,
  );
}
