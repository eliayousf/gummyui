import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import {
  localisationSchemaVersion,
  sha256,
  stableJson,
  validateLocaleManifest,
  validateReviewHandoff,
  validateSourceBundle,
  validateSourceManifest,
} from "./localisation-contract.mjs";
import {
  assertStaticCopyCoverage,
  auditStaticCopyCoverage,
  extractStaticCopyCandidates,
} from "./localisation-static-source.mjs";

const repositoryRoot = process.cwd();
const outputRoot = path.join(repositoryRoot, "app", "i18n", "generated");
const checkOnly = process.argv.includes("--check");

const structuredSourcePaths = [
  "app/components/LocaleSwitcher.tsx",
  "app/components/PublicTextPage.tsx",
  "app/components/SiteChrome.tsx",
  "app/data/articles.ts",
  "app/data/catalogue.ts",
  "app/data/changelog.ts",
  "app/data/component-api.generated.json",
  "app/data/locales.ts",
  "app/data/markdown-docs.ts",
  "app/data/subprocessors.ts",
  "app/layout.tsx",
  "app/page.tsx",
  "lib/commerce/account.ts",
];
const staticCopySource = await extractStaticCopyCandidates(repositoryRoot);
const sourcePaths = [
  ...new Set([
    ...structuredSourcePaths,
    ...staticCopySource.sourcePaths,
  ]),
].sort((left, right) => left.localeCompare(right));

async function importTypeScript(relativePath) {
  return import(pathToFileURL(path.join(repositoryRoot, relativePath)).href);
}

async function loadMarkdownData(catalogue) {
  const temporaryRoot = await mkdtemp(
    path.join(tmpdir(), "gummy-localisation-source-"),
  );
  try {
    const [markdownTypeScript, componentApiSource] = await Promise.all([
      readFile(
        path.join(repositoryRoot, "app", "data", "markdown-docs.ts"),
        "utf8",
      ),
      readFile(
        path.join(
          repositoryRoot,
          "app",
          "data",
          "component-api.generated.json",
        ),
        "utf8",
      ),
    ]);
    const componentApi = JSON.parse(componentApiSource);
    const catalogueModule = [
      `export const catalogueGroups = ${JSON.stringify(catalogue.catalogueGroups)};`,
      `export const components = ${JSON.stringify(catalogue.components)};`,
      `export const componentCount = ${catalogue.componentCount};`,
      "export function getComponent(slug) { return components.find((entry) => entry.slug === slug); }",
    ].join("\n");
    const apiModule = [
      `export const componentApiRecords = ${JSON.stringify(componentApi.records)};`,
      `export const componentApiCount = ${componentApi.count};`,
      "export function getComponentApi(slug) { return componentApiRecords.find((record) => record.slug === slug); }",
    ].join("\n");
    const transpiled = ts.transpileModule(markdownTypeScript, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
      },
      fileName: "markdown-docs.ts",
      reportDiagnostics: true,
    });
    const errors = (transpiled.diagnostics ?? []).filter(
      ({ category }) => category === ts.DiagnosticCategory.Error,
    );
    assert.equal(errors.length, 0, "Unable to transpile Markdown source data.");
    const markdownModule = transpiled.outputText
      .replaceAll('from "./catalogue"', 'from "./catalogue.mjs"')
      .replaceAll("from './catalogue'", "from './catalogue.mjs'")
      .replaceAll('from "./component-api"', 'from "./component-api.mjs"')
      .replaceAll("from './component-api'", "from './component-api.mjs'");

    await Promise.all([
      writeFile(path.join(temporaryRoot, "catalogue.mjs"), catalogueModule),
      writeFile(path.join(temporaryRoot, "component-api.mjs"), apiModule),
      writeFile(path.join(temporaryRoot, "markdown-docs.mjs"), markdownModule),
    ]);
    const loadedModule = await import(
      pathToFileURL(path.join(temporaryRoot, "markdown-docs.mjs")).href
    );
    return {
      guideSlugs: loadedModule.markdownGuideSlugs,
      renderGuideMarkdown: loadedModule.renderGuideMarkdown,
    };
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

function protectedSpansFor(source) {
  const candidates = [
    ...source.matchAll(/https?:\/\/[^\s)\]]+/g),
    ...source.matchAll(/`[^`]+`/g),
    ...source.matchAll(/\bGummy UI\b/g),
  ].map(([value]) => ({
    value,
    reason: value === "Gummy UI"
      ? "product-name"
      : value.startsWith("`")
        ? "code-or-command"
        : "url",
  }));
  return candidates.filter(
    (candidate, index, all) =>
      all.findIndex(
        ({ value, reason }) =>
          value === candidate.value && reason === candidate.reason,
      ) === index,
  );
}

const records = [];

