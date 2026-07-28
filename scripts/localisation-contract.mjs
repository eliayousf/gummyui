import assert from "node:assert/strict";
import { createHash } from "node:crypto";

export const localisationSchemaVersion = "1.0";
export const messageIdPattern =
  /^[a-z][a-z0-9]*(?:\.[a-z0-9][a-z0-9-]*)+$/;
export const checksumPattern = /^[a-f0-9]{64}$/;
export const allowedMessageCategories = new Set([
  "core",
  "account",
  "static",
  "catalogue",
  "article",
  "guide",
  "changelog",
]);
export const allowedContentTypes = new Set([
  "plain",
  "rich-text",
  "markdown",
  "code",
  "identifier",
  "date",
]);

export function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function assertSorted(values, label) {
  assert.deepEqual(
    values,
    [...values].sort((left, right) => left.localeCompare(right)),
    `${label} must be deterministically sorted.`,
  );
}

export function validateSourceBundle(bundle) {
  assert.equal(bundle.schemaVersion, localisationSchemaVersion);
  assert.equal(bundle.sourceLocale, "en");
  assert.match(bundle.sourceRevision, /^en-[a-f0-9]{12}$/);
  assert.match(bundle.sourceChecksum, checksumPattern);
  assert.equal(bundle.messageCount, bundle.messages.length);
  assert.equal(
    bundle.translatableMessageCount,
    bundle.messages.filter(({ translatable }) => translatable).length,
  );
  assert.equal(
    Object.values(bundle.categoryCounts).reduce(
      (total, count) => total + count,
      0,
    ),
    bundle.messageCount,
  );

  const ids = bundle.messages.map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length, "Message IDs must be unique.");
  assertSorted(ids, "Message IDs");

  for (const message of bundle.messages) {
    assert.match(message.id, messageIdPattern);
    assert.ok(allowedMessageCategories.has(message.category));
    assert.ok(allowedContentTypes.has(message.contentType));
    assert.equal(typeof message.source, "string");
    assert.ok(message.source.length > 0);
    assert.equal(typeof message.description, "string");
    assert.ok(message.description.length > 0);
    assert.equal(typeof message.translatable, "boolean");
    assert.ok(Array.isArray(message.placeholders));
    assert.equal(
      new Set(message.placeholders.map(({ name }) => name)).size,
      message.placeholders.length,
    );
    for (const placeholder of message.placeholders) {
      assert.match(placeholder.name, /^[a-zA-Z][a-zA-Z0-9]*$/);
      assert.equal(typeof placeholder.type, "string");
      assert.ok(placeholder.type.length > 0);
      assert.ok(
        message.source.includes(`{${placeholder.name}}`),
        `Message ${message.id} does not contain placeholder {${placeholder.name}}.`,
      );
      assert.equal(
        message.source.split(`{${placeholder.name}}`).length - 1,
        1,
        `Message ${message.id} must contain placeholder {${placeholder.name}} exactly once.`,
      );
    }
    assert.ok(Array.isArray(message.protectedSpans));
    for (const protectedSpan of message.protectedSpans) {
      assert.equal(typeof protectedSpan.value, "string");
      assert.ok(protectedSpan.value.length > 0);
      assert.equal(typeof protectedSpan.reason, "string");
      assert.ok(protectedSpan.reason.length > 0);
      assert.ok(
        message.source.includes(protectedSpan.value),
        `Message ${message.id} does not contain protected span ${protectedSpan.value}.`,
      );
    }
    assert.ok(Array.isArray(message.sourceReferences));
    assert.ok(message.sourceReferences.length >= 1);
    assert.match(message.checksum, checksumPattern);
    const { checksum, ...checksumInput } = message;
    assert.equal(
      checksum,
      sha256(stableJson(checksumInput)),
      `Message ${message.id} has a stale checksum.`,
    );
  }

  const checksumInput = bundle.messages.map((message) =>
    Object.fromEntries(
      Object.entries(message).filter(([key]) => key !== "checksum"),
    ));
  assert.equal(
    bundle.sourceChecksum,
    sha256(stableJson(checksumInput)),
    "The English source checksum is stale.",
  );
  assert.equal(
    bundle.sourceRevision,
    `en-${bundle.sourceChecksum.slice(0, 12)}`,
  );
  return bundle;
}

