import metadata from "./pro-catalogue.public.json";

export type ProItemStatus =
  | "specified"
  | "implemented"
  | "verified"
  | "release-ready";

type PublicProCategory = {
  slug: string;
  name: string;
  count: number;
  purpose: string;
};

type PublicProBlock = {
  id: string;
  name: string;
  slug: string;
  category: string;
  purpose: string;
  dependencies: string[];
  requirements: string[];
  status: ProItemStatus;
  preview?: string;
};

type PublicProTemplate = {
  id: string;
  name: string;
  brief: string;
  routes: string[];
  states: string[];
  requirements: string[];
  status: ProItemStatus;
  preview?: string;
};

type PublicProDesignKit = {
  status: ProItemStatus;
  materializerVersion: string;
  lastObservedMaterializerVersion: string;
  definitionCount: number;
  expectedMaterialization: {
    masters: number;
    responsiveInstances: number;
    componentSets: number;
    editableVariants: number;
    editablePatternSets: number;
    editablePatternVariants: number;
    rasterComparisonReferences: number;
  };
  externalMaterialization:
    | "not-run-founder-approval-required"
    | "materialized-success"
    | "previous-version-materialized-current-version-live-run-pending"
    | "complete";
  manualQa: "pending" | "complete";
};

type PublicProMetadata = {
  schemaVersion: "1.2";
  counts: {
    blocks: 158;
    categories: 22;
    templates: 6;
    designKitDefinitions: 300;
  };
  categories: PublicProCategory[];
  blocks: PublicProBlock[];
  templates: PublicProTemplate[];
  designKit: PublicProDesignKit;
};

const publicProMetadata = metadata as PublicProMetadata;

function slugify(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const proBlockCategories = publicProMetadata.categories;
export const proBlocks = publicProMetadata.blocks;
export const proTemplates = publicProMetadata.templates.map((template) => ({
  ...template,
  slug: slugify(template.name),
  kind: template.brief,
}));

export const proBlockCount = publicProMetadata.counts.blocks;
export const proCategoryCount = publicProMetadata.counts.categories;
export const proTemplateCount = publicProMetadata.counts.templates;
export const proDesignKitDefinitionCount =
  publicProMetadata.counts.designKitDefinitions;
export const proDesignKitStatus = publicProMetadata.designKit.status;
export const proDesignKitMaterializerVersion =
  publicProMetadata.designKit.materializerVersion;
export const proDesignKitLastObservedMaterializerVersion =
  publicProMetadata.designKit.lastObservedMaterializerVersion;
export const proDesignKitExpectedMaterialization =
  publicProMetadata.designKit.expectedMaterialization;
export const proDesignKitExternalMaterialization =
  publicProMetadata.designKit.externalMaterialization;
export const proDesignKitManualQa = publicProMetadata.designKit.manualQa;
export const proImplementedBlockCount = proBlocks.filter(
  ({ status }) => status === "implemented",
).length;
export const proSpecifiedBlockCount = proBlocks.filter(
  ({ status }) => status === "specified",
).length;
export const proVerifiedBlockCount = proBlocks.filter(
  ({ status }) => status === "verified",
).length;
export const proReleaseReadyBlockCount = proBlocks.filter(
  ({ status }) => status === "release-ready",
).length;
export const proImplementedTemplateCount = proTemplates.filter(
  ({ status }) => status === "implemented",
).length;
export const proSpecifiedTemplateCount = proTemplates.filter(
  ({ status }) => status === "specified",
).length;
export const proCatalogueStatus =
  proReleaseReadyBlockCount === proBlockCount
    && proTemplates.every(({ status }) => status === "release-ready")
    && proDesignKitStatus === "release-ready"
    ? "release-ready"
    : "implementation-in-progress";

export function getProBlockCategory(slug: string) {
  return proBlockCategories.find((category) => category.slug === slug);
}

export function getProBlocksByCategory(category: string) {
  return proBlocks.filter((block) => block.category === category);
}

export function getProBlock(category: string, slug: string) {
  return proBlocks.find(
    (block) => block.category === category && block.slug === slug,
  );
}

export function getProTemplate(slug: string) {
  return proTemplates.find((template) => template.slug === slug);
}

if (
  publicProMetadata.schemaVersion !== "1.2"
  || proBlockCategories.length !== proCategoryCount
  || proBlocks.length !== proBlockCount
  || proTemplates.length !== proTemplateCount
  || proBlockCategories.reduce(
    (total, category) => total + category.count,
    0,
  ) !== proBlockCount
  || new Set(proBlocks.map(({ id }) => id)).size !== proBlockCount
  || new Set(proTemplates.map(({ id }) => id)).size !== proTemplateCount
  || publicProMetadata.designKit.definitionCount !== proDesignKitDefinitionCount
  || proImplementedBlockCount
    + proSpecifiedBlockCount
    + proVerifiedBlockCount
    + proReleaseReadyBlockCount !== proBlockCount
) {
  throw new Error(
    "Boundary-safe Pro metadata no longer matches the approved private catalogue export.",
  );
}