function addMessage({
  id,
  category,
  contentType = "plain",
  source,
  description,
  translatable = true,
  placeholders = [],
  sourceReferences,
  protectedSpans = protectedSpansFor(source),
}) {
  assert.ok(source.trim(), `${id} has empty English source.`);
  records.push({
    id,
    category,
    contentType,
    source,
    description,
    translatable,
    placeholders,
    protectedSpans,
    sourceReferences,
  });
}

const coreMessages = [
  ["core.skip-link", "Skip to content", "Shared keyboard bypass link.", "app/components/PublicTextPage.tsx"],
  ["core.brand.home-label", "Gummy UI home", "Accessible name for the home brand link.", "app/components/SiteChrome.tsx"],
  ["core.navigation.primary-label", "Primary navigation", "Accessible name for the primary navigation.", "app/components/SiteChrome.tsx"],
  ["core.navigation.docs", "Docs", "Primary and footer navigation label.", "app/components/SiteChrome.tsx"],
  ["core.navigation.components", "Components", "Primary and footer navigation label.", "app/components/SiteChrome.tsx"],
  ["core.navigation.themes", "Themes", "Primary and footer navigation label.", "app/components/SiteChrome.tsx"],
  ["core.navigation.studio", "Studio", "Primary navigation label.", "app/components/SiteChrome.tsx"],
  ["core.navigation.community", "Community", "Primary and footer navigation label.", "app/components/SiteChrome.tsx"],
  ["core.navigation.articles", "Articles", "Primary and footer navigation label.", "app/components/SiteChrome.tsx"],
  ["core.navigation.registry", "Registry", "Primary and footer navigation label.", "app/components/SiteChrome.tsx"],
  ["core.navigation.pro", "Pro", "Primary navigation label.", "app/components/SiteChrome.tsx"],
  ["core.theme.toggle-label", "Toggle light and dark theme", "Accessible name for the theme control.", "app/components/SiteChrome.tsx"],
  ["core.theme.short-label", "Theme", "Visible compact theme-control label.", "app/components/SiteChrome.tsx"],
  ["core.locale.current-label", "Language: {language}", "Accessible name for the current-language control.", "app/components/LocaleSwitcher.tsx", [{ name: "language", type: "string", example: "English" }]],
  ["core.locale.published-heading", "Published language", "Heading above routeable locale links.", "app/components/LocaleSwitcher.tsx"],
  ["core.locale.pending-count", "{count} more locales are awaiting founder review and publication.", "Status explaining unavailable target locales.", "app/components/LocaleSwitcher.tsx", [{ name: "count", type: "number", example: 19 }]],
  ["core.locale.translation-status", "Translation status", "Link to the public language status page.", "app/components/LocaleSwitcher.tsx"],
  ["core.footer.navigation-label", "Footer navigation", "Accessible name for footer links.", "app/components/SiteChrome.tsx"],
  ["core.footer.description", "Open-source React components with tactile material, accessible behavior, and editable source.", "Public footer product description.", "app/components/SiteChrome.tsx"],
  ["core.footer.nextjs", "Next.js", "Footer guide label.", "app/components/SiteChrome.tsx"],
  ["core.footer.vite", "Vite", "Footer guide label.", "app/components/SiteChrome.tsx"],
  ["core.footer.editor-setup", "Editor setup", "Footer guide label.", "app/components/SiteChrome.tsx"],
  ["core.footer.troubleshooting", "Troubleshooting", "Footer guide label.", "app/components/SiteChrome.tsx"],
  ["core.footer.frame-studio", "Frame studio", "Footer navigation label.", "app/components/SiteChrome.tsx"],
  ["core.footer.rss", "RSS", "Footer feed label.", "app/components/SiteChrome.tsx"],
  ["core.footer.changelog-rss", "Changelog RSS", "Footer changelog feed label.", "app/components/SiteChrome.tsx"],
  ["core.footer.rtl", "RTL", "Footer right-to-left demonstration label.", "app/components/SiteChrome.tsx"],
  ["core.footer.pro-status", "Pro status", "Footer status-page label.", "app/components/SiteChrome.tsx"],
  ["core.footer.accessibility", "Accessibility", "Footer status-page label.", "app/components/SiteChrome.tsx"],
  ["core.footer.languages", "Languages", "Footer language-status label.", "app/components/SiteChrome.tsx"],
  ["core.footer.security", "Security", "Footer status-page label.", "app/components/SiteChrome.tsx"],
  ["core.footer.support", "Support", "Footer status-page label.", "app/components/SiteChrome.tsx"],
  ["core.footer.contact-status", "Contact status", "Footer status-page label.", "app/components/SiteChrome.tsx"],
  ["core.footer.refund-status", "Refund status", "Footer status-page label.", "app/components/SiteChrome.tsx"],
  ["core.footer.pro-licence-status", "Pro licence status", "Footer status-page label.", "app/components/SiteChrome.tsx"],
  ["core.footer.design-kit-status", "Design kit status", "Footer status-page label.", "app/components/SiteChrome.tsx"],
  ["core.footer.privacy", "Privacy", "Footer policy label.", "app/components/SiteChrome.tsx"],
  ["core.footer.terms-status", "Terms status", "Footer status-page label.", "app/components/SiteChrome.tsx"],
  ["core.footer.mit-licence", "MIT licence", "Footer licence label.", "app/components/SiteChrome.tsx"],
  ["core.metadata.site-title", "Gummy UI · Deliberately designed React components", "Default document title.", "app/layout.tsx"],
  ["core.metadata.site-description", "Open-source React components with tactile Gel Pop material, accessible behavior, and editable source.", "Default search-result description.", "app/layout.tsx"],
  ["core.metadata.social-description", "Make vibe-coded products feel deliberately designed.", "Default Open Graph and social-card description.", "app/layout.tsx"],
  ["core.metadata.og-alt", "Gummy UI product composition", "Alternative text for the default social preview.", "app/layout.tsx"],
  ["core.metadata.home-description", "Explore 57 MIT-licensed React and TypeScript components with editable source, native or Base UI behavior, light and dark themes, RTL, and Gel Pop material.", "Home-page search-result description.", "app/page.tsx"],
];

