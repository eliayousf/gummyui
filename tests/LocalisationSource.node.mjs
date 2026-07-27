import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  sha256,
  validateLocaleManifest,
  validateReviewHandoff,
  validateSourceBundle,
  validateSourceManifest,
} from "../scripts/localisation-contract.mjs";
import {
  assertStaticCopyCoverage,
  auditStaticCopyCoverage,
  extractStaticCopyCandidates,
} from "../scripts/localisation-static-source.mjs";

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
const sourceBundle = JSON.parse(sourceBundleContent);
const localeManifest = JSON.parse(localeManifestContent);
const handoff = JSON.parse(handoffContent);
const sourceManifest = JSON.parse(sourceManifestContent);
const staticCoverageAudit = JSON.parse(staticCoverageAuditContent);

test("English source records and locale review artifacts pass strong validation", () => {
  validateSourceBundle(sourceBundle);
  validateLocaleManifest(localeManifest, sourceBundle);
  validateReviewHandoff(handoff, sourceBundle, localeManifest);
  validateSourceManifest(sourceManifest, {
    sourceBundleContent,
    localeManifestContent,
    handoffContent,
    messageSchemaContent,
    localeSchemaContent,
    staticCoverageAuditContent,
  });
  assertStaticCopyCoverage(staticCoverageAudit);
});

test("source bundle covers core, account, public static surfaces, catalogue, articles, guides, and changelog", () => {
  assert.ok(sourceBundle.categoryCounts.core >= 40);
  assert.ok(sourceBundle.categoryCounts.account >= 80);
  assert.ok(sourceBundle.categoryCounts.static >= 100);
  assert.ok(sourceBundle.categoryCounts.catalogue >= 300);
  assert.ok(sourceBundle.categoryCounts.article >= 300);
  assert.ok(sourceBundle.categoryCounts.guide >= 100);
  assert.ok(sourceBundle.categoryCounts.changelog >= 30);
  assert.equal(
    Object.values(sourceBundle.categoryCounts).reduce(
      (total, count) => total + count,
      0,
    ),
    sourceBundle.messageCount,
  );
  assert.equal(
    sourceBundle.messages.some(
      ({ id }) => id === "core.locale.pending-count",
    ),
    true,
  );
  assert.equal(
    sourceBundle.messages.some(
      ({ id }) => id === "account.public.sign-in.title",
    ),
    true,
  );
  assert.equal(
    sourceBundle.messages.some(
      ({ id }) => id === "account.section.downloads.empty-message",
    ),
    true,
  );
  assert.equal(
    sourceBundle.messages.some(
      ({ id }) => id.startsWith("static.accessibility.page."),
    ),
    true,
  );
  assert.equal(
    sourceBundle.messages.some(
      ({ id }) => id === "static.pro-metadata.block.block-about-01.name",
    ),
    true,
  );
  assert.equal(
    sourceBundle.messages.some(
      ({ source }) => source === "project is",
    ),
    true,
  );
  assert.equal(
    sourceBundle.messages.some(
      ({ source }) => source === "projects are",
    ),
    true,
  );
  assert.equal(
    sourceBundle.messages.some(
      ({ id }) => id === "catalogue.component.button.keyboard",
    ),
    true,
  );
  assert.equal(
    sourceBundle.messages.some(
      ({ id }) => id.startsWith("article.designing-the-gel-pop-language"),
    ),
    true,
  );
  assert.equal(
    sourceBundle.messages.some(
      ({ id }) => id.startsWith("guide.localisation."),
    ),
    true,
  );
  assert.equal(
    sourceBundle.messages.some(
      ({ id }) => id === "changelog.release.1-0-0.copy",
    ),
    true,
  );
});

test("static-copy coverage audit fails when an extracted candidate is not mapped", async () => {
  const extracted = await extractStaticCopyCandidates(process.cwd());
  const coverage = new Map(
    extracted.candidates.map(({ key, id }) => [key, id]),
  );
  coverage.delete(extracted.candidates[0].key);
  const incompleteAudit = auditStaticCopyCoverage({
    sourcePaths: extracted.sourcePaths,
    candidates: extracted.candidates,
    coverage,
  });
  assert.throws(
    () => assertStaticCopyCoverage(incompleteAudit),
    /Uncaptured static localisation copy/,
  );
});

test("a pending locale cannot gain routing or discovery eligibility", () => {
  const unsafe = structuredClone(localeManifest);
  const french = unsafe.locales.find(({ code }) => code === "fr");
  french.eligibleForRouting = true;
  french.eligibleForHreflang = true;
  french.eligibleForSitemap = true;
  french.dictionaryPath = "app/i18n/generated/fr.json";
  french.dictionaryChecksum = "a".repeat(64);

  assert.throws(
    () => validateLocaleManifest(unsafe, sourceBundle),
    /Expected values to be strictly equal|deep-equal/,
  );
});

test("an incomplete or stale source bundle fails validation", () => {
  const incomplete = structuredClone(sourceBundle);
  incomplete.messages.pop();
  incomplete.messageCount -= 1;
  assert.throws(
    () => validateSourceBundle(incomplete),
  );

  const stale = structuredClone(sourceBundle);
  stale.sourceRevision = "en-000000000000";
  assert.throws(
    () => validateSourceBundle(stale),
    /Expected values to be strictly equal/,
  );
});

test("output checksums are reproducible and no target dictionary is present", () => {
  assert.equal(
    sourceManifest.outputs.englishSource.sha256,
    sha256(sourceBundleContent),
  );
  assert.equal(
    sourceManifest.outputs.localeManifest.sha256,
    sha256(localeManifestContent),
  );
  assert.equal(
    sourceManifest.outputs.staticCoverageAudit.sha256,
    sha256(staticCoverageAuditContent),
  );
  assert.deepEqual(
    localeManifest.locales
      .filter(({ code }) => code !== "en")
      .map(({ dictionaryPath }) => dictionaryPath),
    Array(19).fill(null),
  );
  assert.deepEqual(sourceManifest.publishedLocaleCodes, ["en"]);
  assert.equal(sourceManifest.pendingLocaleCount, 19);
});
