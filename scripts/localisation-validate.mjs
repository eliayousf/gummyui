import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  validateLocaleManifest,
  validateReviewHandoff,
  validateSourceBundle,
  validateSourceManifest,
} from "./localisation-contract.mjs";
import { assertStaticCopyCoverage } from "./localisation-static-source.mjs";

const generatedRoot = path.resolve("app/i18n/generated");
const read = (name) => readFile(path.join(generatedRoot, name), "utf8");
const [
  sourceBundleContent,
  localeManifestContent,
  handoffContent,
  messageSchemaContent,
  localeSchemaContent,
  staticCoverageAuditContent,
  sourceManifestContent,
] = await Promise.all([
  read("en.source.json"),
  read("locale-manifest.json"),
  read("review-handoff.json"),
  read("message-bundle.schema.json"),
  read("locale-manifest.schema.json"),
  read("static-copy-coverage.json"),
  read("source-manifest.json"),
]);

const sourceBundle = validateSourceBundle(JSON.parse(sourceBundleContent));
const localeManifest = validateLocaleManifest(
  JSON.parse(localeManifestContent),
  sourceBundle,
);
validateReviewHandoff(
  JSON.parse(handoffContent),
  sourceBundle,
  localeManifest,
);
validateSourceManifest(JSON.parse(sourceManifestContent), {
  sourceBundleContent,
  localeManifestContent,
  handoffContent,
  messageSchemaContent,
  localeSchemaContent,
  staticCoverageAuditContent,
});
assertStaticCopyCoverage(JSON.parse(staticCoverageAuditContent));

console.log(
  `Validated ${sourceBundle.messageCount} English localisation-source records at ${sourceBundle.sourceRevision}; 19 generated target locales remain fail-closed pending founder review and publication.`,
);