for (const [id, source, description, sourceReference, placeholders = []] of coreMessages) {
  addMessage({
    id,
    category: "core",
    source,
    description,
    placeholders,
    sourceReferences: [sourceReference],
  });
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

function markdownToMessages(slug, markdown) {
  const lines = markdown.split("\n");
  let section = "document";
  const counters = new Map();
  const next = (kind) => {
    const key = `${section}.${kind}`;
    const count = (counters.get(key) ?? 0) + 1;
    counters.set(key, count);
    return String(count).padStart(2, "0");
  };

  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const code = [line];
      index += 1;
      while (index < lines.length) {
        code.push(lines[index]);
        const closesFence = lines[index].startsWith("```");
        index += 1;
        if (closesFence) break;
      }
      addMessage({
        id: `guide.${slug}.${section}.code.${next("code")}`,
        category: "guide",
        contentType: "code",
        source: code.join("\n"),
        description: `Protected code example in the ${slug} guide.`,
        translatable: false,
        sourceReferences: ["app/data/markdown-docs.ts"],
        protectedSpans: [{ value: code.join("\n"), reason: "code-or-command" }],
      });
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      section = slugify(heading[2].replaceAll("`", ""));
      addMessage({
        id: `guide.${slug}.${section}.heading.${next("heading")}`,
        category: "guide",
        source: heading[2],
        description: `Level ${heading[1].length} heading in the ${slug} guide.`,
        sourceReferences: ["app/data/markdown-docs.ts"],
      });
      index += 1;
      continue;
    }

    const listItem = /^(\s*(?:[-*]|\d+\.)\s+)(.+)$/.exec(line);
    if (listItem) {
      addMessage({
        id: `guide.${slug}.${section}.item.${next("item")}`,
        category: "guide",
        contentType: "markdown",
        source: listItem[2],
        description: `List item in the ${slug} guide.`,
        sourceReferences: ["app/data/markdown-docs.ts"],
      });
      index += 1;
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].startsWith("```") &&
      !/^(#{1,6})\s+/.test(lines[index]) &&
      !/^(\s*(?:[-*]|\d+\.)\s+)/.test(lines[index])
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    addMessage({
      id: `guide.${slug}.${section}.paragraph.${next("paragraph")}`,
      category: "guide",
      contentType: "markdown",
      source: paragraph.join(" "),
      description: `Paragraph in the ${slug} guide.`,
      sourceReferences: ["app/data/markdown-docs.ts"],
    });
  }
}

const [
  catalogue,
  articleData,
  changelogData,
  localeData,
  providerData,
  accountData,
] = await Promise.all([
  importTypeScript("app/data/catalogue.ts"),
  importTypeScript("app/data/articles.ts"),
  importTypeScript("app/data/changelog.ts"),
  importTypeScript("app/data/locales.ts"),
  importTypeScript("app/data/subprocessors.ts"),
  importTypeScript("lib/commerce/account.ts"),
]);
const markdownData = await loadMarkdownData(catalogue);