export function validateLocaleManifest(manifest, bundle) {
  assert.equal(manifest.schemaVersion, localisationSchemaVersion);
  assert.equal(manifest.sourceLocale, "en");
  assert.equal(manifest.sourceRevision, bundle.sourceRevision);
  assert.equal(manifest.sourceChecksum, bundle.sourceChecksum);
  assert.equal(manifest.expectedMessageCount, bundle.messageCount);
  assert.equal(manifest.locales.length, 20);

  const codes = manifest.locales.map(({ code }) => code);
  assert.equal(new Set(codes).size, codes.length);
  assert.equal(codes[0], "en");

  const published = manifest.locales.filter(
    ({ runtimePublicationStatus }) => runtimePublicationStatus === "published",
  );
  assert.deepEqual(published.map(({ code }) => code), ["en"]);

  for (const locale of manifest.locales) {
    assert.ok(["ltr", "rtl"].includes(locale.direction));
    assert.equal(locale.targetSourceRevision, bundle.sourceRevision);
    assert.equal(locale.expectedMessageCount, bundle.messageCount);
    assert.equal(locale.reviewer, null);
    assert.equal(locale.reviewedRevision, null);
    assert.equal(locale.reviewedDictionaryChecksum, null);
    assert.equal(locale.reviewApproval, null);

    if (locale.code === "en") {
      assert.equal(locale.runtimePublicationStatus, "published");
      assert.equal(locale.translationStatus, "source-locale");
      assert.equal(locale.dictionaryPath, "app/i18n/generated/en.source.json");
      assert.equal(locale.dictionaryChecksum, bundle.sourceChecksum);
      assert.equal(locale.linguisticReviewStatus, "not-applicable-source-locale");
      assert.equal(locale.eligibleForRouting, true);
      assert.equal(locale.eligibleForHreflang, true);
      assert.equal(locale.eligibleForSitemap, true);
      assert.equal(locale.missingMessagePolicy, "source-locale");
      continue;
    }

    assert.equal(
      locale.runtimePublicationStatus,
      "pending-linguistic-review",
    );
    assert.equal(locale.translationStatus, "ai-draft-generated-private");
    assert.equal(locale.dictionaryPath, null);
    assert.equal(locale.dictionaryChecksum, null);
    assert.equal(locale.linguisticReviewStatus, "not-started");
    assert.equal(locale.eligibleForRouting, false);
    assert.equal(locale.eligibleForHreflang, false);
    assert.equal(locale.eligibleForSitemap, false);
    assert.equal(locale.missingMessagePolicy, "fail-closed-no-fallback");
    assert.equal(locale.publicationGate, "closed");
  }

  assert.deepEqual(
    manifest.publicationEligibility.routeableLocaleCodes,
    ["en"],
  );
  assert.deepEqual(
    manifest.publicationEligibility.hreflangLocaleCodes,
    ["en"],
  );
  assert.deepEqual(
    manifest.publicationEligibility.sitemapLocaleCodes,
    ["en"],
  );
  return manifest;
}

export function validateReviewHandoff(handoff, bundle, localeManifest) {
  assert.equal(handoff.schemaVersion, localisationSchemaVersion);
  assert.equal(handoff.sourceRevision, bundle.sourceRevision);
  assert.equal(handoff.sourceChecksum, bundle.sourceChecksum);
  assert.equal(handoff.messageCount, bundle.messageCount);
  assert.equal(handoff.targetLocales.length, 19);
  assert.deepEqual(
    handoff.targetLocales.map(({ code }) => code),
    localeManifest.locales.slice(1).map(({ code }) => code),
  );
  assert.ok(handoff.checkpoints.metadataAndDiscovery.length >= 5);
  assert.ok(handoff.checkpoints.longTextAndAccessibility.length >= 7);
  assert.ok(handoff.checkpoints.formatting.length >= 5);
  assert.ok(handoff.checkpoints.rtl.length >= 8);
  assert.ok(handoff.publicationGate.length >= 8);

  for (const target of handoff.targetLocales) {
    assert.equal(
      target.status,
      "ai-draft-generated-awaiting-founder-review",
    );
    assert.equal(target.dictionaryPath, null);
    assert.equal(target.reviewer, null);
    assert.equal(target.approval, null);
    assert.equal(target.reviewedRevision, null);
    assert.equal(target.isRightToLeft, ["fa", "he", "ar"].includes(target.code));
  }
  return handoff;
}

export function validateSourceManifest(
  manifest,
  {
    sourceBundleContent,
    localeManifestContent,
    handoffContent,
    messageSchemaContent,
    localeSchemaContent,
    staticCoverageAuditContent,
  },
) {
  assert.equal(manifest.schemaVersion, localisationSchemaVersion);
  assert.equal(
    manifest.status,
    "english-source-ready-private-ai-drafts-unpublished",
  );
  const expected = {
    englishSource: sourceBundleContent,
    localeManifest: localeManifestContent,
    reviewHandoff: handoffContent,
    messageSchema: messageSchemaContent,
    localeSchema: localeSchemaContent,
    staticCoverageAudit: staticCoverageAuditContent,
  };
  for (const [key, content] of Object.entries(expected)) {
    assert.match(manifest.outputs[key].sha256, checksumPattern);
    assert.equal(
      manifest.outputs[key].sha256,
      sha256(content),
      `${key} output checksum is stale.`,
    );
  }
  assert.deepEqual(manifest.publishedLocaleCodes, ["en"]);
  assert.equal(manifest.pendingLocaleCount, 19);
  assert.equal(
    manifest.blockers.find(({ id }) => id === "ai-translation-generation")
      ?.status,
    "complete-private-draft-unpublished",
  );
  assert.ok(
    manifest.blockers
      .filter(({ id }) => id !== "ai-translation-generation")
      .every(({ status }) => status === "pending-founder-review-or-validation"),
  );
  return manifest;
}
