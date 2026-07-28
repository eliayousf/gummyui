import importlib.util
import json
from pathlib import Path
import tempfile
import unittest


SCRIPT_PATH = Path(__file__).parents[1] / "scripts" / "localisation_review.py"
SPEC = importlib.util.spec_from_file_location("localisation_review", SCRIPT_PATH)
assert SPEC is not None and SPEC.loader is not None
review = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(review)


def source_message(**fields):
    value = {
        "id": fields["id"],
        "category": "core",
        "contentType": fields.get("contentType", "plain"),
        "source": fields["source"],
        "description": "Fixture review context.",
        "translatable": fields.get("translatable", True),
        "placeholders": fields.get("placeholders", []),
        "protectedSpans": fields.get("protectedSpans", []),
        "sourceReferences": ["app/components/LocaleSwitcher.tsx"],
    }
    value["checksum"] = review.sha256_text(review.stable_json(value))
    return value


def source_fixture():
    messages = [
        source_message(
            id="core.fixture.01-greeting",
            source="Welcome to Gummy UI, {name}.",
            placeholders=[{"name": "name", "type": "string", "example": "Elia"}],
            protectedSpans=[
                {"value": "Gummy UI", "reason": "product-name"},
                {"value": "{name}", "reason": "runtime-placeholder"},
            ],
        ),
        source_message(
            id="core.fixture.02-rich",
            source="Email <a1>{supportemail}</a1>.",
            contentType="rich-text",
            placeholders=[
                {
                    "name": "supportemail",
                    "type": "string",
                    "example": "support@example.test",
                }
            ],
            protectedSpans=[
                {"value": "<a1>", "reason": "rich-text-marker"},
                {"value": "{supportemail}", "reason": "runtime-placeholder"},
                {"value": "</a1>", "reason": "rich-text-marker"},
            ],
        ),
        source_message(
            id="core.fixture.03-command",
            source="npm install @gummy/ui",
            contentType="code",
            translatable=False,
            protectedSpans=[
                {"value": "npm install @gummy/ui", "reason": "code-or-command"}
            ],
        ),
    ]
    checksum = review.sha256_text(
        review.stable_json(
            [review.without_key(message, "checksum") for message in messages]
        )
    )
    return {
        "schemaVersion": "1.0",
        "sourceLocale": "en",
        "sourceRevision": f"en-{checksum[:12]}",
        "sourceChecksum": checksum,
        "messageCount": len(messages),
        "translatableMessageCount": 2,
        "messages": messages,
    }


def private_draft(source):
    translations = [
        "مرحبًا بكم في Gummy UI، {name}.",
        "البريد <a1>{supportemail}</a1>.",
        "npm install @gummy/ui",
    ]
    messages = [
        {
            "id": source_message["id"],
            "sourceMessageChecksum": source_message["checksum"],
            "translation": translation,
            "generationStatus": (
                "ai-generated-unreviewed"
                if source_message["translatable"]
                else "source-preserved"
            ),
        }
        for source_message, translation in zip(source["messages"], translations)
    ]
    draft = {
        "schemaVersion": "1.0",
        "locale": "ar",
        "modelTargetCode": "ara",
        "publicationStatus": "ai-generated-unreviewed",
        "founderReviewStatus": "not-started",
        "sourceRevision": source["sourceRevision"],
        "sourceChecksum": source["sourceChecksum"],
        "sourcePath": "../gummyui/app/i18n/generated/en.source.json",
        "expectedMessageCount": len(messages),
        "generatedMessageCount": len(messages),
        "automatedQuality": {
            "status": "structure-passed-founder-review-required",
            "sourcePreservedUnitCount": 0,
            "sourcePreservedMessageCount": 0,
            "sourcePreservationReasons": {},
            "reusedExactSourceUnitCount": 2,
            "repairUnitCount": 0,
        },
        "generation": {
            "model": "Helsinki-NLP/opus-mt-tc-big-en-ar",
            "modelLicense": "CC-BY-4.0",
            "modelCard": "https://huggingface.co/Helsinki-NLP/opus-mt-tc-big-en-ar",
            "promptPrefix": ">>ara<<",
            "device": "cpu",
            "dtype": "float32",
            "batchSize": 2,
            "numBeams": 1,
            "doSample": False,
            "noRepeatNgramSize": 3,
            "maxInputTokens": 420,
            "generatedAt": "2026-07-28T00:00:00+00:00",
            "generator": "scripts/generate-localisation-drafts.py",
            "reusedFromSourceRevisions": ["en-priorfixture"],
            "repairModels": [],
        },
        "messages": messages,
    }
    draft["draftChecksum"] = review.draft_checksum(draft)
    return draft


class LocalisationReviewTests(unittest.TestCase):
    def test_current_public_source_remains_the_only_public_dictionary(self):
        root = Path(__file__).parents[1]
        source, file_checksum = review.load_source_bundle(
            root / "app/i18n/generated/en.source.json"
        )
        self.assertEqual(source["sourceRevision"], review.EXPECTED_SOURCE_REVISION)
        self.assertRegex(file_checksum, r"^[a-f0-9]{64}$")
        manifest = json.loads(
            (root / "app/i18n/generated/locale-manifest.json").read_text(
                encoding="utf-8"
            )
        )
        self.assertEqual(
            [locale["code"] for locale in manifest["locales"][1:]],
            review.TARGET_LOCALES,
        )
        self.assertTrue(
            all(
                locale["dictionaryPath"] is None
                and locale["publicationGate"] == "closed"
                for locale in manifest["locales"][1:]
            )
        )

    def test_private_fixture_validates_and_builds_noindex_review(self):
        source = source_fixture()
        review.validate_source_bundle(source, expected_revision=None)
        draft = review.validate_private_draft(private_draft(source), source)
        payload = review.review_payload(
            source,
            review.sha256_text(review.stable_json(source)),
            draft,
            {},
        )
        self.assertEqual(payload["publicationStatus"], "blocked-local-review-only")
        self.assertEqual(payload["direction"], "rtl")
        self.assertEqual(payload["records"][0]["sourceMessageChecksum"], source["messages"][0]["checksum"])
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary) / "review.html"
            review.build_review_document(payload, output)
            document = output.read_text(encoding="utf-8")
            self.assertIn("noindex,nofollow,noarchive,nosnippet", document)
            self.assertIn("Blocked from publication", document)
            self.assertIn("Approve locale draft", document)
            self.assertIn("Reject locale draft", document)
            self.assertIn("target.dir = data.direction", document)
            self.assertNotIn("<a1>{supportemail}</a1>", document)
            self.assertIn("\\u003ca1\\u003e", document)

    def test_stale_or_tampered_private_draft_fails_closed(self):
        source = source_fixture()
        stale = private_draft(source)
        stale["sourceRevision"] = "en-000000000000"
        stale["draftChecksum"] = review.draft_checksum(stale)
        with self.assertRaisesRegex(ValueError, "sourceRevision"):
            review.validate_private_draft(stale, source)

        tampered = private_draft(source)
        tampered["messages"][0]["translation"] = "Bienvenue."
        tampered["draftChecksum"] = review.draft_checksum(tampered)
        with self.assertRaisesRegex(ValueError, "failed integrity"):
            review.validate_private_draft(tampered, source)


if __name__ == "__main__":
    unittest.main()