function kebabCase(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function addAccountCopy(value, pathParts, descriptionPrefix) {
  if (typeof value === "string") {
    addMessage({
      id: `account.${pathParts.map(kebabCase).join(".")}`,
      category: "account",
      source: value,
      description: `${descriptionPrefix} account-interface copy.`,
      sourceReferences: ["lib/commerce/account.ts"],
      protectedSpans: [
        ...protectedSpansFor(value),
        ...[...value.matchAll(/%s|\{[a-zA-Z][a-zA-Z0-9]*\}/g)].map(
          ([placeholder]) => ({
            value: placeholder,
            reason: "runtime-placeholder",
          }),
        ),
      ],
    });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      addAccountCopy(
        entry,
        [...pathParts, String(index + 1).padStart(2, "0")],
        descriptionPrefix,
      );
    });
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      addAccountCopy(entry, [...pathParts, key], descriptionPrefix);
    }
  }
}

addAccountCopy(accountData.accountPublicCopy, ["public"], "Public and gated");

for (const provider of providerData.serviceProviders) {
  const providerId = kebabCase(provider.name);
  addMessage({
    id: `static.data.subprocessors.${providerId}.name`,
    category: "static",
    contentType: "identifier",
    source: provider.name,
    description: "Protected production-provider display name.",
    translatable: false,
    sourceReferences: ["app/data/subprocessors.ts"],
    protectedSpans: [{ value: provider.name, reason: "provider-name" }],
  });
  for (const [field, source] of [
    ["service", provider.service],
    ["data-context", provider.dataContext],
    ["role", provider.role],
  ]) {
    addMessage({
      id: `static.data.subprocessors.${providerId}.${field}`,
      category: "static",
      source,
      description: `${provider.name} ${field} disclosure.`,
      sourceReferences: ["app/data/subprocessors.ts"],
    });
  }
}

for (const item of accountData.accountNavigation) {
  addMessage({
    id: `account.navigation.${kebabCase(item.key)}.label`,
    category: "account",
    source: item.label,
    description: `${item.key} account-navigation label.`,
    sourceReferences: ["lib/commerce/account.ts"],
  });
}

for (const [key, definition] of Object.entries(
  accountData.accountSectionDefinitions,
)) {
  for (const field of ["eyebrow", "title", "description", "emptyMessage"]) {
    addMessage({
      id: `account.section.${kebabCase(key)}.${kebabCase(field)}`,
      category: "account",
      source: definition[field],
      description: `${key} account-section ${field} copy.`,
      sourceReferences: ["lib/commerce/account.ts"],
    });
  }
}

for (const group of catalogue.catalogueGroups) {
  addMessage({
    id: `catalogue.group.${group.id}.label`,
    category: "catalogue",
    source: group.label,
    description: `Display label for the ${group.id} catalogue group.`,
    sourceReferences: ["app/data/catalogue.ts"],
  });
  addMessage({
    id: `catalogue.group.${group.id}.description`,
    category: "catalogue",
    source: group.description,
    description: `Description of the ${group.id} catalogue group.`,
    sourceReferences: ["app/data/catalogue.ts"],
  });
}

for (const component of catalogue.components) {
  for (const [field, source, description] of [
    ["name", component.name, "Public component display name."],
    ["description", component.description, "Public component catalogue description."],
    ["semantics", component.semantics, "Public component semantic contract."],
    ["keyboard", component.keyboard, "Public component keyboard contract."],
  ]) {
    addMessage({
      id: `catalogue.component.${component.slug}.${field}`,
      category: "catalogue",
      source,
      description: `${component.name}: ${description}`,
      sourceReferences: ["app/data/catalogue.ts"],
    });
  }
  for (const [field, source] of [
    ["status", component.status],
    ["licence", component.license],
  ]) {
    addMessage({
      id: `catalogue.component.${component.slug}.${field}`,
      category: "catalogue",
      contentType: "identifier",
      source,
      description: `${component.name}: protected ${field} identifier.`,
      translatable: false,
      sourceReferences: ["app/data/catalogue.ts"],
      protectedSpans: [{ value: source, reason: "identifier" }],
    });
  }
}

for (const article of articleData.articles) {
  for (const [field, source, description] of [
    ["title", article.title, "Article title."],
    ["description", article.description, "Article search and listing description."],
    ["eyebrow", article.eyebrow, "Article category eyebrow."],
  ]) {
    addMessage({
      id: `article.${article.slug}.${field}`,
      category: "article",
      source,
      description: `${article.title}: ${description}`,
      sourceReferences: ["app/data/articles.ts"],
    });
  }
  article.sections.forEach((section, sectionIndex) => {
    const sectionId = `${String(sectionIndex + 1).padStart(2, "0")}-${slugify(section.heading)}`;
    addMessage({
      id: `article.${article.slug}.section.${sectionId}.heading`,
      category: "article",
      source: section.heading,
      description: `Section heading in ${article.title}.`,
      sourceReferences: ["app/data/articles.ts"],
    });
    section.paragraphs.forEach((paragraph, paragraphIndex) => {
      addMessage({
        id: `article.${article.slug}.section.${sectionId}.paragraph.${String(paragraphIndex + 1).padStart(2, "0")}`,
        category: "article",
        contentType: "rich-text",
        source: paragraph,
        description: `Article paragraph in ${article.title}, section ${sectionIndex + 1}.`,
        sourceReferences: ["app/data/articles.ts"],
      });
    });
  });
  article.links.forEach((link, linkIndex) => {
    addMessage({
      id: `article.${article.slug}.link.${String(linkIndex + 1).padStart(2, "0")}.label`,
      category: "article",
      source: link.label,
      description: `Related-link label in ${article.title}; preserve its separately managed href.`,
      sourceReferences: ["app/data/articles.ts"],
    });
  });
  for (const [field, source] of [
    ["published-at", article.publishedAt],
    ["updated-at", article.updatedAt],
  ]) {
    addMessage({
      id: `article.${article.slug}.${field}`,
      category: "article",
      contentType: "date",
      source,
      description: `${article.title}: protected ISO source date; format for display by locale.`,
      translatable: false,
      sourceReferences: ["app/data/articles.ts"],
      protectedSpans: [{ value: source, reason: "iso-date" }],
    });
  }
}

for (const guideSlug of markdownData.guideSlugs) {
  markdownToMessages(
    guideSlug,
    markdownData.renderGuideMarkdown(guideSlug),
  );
}

for (const release of changelogData.publicReleases) {
  const releaseId = release.version.replaceAll(".", "-");
  for (const [field, source, description] of [
    ["title", release.title, "Public changelog release title."],
    ["copy", release.copy, "Public changelog release summary."],
  ]) {
    addMessage({
      id: `changelog.release.${releaseId}.${field}`,
      category: "changelog",
      source,
      description: `${release.version}: ${description}`,
      sourceReferences: ["app/data/changelog.ts"],
    });
  }
  for (const [field, source, type] of [
    ["version", release.version, "identifier"],
    ["date", release.date, "date"],
  ]) {
    addMessage({
      id: `changelog.release.${releaseId}.${field}`,
      category: "changelog",
      contentType: type,
      source,
      description: `${release.version}: protected ${field}; use locale formatting where rendered.`,
      translatable: false,
      sourceReferences: ["app/data/changelog.ts"],
      protectedSpans: [{ value: source, reason: field }],
    });
  }
}

const staticCoverage = new Map();
for (const candidate of staticCopySource.candidates) {
  const existingRecord = records.find(
    ({ source, translatable, placeholders }) =>
      source === candidate.source
      && translatable === candidate.translatable
      && stableJson(placeholders) === stableJson(candidate.placeholders),
  );
  if (existingRecord) {
    existingRecord.sourceReferences = [
      ...new Set([
        ...existingRecord.sourceReferences,
        ...candidate.sourceReferences,
      ]),
    ].sort((left, right) => left.localeCompare(right));
    staticCoverage.set(candidate.key, existingRecord.id);
    continue;
  }
  addMessage({
    id: candidate.id,
    category: "static",
    contentType: candidate.contentType,
    source: candidate.source,
    description: candidate.description,
    translatable: candidate.translatable,
    placeholders: candidate.placeholders,
    sourceReferences: candidate.sourceReferences,
    protectedSpans: [
      ...candidate.protectedSpans,
      ...protectedSpansFor(candidate.source),
    ].filter(
      (span, index, all) =>
        all.findIndex(
          ({ value, reason }) =>
            value === span.value && reason === span.reason,
        ) === index,
    ),
  });
  staticCoverage.set(candidate.key, candidate.id);
}
const staticCoverageAudit = auditStaticCopyCoverage({
  sourcePaths: staticCopySource.sourcePaths,
  candidates: staticCopySource.candidates,
  coverage: staticCoverage,
});
assertStaticCopyCoverage(staticCoverageAudit);

const messages = records
  .map((record) => ({
    ...record,
    checksum: sha256(stableJson(record)),
  }))
  .sort((left, right) => left.id.localeCompare(right.id));
assert.equal(
  new Set(messages.map(({ id }) => id)).size,
  messages.length,
  "Generated localisation message IDs are not unique.",
);
const checksumInput = messages.map((message) =>
  Object.fromEntries(
    Object.entries(message).filter(([key]) => key !== "checksum"),
  ));
const sourceChecksum = sha256(stableJson(checksumInput));
const sourceRevision = `en-${sourceChecksum.slice(0, 12)}`;
const categoryCounts = Object.fromEntries(
  ["core", "account", "static", "catalogue", "article", "guide", "changelog"].map((category) => [
    category,
    messages.filter((message) => message.category === category).length,
  ]),
);
const sourceBundle = {
  schemaVersion: localisationSchemaVersion,
  sourceLocale: "en",
  sourceRevision,
  sourceChecksum,
  generatedFrom: sourcePaths,
  messageCount: messages.length,
  translatableMessageCount: messages.filter(({ translatable }) => translatable).length,
  categoryCounts,
  messages,
};
validateSourceBundle(sourceBundle);

const localeManifest = {
  schemaVersion: localisationSchemaVersion,
  sourceLocale: "en",
  sourceRevision,
  sourceChecksum,
  expectedMessageCount: messages.length,
  locales: localeData.locales.map((locale) => {
    const sourceLocale = locale.code === "en";
    return {
      code: locale.code,
      englishName: locale.englishName,
      nativeName: locale.nativeName,
      direction: locale.direction,
      runtimePublicationStatus: locale.status,
      targetSourceRevision: sourceRevision,
      expectedMessageCount: messages.length,
      translationStatus: sourceLocale
        ? "source-locale"
        : "ai-draft-generated-private",
      dictionaryPath: sourceLocale
        ? "app/i18n/generated/en.source.json"
        : null,
      dictionaryChecksum: sourceLocale ? sourceChecksum : null,
      linguisticReviewStatus: sourceLocale
        ? "not-applicable-source-locale"
        : "not-started",
      reviewer: null,
      reviewedRevision: null,
      reviewedDictionaryChecksum: null,
      reviewApproval: null,
      missingMessagePolicy: sourceLocale
        ? "source-locale"
        : "fail-closed-no-fallback",
      eligibleForRouting: sourceLocale,
      eligibleForHreflang: sourceLocale,
      eligibleForSitemap: sourceLocale,
      publicationGate: sourceLocale
        ? "existing-source-locale"
        : "closed",
    };
  }),
  publicationEligibility: {
    routeableLocaleCodes: ["en"],
    hreflangLocaleCodes: ["en"],
    sitemapLocaleCodes: ["en"],
  },
};
validateLocaleManifest(localeManifest, sourceBundle);

const reviewHandoff = {
  schemaVersion: localisationSchemaVersion,
  sourceLocale: "en",
  sourceRevision,
  sourceChecksum,
  messageCount: messages.length,
  translatableMessageCount: sourceBundle.translatableMessageCount,
  targetLocales: localeData.locales.slice(1).map((locale) => ({
    code: locale.code,
    englishName: locale.englishName,
    nativeName: locale.nativeName,
    direction: locale.direction,
    isRightToLeft: locale.direction === "rtl",
    status: "ai-draft-generated-awaiting-founder-review",
    targetSourceRevision: sourceRevision,
    dictionaryPath: null,
    reviewer: null,
    approval: null,
    reviewedRevision: null,
  })),
  checkpoints: {
    metadataAndDiscovery: [
      "Translate page titles, descriptions, social metadata, image alternative text, and visible search labels in rendered context.",
      "Verify each locale canonical resolves to its own reviewed language route without English fallback.",
      "Emit hreflang only for reviewed, complete, routeable equivalents at the same source revision.",
      "Keep x-default on the unprefixed reviewed English route.",
      "Add sitemap locale alternates only after route, canonical, hreflang, and dictionary gates pass together.",
      "Index locale-specific search text only after reviewed publication; pending dictionaries must remain absent.",
    ],
    longTextAndAccessibility: [
      "Review narrow mobile, tablet, desktop, 200% zoom, 400% text reflow, and long unbroken strings.",
      "Confirm translated labels do not obscure controls, status, validation, tables, dialogs, or reading order.",
      "Complete every flow by keyboard with visible focus and no new keyboard trap.",
      "Review screen-reader names, descriptions, live regions, headings, landmark names, and form relationships.",
      "Inspect light and dark contrast, forced colors, reduced motion, and touch-target boundaries.",
      "Test empty, loading, error, success, disabled, permission, offline, and destructive-action wording where present.",
      "Check code, commands, registry names, product names, user content, and placeholders remain protected.",
      "Review truncation and wrapping in metadata, navigation, search results, catalogue cards, article links, and changelog entries.",
    ],
    formatting: [
      "Use locale-aware plural categories and test zero, one, two where applicable, few, many, and other as the locale requires.",
      "Format dates with locale-aware month, day, year, and ordering while retaining protected ISO source values.",
      "Format decimal, percentage, grouping, and sign placement with Intl-compatible locale rules.",
      "Do not introduce a currency or price where the English source and approved product data contain none.",
      "Preserve placeholders exactly once, validate their types, and test representative short and long values.",
      "Review punctuation, quotation, list, casing, and spacing conventions for the target locale.",
    ],
    rtl: [
      "Apply dir=rtl at the reviewed locale document root for Arabic, Persian, and Hebrew.",
      "Verify logical inline/block layout rather than cosmetic row reversal.",
      "Mirror directional navigation icons and horizontal keyboard deltas only when meaning is directional.",
      "Keep neutral icons, play symbols, brand marks, and non-directional status imagery unmirrored.",
      "Wrap code, commands, email addresses, URLs, version numbers, and verification values in explicit LTR isolation.",
      "Review mixed Arabic/Persian/Hebrew and Latin strings for bidirectional punctuation and ordering.",
      "Check numbers, dates, percentages, list markers, tables, breadcrumbs, pagination, sliders, carousels, and drawers.",
      "Repeat keyboard, zoom, reflow, screen-reader, dark-mode, reduced-motion, and focus review in genuine RTL content.",
      "Review Arabic shaping, Persian character choices, Hebrew punctuation, and fallback-font coverage during founder review.",
    ],
  },
  publicationGate: [
    "A complete dictionary exists for every translatable message at the current English source revision.",
    "Every protected identifier, placeholder, code span, URL, and product name passes automated validation.",
    "The AI model, version, run date, settings and source checksum are recorded in the private release evidence.",
    "Founder review records approval for meaning, terminology, grammar, tone, formatting, and cultural fit without claiming professional translation.",
    "Rendered keyboard, zoom, reflow, contrast, screen-reader, responsive, dark-mode, and reduced-motion review passes.",
    "Arabic, Persian, and Hebrew additionally pass the complete RTL and bidirectional checkpoint set.",
    "Canonical, hreflang, sitemap, search, route, and locale-switcher behavior pass without English fallback.",
    "The locale manifest and routing status are promoted together through a reviewed change.",
    "Rollback restores the prior dictionaries, source revision, locale manifest, routes, alternates, sitemap, and search state.",
  ],
  instructions: {
    messageContract: "docs/localisation/message-contract.md",
    translatorHandoff: "docs/localisation/translator-handoff.md",
    reviewerChecklist: "docs/localisation/reviewer-checklist.md",
    rtlChecklist: "docs/localisation/rtl-checklist.md",
    publicationGate: "docs/localisation/publication-gate.md",
  },
};
validateReviewHandoff(reviewHandoff, sourceBundle, localeManifest);

const messageSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://gummyui.dev/schemas/localisation-message-bundle.schema.json",
  title: "Gummy UI English localisation source bundle",
  type: "object",
  additionalProperties: false,
  required: [
    "schemaVersion",
    "sourceLocale",
    "sourceRevision",
    "sourceChecksum",
    "messageCount",
    "translatableMessageCount",
    "categoryCounts",
    "messages",
  ],
  properties: {
    schemaVersion: { const: localisationSchemaVersion },
    sourceLocale: { const: "en" },
    sourceRevision: { pattern: "^en-[a-f0-9]{12}$" },
    sourceChecksum: { pattern: "^[a-f0-9]{64}$" },
    generatedFrom: { type: "array", items: { type: "string" } },
    messageCount: { type: "integer", minimum: 1 },
    translatableMessageCount: { type: "integer", minimum: 1 },
    categoryCounts: { type: "object" },
    messages: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "category",
          "contentType",
          "source",
          "description",
          "translatable",
          "placeholders",
          "protectedSpans",
          "sourceReferences",
          "checksum",
        ],
        properties: {
          id: {
            type: "string",
            pattern: "^[a-z][a-z0-9]*(?:\\.[a-z0-9][a-z0-9-]*)+$",
          },
          category: { enum: ["core", "account", "static", "catalogue", "article", "guide", "changelog"] },
          contentType: { enum: ["plain", "rich-text", "markdown", "code", "identifier", "date"] },
          source: { type: "string", minLength: 1 },
          description: { type: "string", minLength: 1 },
          translatable: { type: "boolean" },
          placeholders: { type: "array" },
          protectedSpans: { type: "array" },
          sourceReferences: { type: "array", minItems: 1, items: { type: "string" } },
          checksum: { type: "string", pattern: "^[a-f0-9]{64}$" },
        },
      },
    },
  },
};

const localeSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://gummyui.dev/schemas/localisation-locale-manifest.schema.json",
  title: "Gummy UI locale review and publication manifest",
  type: "object",
  additionalProperties: false,
  required: [
    "schemaVersion",
    "sourceLocale",
    "sourceRevision",
    "sourceChecksum",
    "expectedMessageCount",
    "locales",
    "publicationEligibility",
  ],
  properties: {
    schemaVersion: { const: localisationSchemaVersion },
    sourceLocale: { const: "en" },
    sourceRevision: { pattern: "^en-[a-f0-9]{12}$" },
    sourceChecksum: { pattern: "^[a-f0-9]{64}$" },
    expectedMessageCount: { type: "integer", minimum: 1 },
    locales: {
      type: "array",
      minItems: 20,
      maxItems: 20,
      items: {
        type: "object",
        required: [
          "code",
          "direction",
          "runtimePublicationStatus",
          "translationStatus",
          "dictionaryPath",
          "linguisticReviewStatus",
          "eligibleForRouting",
          "eligibleForHreflang",
          "eligibleForSitemap",
          "publicationGate",
        ],
      },
    },
    publicationEligibility: {
      type: "object",
      additionalProperties: false,
      properties: {
        routeableLocaleCodes: { const: ["en"] },
        hreflangLocaleCodes: { const: ["en"] },
        sitemapLocaleCodes: { const: ["en"] },
      },
    },
  },
};

const sourceBundleContent = stableJson(sourceBundle);
const localeManifestContent = stableJson(localeManifest);
const handoffContent = stableJson(reviewHandoff);
const messageSchemaContent = stableJson(messageSchema);
const localeSchemaContent = stableJson(localeSchema);
const staticCoverageAuditContent = stableJson(staticCoverageAudit);
const inputSources = await Promise.all(
  sourcePaths.map(async (sourcePath) => {
    const content = await readFile(path.join(repositoryRoot, sourcePath), "utf8");
    return {
      path: sourcePath,
      sha256: sha256(content),
    };
  }),
);
const sourceManifest = {
  schemaVersion: localisationSchemaVersion,
  generator: "scripts/localisation-build.mjs",
  sourceLocale: "en",
  sourceRevision,
  sourceChecksum,
  status: "english-source-ready-private-ai-drafts-unpublished",
  messageCount: messages.length,
  translatableMessageCount: sourceBundle.translatableMessageCount,
  categoryCounts,
  publishedLocaleCodes: ["en"],
  pendingLocaleCount: 19,
  inputs: inputSources,
  outputs: {
    englishSource: {
      path: "app/i18n/generated/en.source.json",
      sha256: sha256(sourceBundleContent),
    },
    localeManifest: {
      path: "app/i18n/generated/locale-manifest.json",
      sha256: sha256(localeManifestContent),
    },
    reviewHandoff: {
      path: "app/i18n/generated/review-handoff.json",
      sha256: sha256(handoffContent),
    },
    messageSchema: {
      path: "app/i18n/generated/message-bundle.schema.json",
      sha256: sha256(messageSchemaContent),
    },
    localeSchema: {
      path: "app/i18n/generated/locale-manifest.schema.json",
      sha256: sha256(localeSchemaContent),
    },
    staticCoverageAudit: {
      path: "app/i18n/generated/static-copy-coverage.json",
      sha256: sha256(staticCoverageAuditContent),
    },
  },
  blockers: [
    {
      id: "ai-translation-generation",
      status: "complete-private-draft-unpublished",
      appliesTo: localeData.locales.slice(1).map(({ code }) => code),
    },
    {
      id: "founder-linguistic-review",
      status: "pending-founder-review-or-validation",
      appliesTo: localeData.locales.slice(1).map(({ code }) => code),
    },
    {
      id: "rendered-accessibility-and-responsive-review",
      status: "pending-founder-review-or-validation",
      appliesTo: localeData.locales.slice(1).map(({ code }) => code),
    },
    {
      id: "rtl-review",
      status: "pending-founder-review-or-validation",
      appliesTo: ["fa", "he", "ar"],
    },
    {
      id: "route-discovery-and-rollback-review",
      status: "pending-founder-review-or-validation",
      appliesTo: localeData.locales.slice(1).map(({ code }) => code),
    },
  ],
};
const sourceManifestContent = stableJson(sourceManifest);
validateSourceManifest(sourceManifest, {
  sourceBundleContent,
  localeManifestContent,
  handoffContent,
  messageSchemaContent,
  localeSchemaContent,
  staticCoverageAuditContent,
});

const outputs = {
  "en.source.json": sourceBundleContent,
  "locale-manifest.json": localeManifestContent,
  "review-handoff.json": handoffContent,
  "message-bundle.schema.json": messageSchemaContent,
  "locale-manifest.schema.json": localeSchemaContent,
  "static-copy-coverage.json": staticCoverageAuditContent,
  "source-manifest.json": sourceManifestContent,
};

await mkdir(outputRoot, { recursive: true });
for (const [filename, content] of Object.entries(outputs)) {
  const outputPath = path.join(outputRoot, filename);
  if (checkOnly) {
    const existing = await readFile(outputPath, "utf8");
    assert.equal(
      existing,
      content,
      `${filename} is stale; run node scripts/localisation-build.mjs.`,
    );
  } else {
    await writeFile(outputPath, content);
  }
}

console.log(
  `${checkOnly ? "Verified" : "Generated"} ${messages.length} English localisation-source records (${sourceBundle.translatableMessageCount} translatable) at ${sourceRevision}; English remains the only published locale and 19 generated targets remain pending founder review and publication.`,
);
