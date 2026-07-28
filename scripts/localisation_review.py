#!/usr/bin/env python3
"""Render a private canonical localisation draft as a local noindex review UI.

This public-repository tool never generates or stores a dictionary. The private
gummyui-pro workflow remains the source of truth for models, exact-source reuse,
generation, repair and automated quality reports. This script only validates a
current private draft against the public English source and creates a gitignored
local founder-review aid.
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import os
from pathlib import Path
import re
import sys
from typing import Any, Iterable


SCHEMA_VERSION = "1.0"
EXPECTED_SOURCE_REVISION = "en-ebd18dc4a542"
DEFAULT_SOURCE = Path("app/i18n/generated/en.source.json")
DEFAULT_OUTPUT_ROOT = Path("work/localisation-reviews")
TARGET_LOCALES = [
    "fr",
    "es",
    "pt",
    "it",
    "nl",
    "id",
    "de",
    "pl",
    "tr",
    "vi",
    "ja",
    "zh-Hans",
    "ko",
    "hi",
    "ru",
    "uk",
    "fa",
    "he",
    "ar",
]
RTL_LOCALES = {"fa", "he", "ar"}
CHECKSUM_RE = re.compile(r"^[a-f0-9]{64}$")
MARKUP_RE = re.compile(r"</?[A-Za-z][^>]*>|`{1,3}|\*\*|__|~~")
RESTRICTED_REFERENCE_RE = re.compile(
    r"(?:^/|(?:^|/)\.\.(?:/|$)|gummyui-pro|\.env|/Users/|private[-_/]source)",
    re.IGNORECASE,
)


def stable_json(value: Any) -> str:
    return json.dumps(
        value,
        ensure_ascii=False,
        indent=2,
        separators=(",", ": "),
        allow_nan=False,
    ) + "\n"


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def without_key(value: dict[str, Any], key: str) -> dict[str, Any]:
    return {name: field for name, field in value.items() if name != key}


def assert_nix_shell() -> None:
    executable = Path(sys.executable).resolve().as_posix()
    if not os.environ.get("IN_NIX_SHELL") and not executable.startswith("/nix/store/"):
        raise RuntimeError(
            "Run this script through the documented `nix shell ... -c` command."
        )


def validate_source_bundle(
    bundle: dict[str, Any],
    *,
    expected_revision: str | None = EXPECTED_SOURCE_REVISION,
) -> dict[str, Any]:
    if bundle.get("schemaVersion") != SCHEMA_VERSION:
        raise ValueError("Unsupported English source schema.")
    if bundle.get("sourceLocale") != "en":
        raise ValueError("The draft source locale must be English.")
    if expected_revision and bundle.get("sourceRevision") != expected_revision:
        raise ValueError(
            f"Expected source revision {expected_revision}, received "
            f"{bundle.get('sourceRevision')}. Rebuild the handoff deliberately."
        )
    messages = bundle.get("messages")
    if not isinstance(messages, list) or not messages:
        raise ValueError("English source messages are missing.")
    if bundle.get("messageCount") != len(messages):
        raise ValueError("English source message count is stale.")
    if bundle.get("translatableMessageCount") != sum(
        bool(message.get("translatable")) for message in messages
    ):
        raise ValueError("English translatable-message count is stale.")
    ids: list[str] = []
    checksum_inputs: list[dict[str, Any]] = []
    for message in messages:
        message_id = message.get("id")
        if not isinstance(message_id, str):
            raise ValueError("English source contains an invalid message ID.")
        ids.append(message_id)
        expected_checksum = sha256_text(stable_json(without_key(message, "checksum")))
        if message.get("checksum") != expected_checksum:
            raise ValueError(f"English source message {message_id} has a stale checksum.")
        for reference in message.get("sourceReferences", []):
            if not isinstance(reference, str) or RESTRICTED_REFERENCE_RE.search(reference):
                raise ValueError(f"Message {message_id} crosses the public boundary.")
        checksum_inputs.append(without_key(message, "checksum"))
    if len(ids) != len(set(ids)) or ids != sorted(ids):
        raise ValueError("English source message IDs must be unique and sorted.")
    source_checksum = sha256_text(stable_json(checksum_inputs))
    if bundle.get("sourceChecksum") != source_checksum:
        raise ValueError("English source corpus checksum is stale.")
    if bundle.get("sourceRevision") != f"en-{source_checksum[:12]}":
        raise ValueError("English source revision does not match its checksum.")
    return bundle


def load_source_bundle(path: Path) -> tuple[dict[str, Any], str]:
    content = path.read_text(encoding="utf-8")
    return validate_source_bundle(json.loads(content)), sha256_text(content)


def draft_checksum(draft: dict[str, Any]) -> str:
    return sha256_text(stable_json(without_key(draft, "draftChecksum")))


def integrity_flags(
    source_message: dict[str, Any],
    translation: str,
) -> list[str]:
    flags: list[str] = []
    for placeholder in source_message["placeholders"]:
        token = f"{{{placeholder['name']}}}"
        if translation.count(token) != source_message["source"].count(token):
            flags.append(f"placeholder-changed:{token}")
    for span in source_message["protectedSpans"]:
        value = span["value"]
        if translation.count(value) != source_message["source"].count(value):
            flags.append(f"protected-span-changed:{span['reason']}")
    if MARKUP_RE.findall(translation) != MARKUP_RE.findall(source_message["source"]):
        flags.append("markup-structure-changed")
    if not source_message["translatable"] and translation != source_message["source"]:
        flags.append("non-translatable-source-changed")
    return flags


def review_warnings(
    source_message: dict[str, Any],
    draft_message: dict[str, Any],
) -> tuple[list[str], float]:
    source = source_message["source"]
    translation = draft_message["translation"]
    ratio = round(len(translation) / max(1, len(source)), 3)
    warnings = list(draft_message.get("sourcePreservationReasons", []))
    if source_message["translatable"] and source == translation and len(source) >= 8:
        warnings.append("translation-identical-to-source")
    if ratio >= 1.35 and len(translation) - len(source) >= 12:
        warnings.append("expansion-over-35-percent")
    if ratio >= 1.75 and len(translation) - len(source) >= 20:
        warnings.append("expansion-over-75-percent")
    if ratio <= 0.55 and len(source) - len(translation) >= 12:
        warnings.append("contraction-over-45-percent")
    return sorted(set(warnings)), ratio


def validate_private_draft(
    draft: dict[str, Any],
    source: dict[str, Any],
) -> dict[str, Any]:
    expected = {
        "schemaVersion": SCHEMA_VERSION,
        "publicationStatus": "ai-generated-unreviewed",
        "founderReviewStatus": "not-started",
        "sourceRevision": source["sourceRevision"],
        "sourceChecksum": source["sourceChecksum"],
        "expectedMessageCount": source["messageCount"],
        "generatedMessageCount": source["messageCount"],
    }
    for field, expected_value in expected.items():
        if draft.get(field) != expected_value:
            raise ValueError(f"Private draft field {field} is stale or unsafe.")
    locale = draft.get("locale")
    if locale not in TARGET_LOCALES:
        raise ValueError("Private draft locale is unsupported.")
    if draft.get("automatedQuality", {}).get("status") != (
        "structure-passed-founder-review-required"
    ):
        raise ValueError("Private draft has not passed its structural quality gate.")
    generation = draft.get("generation")
    if not isinstance(generation, dict):
        raise ValueError("Private draft generation provenance is missing.")
    if (
        generation.get("generator") != "scripts/generate-localisation-drafts.py"
        or generation.get("doSample") is not False
        or not isinstance(generation.get("model"), str)
        or not generation["model"]
        or not isinstance(generation.get("modelLicense"), str)
        or not isinstance(generation.get("generatedAt"), str)
    ):
        raise ValueError("Private draft generation provenance is incomplete.")
    messages = draft.get("messages")
    if not isinstance(messages, list) or len(messages) != len(source["messages"]):
        raise ValueError("Private draft is incomplete.")
    for source_message, draft_message in zip(source["messages"], messages):
        if draft_message.get("id") != source_message["id"]:
            raise ValueError("Private draft messages are missing or reordered.")
        if draft_message.get("sourceMessageChecksum") != source_message["checksum"]:
            raise ValueError(
                f"Private draft message {source_message['id']} is stale."
            )
        translation = draft_message.get("translation")
        if not isinstance(translation, str) or not translation:
            raise ValueError(
                f"Private draft message {source_message['id']} is empty."
            )
        flags = integrity_flags(source_message, translation)
        if flags:
            raise ValueError(
                f"Private draft message {source_message['id']} failed integrity: "
                + ", ".join(flags)
            )
        allowed_statuses = (
            {
                "ai-generated-unreviewed",
                "ai-generated-with-source-preserved-units",
                "ai-generated-with-fallback-repair",
            }
            if source_message["translatable"]
            else {"source-preserved"}
        )
        if draft_message.get("generationStatus") not in allowed_statuses:
            raise ValueError(
                f"Private draft message {source_message['id']} has an invalid "
                "generation status."
            )
    if not CHECKSUM_RE.fullmatch(str(draft.get("draftChecksum", ""))):
        raise ValueError("Private draft checksum is invalid.")
    if draft["draftChecksum"] != draft_checksum(draft):
        raise ValueError("Private draft checksum is stale.")
    return draft


def load_quality_report(
    path: Path | None,
    draft: dict[str, Any],
) -> dict[str, list[dict[str, str]]]:
    if path is None:
        return {}
    report = json.loads(path.read_text(encoding="utf-8"))
    expected = {
        "schemaVersion": SCHEMA_VERSION,
        "locale": draft["locale"],
        "sourceRevision": draft["sourceRevision"],
        "sourceChecksum": draft["sourceChecksum"],
        "draftChecksum": draft["draftChecksum"],
        "status": "automated-flags-require-founder-review",
    }
    for field, value in expected.items():
        if report.get(field) != value:
            raise ValueError(f"Private quality report field {field} is stale.")
    return {
        message["id"]: message["flags"]
        for message in report.get("flaggedMessages", [])
    }


def assert_non_deployable_output(path: Path) -> None:
    root = Path.cwd().resolve()
    resolved = path.resolve()
    try:
        relative = resolved.relative_to(root)
    except ValueError:
        return
    if relative.parts and relative.parts[0] in {
        "app",
        "public",
        "dist",
        ".next",
        ".vinext",
        ".git",
    }:
        raise ValueError(
            f"Private review material cannot be written to {relative.parts[0]}."
        )


def review_payload(
    source: dict[str, Any],
    source_file_checksum: str,
    draft: dict[str, Any],
    quality_flags: dict[str, list[dict[str, str]]],
) -> dict[str, Any]:
    records: list[dict[str, Any]] = []
    for source_message, draft_message in zip(source["messages"], draft["messages"]):
        warnings, expansion_ratio = review_warnings(source_message, draft_message)
        flags = quality_flags.get(source_message["id"], [])
        records.append(
            {
                "id": source_message["id"],
                "sourceMessageChecksum": source_message["checksum"],
                "category": source_message["category"],
                "contentType": source_message["contentType"],
                "description": source_message["description"],
                "source": source_message["source"],
                "translation": draft_message["translation"],
                "translatable": source_message["translatable"],
                "expansionRatio": expansion_ratio,
                "warnings": warnings,
                "qualityFlags": flags,
                "generationStatus": draft_message["generationStatus"],
            }
        )
    return {
        "schemaVersion": SCHEMA_VERSION,
        "artifactType": "local-private-draft-review-aid",
        "publicationStatus": "blocked-local-review-only",
        "sourceRevision": source["sourceRevision"],
        "sourceChecksum": source["sourceChecksum"],
        "sourceBundleFileChecksum": source_file_checksum,
        "locale": draft["locale"],
        "direction": "rtl" if draft["locale"] in RTL_LOCALES else "ltr",
        "draftChecksum": draft["draftChecksum"],
        "generation": {
            "model": draft["generation"]["model"],
            "modelLicense": draft["generation"]["modelLicense"],
            "generatedAt": draft["generation"]["generatedAt"],
            "reusedFromSourceRevisions": draft["generation"].get(
                "reusedFromSourceRevisions", []
            ),
        },
        "records": records,
    }


REVIEW_DOCUMENT = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive,nosnippet">
  <meta name="referrer" content="no-referrer">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; connect-src 'none'; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
  <title>__TITLE__</title>
  <style>
    :root { color-scheme: light dark; font: 16px/1.5 system-ui, sans-serif; }
    body { margin: 0; background: Canvas; color: CanvasText; }
    header, main { width: min(1200px, calc(100% - 2rem)); margin: 1rem auto; }
    header { border: 2px solid #b54708; border-radius: 1rem; padding: 1rem; background: color-mix(in srgb, #fdb022 15%, Canvas); }
    h1, h2, p { margin-block: .4rem; }
    .blocked { color: #b42318; font-weight: 800; }
    .toolbar { position: sticky; top: 0; z-index: 2; display: grid; grid-template-columns: repeat(4, minmax(10rem, 1fr)); gap: .75rem; padding: 1rem 0; background: Canvas; border-bottom: 1px solid GrayText; }
    label { display: grid; gap: .25rem; font-weight: 650; }
    input, select, textarea, button { font: inherit; padding: .6rem; }
    button { min-height: 44px; cursor: pointer; }
    .summary { grid-column: 1 / -1; }
    .card { margin: 1rem 0; border: 1px solid GrayText; border-radius: .75rem; overflow: clip; }
    .meta { padding: .75rem; background: color-mix(in srgb, GrayText 12%, Canvas); display: flex; flex-wrap: wrap; gap: .5rem 1rem; }
    .pair { display: grid; grid-template-columns: 1fr 1fr; }
    .pair section { padding: 1rem; min-width: 0; }
    .pair section + section { border-inline-start: 1px solid GrayText; }
    .copy { white-space: pre-wrap; overflow-wrap: anywhere; }
    .warning { color: #b54708; font-weight: 700; }
    .decision { display: grid; grid-template-columns: repeat(3, max-content) 1fr; gap: .5rem; padding: .75rem; border-top: 1px solid GrayText; align-items: start; }
    .decision button[aria-pressed="true"] { outline: 3px solid Highlight; }
    .decision textarea { min-height: 3rem; }
    .pagination { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin: 1rem 0 3rem; }
    code { overflow-wrap: anywhere; }
    @media (max-width: 760px) {
      .toolbar { grid-template-columns: 1fr 1fr; }
      .pair { grid-template-columns: 1fr; }
      .pair section + section { border-inline-start: 0; border-top: 1px solid GrayText; }
      .decision { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header>
    <p class="blocked">Blocked from publication · private draft · local review aid</p>
    <h1>__HEADING__</h1>
    <p>The canonical draft stays in gummyui-pro. This local page cannot publish, promote, or claim professional or independent linguistic review.</p>
    <p><code>__REVISION__</code> · draft <code>__CHECKSUM__</code></p>
  </header>
  <main>
    <div class="toolbar" aria-label="Review controls">
      <label>Search <input id="search" type="search" autocomplete="off"></label>
      <label>Category <select id="category"><option value="">All categories</option></select></label>
      <label>Decision <select id="decision-filter"><option value="">All decisions</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label>
      <label>Warnings <select id="warning-filter"><option value="">All records</option><option value="warning">Warnings only</option><option value="high">High severity only</option></select></label>
      <label>Reviewer name <input id="reviewer" autocomplete="name" placeholder="Enter only when reviewing"></label>
      <label>Overall decision <select id="overall"><option value="pending">Pending</option><option value="approved">Approve locale draft</option><option value="rejected">Reject locale draft</option></select></label>
      <button id="export" type="button">Export review decisions</button>
      <button id="reset" type="button">Reset local review</button>
      <div class="summary" id="summary" aria-live="polite"></div>
    </div>
    <div id="records"></div>
    <nav class="pagination" aria-label="Review pages">
      <button id="previous" type="button">Previous</button>
      <span id="page"></span>
      <button id="next" type="button">Next</button>
    </nav>
  </main>
  <script id="review-data" type="application/json">__DATA__</script>
  <script>
    "use strict";
    const data = JSON.parse(document.getElementById("review-data").textContent);
    const storageKey = `gummy-private-localisation-review:${data.draftChecksum}`;
    const emptyState = { reviewer: "", overall: "pending", decisions: {} };
    let state;
    try { state = { ...emptyState, ...JSON.parse(localStorage.getItem(storageKey) || "{}") }; }
    catch { state = structuredClone(emptyState); }
    let page = 0;
    const pageSize = 100;
    const recordsNode = document.getElementById("records");
    const search = document.getElementById("search");
    const category = document.getElementById("category");
    const decisionFilter = document.getElementById("decision-filter");
    const warningFilter = document.getElementById("warning-filter");
    const reviewer = document.getElementById("reviewer");
    const overall = document.getElementById("overall");
    reviewer.value = state.reviewer || "";
    overall.value = state.overall || "pending";
    [...new Set(data.records.map(record => record.category))].sort().forEach(value => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      category.append(option);
    });
    function save() {
      state.reviewer = reviewer.value;
      state.overall = overall.value;
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
    function decisionFor(id) { return state.decisions[id]?.decision || "pending"; }
    function hasHighFlag(record) { return record.qualityFlags.some(flag => flag.severity === "high"); }
    function filtered() {
      const query = search.value.trim().toLocaleLowerCase();
      return data.records.filter(record => {
        if (category.value && record.category !== category.value) return false;
        if (decisionFilter.value && decisionFor(record.id) !== decisionFilter.value) return false;
        if (warningFilter.value === "warning" && !record.warnings.length && !record.qualityFlags.length) return false;
        if (warningFilter.value === "high" && !hasHighFlag(record)) return false;
        if (query && !`${record.id} ${record.source} ${record.translation}`.toLocaleLowerCase().includes(query)) return false;
        return true;
      });
    }
    function setDecision(id, decision) {
      const previous = state.decisions[id] || {};
      state.decisions[id] = { decision, note: previous.note || "" };
      save();
      render();
    }
    function element(name, className, text) {
      const node = document.createElement(name);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    }
    function render() {
      const visible = filtered();
      const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
      page = Math.min(page, pageCount - 1);
      recordsNode.replaceChildren();
      for (const record of visible.slice(page * pageSize, (page + 1) * pageSize)) {
        const card = element("article", "card");
        const meta = element("div", "meta");
        meta.append(element("code", "", record.id));
        meta.append(element("span", "", `${record.category} · ${record.contentType}`));
        meta.append(element("span", "", `Expansion ${record.expansionRatio}×`));
        meta.append(element("strong", "", decisionFor(record.id)));
        const notices = [...record.warnings, ...record.qualityFlags.map(flag => `${flag.severity}:${flag.id}`)];
        if (notices.length) meta.append(element("span", "warning", notices.join(", ")));
        card.append(meta);
        const pair = element("div", "pair");
        const source = element("section");
        source.append(element("h2", "", "English source"));
        source.append(element("p", "copy", record.source));
        const target = element("section");
        target.lang = data.locale;
        target.dir = data.direction;
        target.append(element("h2", "", `${data.locale} AI draft`));
        target.append(element("p", "copy", record.translation));
        pair.append(source, target);
        card.append(pair);
        const controls = element("div", "decision");
        for (const value of ["approved", "rejected", "pending"]) {
          const label = value === "pending" ? "Reset to pending" : value[0].toUpperCase() + value.slice(1);
          const button = element("button", "", label);
          button.type = "button";
          button.setAttribute("aria-pressed", String(decisionFor(record.id) === value));
          button.addEventListener("click", () => setDecision(record.id, value));
          controls.append(button);
        }
        const note = document.createElement("textarea");
        note.setAttribute("aria-label", `Review note for ${record.id}`);
        note.placeholder = "Optional review note";
        note.value = state.decisions[record.id]?.note || "";
        note.addEventListener("change", () => {
          state.decisions[record.id] = { decision: decisionFor(record.id), note: note.value };
          save();
        });
        controls.append(note);
        card.append(controls);
        recordsNode.append(card);
      }
      const counts = { pending: 0, approved: 0, rejected: 0 };
      data.records.forEach(record => counts[decisionFor(record.id)] += 1);
      document.getElementById("summary").textContent =
        `${visible.length} filtered · ${counts.pending} pending · ${counts.approved} approved · ${counts.rejected} rejected`;
      document.getElementById("page").textContent = `Page ${page + 1} of ${pageCount}`;
      document.getElementById("previous").disabled = page === 0;
      document.getElementById("next").disabled = page >= pageCount - 1;
    }
    [search, category, decisionFilter, warningFilter].forEach(control => control.addEventListener("input", () => { page = 0; render(); }));
    [reviewer, overall].forEach(control => control.addEventListener("change", save));
    document.getElementById("previous").addEventListener("click", () => { page -= 1; render(); scrollTo(0, 0); });
    document.getElementById("next").addEventListener("click", () => { page += 1; render(); scrollTo(0, 0); });
    document.getElementById("reset").addEventListener("click", () => {
      if (!confirm("Reset every local review decision for this draft checksum?")) return;
      state = structuredClone(emptyState);
      reviewer.value = "";
      overall.value = "pending";
      save();
      render();
    });
    document.getElementById("export").addEventListener("click", () => {
      save();
      const output = {
        schemaVersion: "1.0",
        artifactType: "local-founder-review-decision-export",
        publicationStatus: "not-published-review-evidence",
        sourceRevision: data.sourceRevision,
        sourceChecksum: data.sourceChecksum,
        draftChecksum: data.draftChecksum,
        locale: data.locale,
        reviewer: state.reviewer || null,
        overallDecision: state.overall,
        decisions: data.records.map(record => ({
          id: record.id,
          sourceMessageChecksum: record.sourceMessageChecksum,
          decision: decisionFor(record.id),
          note: state.decisions[record.id]?.note || null,
        })),
      };
      const blob = new Blob([JSON.stringify(output, null, 2) + "\\n"], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${data.locale}.founder-review.json`;
      link.click();
      URL.revokeObjectURL(link.href);
    });
    render();
  </script>
</body>
</html>
"""


def build_review_document(payload: dict[str, Any], output_path: Path) -> Path:
    embedded = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    embedded = (
        embedded.replace("<", "\\u003c")
        .replace(">", "\\u003e")
        .replace("&", "\\u0026")
        .replace("\u2028", "\\u2028")
        .replace("\u2029", "\\u2029")
    )
    title = f"{payload['locale']} localisation founder review · Gummy UI"
    document = (
        REVIEW_DOCUMENT.replace("__TITLE__", html.escape(title))
        .replace("__HEADING__", html.escape(title))
        .replace("__REVISION__", html.escape(payload["sourceRevision"]))
        .replace("__CHECKSUM__", html.escape(payload["draftChecksum"]))
        .replace("__DATA__", embedded)
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    temporary = output_path.with_name(output_path.name + ".tmp")
    with temporary.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(document)
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(temporary, output_path)
    return output_path


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Build a local noindex review UI from a canonical private draft."
    )
    parser.add_argument("--draft", type=Path, required=True)
    parser.add_argument("--quality", type=Path)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path)
    return parser


def main(argv: Iterable[str] | None = None) -> int:
    assert_nix_shell()
    args = build_parser().parse_args(list(argv) if argv is not None else None)
    source, source_file_checksum = load_source_bundle(args.source)
    draft = validate_private_draft(
        json.loads(args.draft.read_text(encoding="utf-8")),
        source,
    )
    quality_flags = load_quality_report(args.quality, draft)
    payload = review_payload(source, source_file_checksum, draft, quality_flags)
    output = args.output or (
        DEFAULT_OUTPUT_ROOT
        / source["sourceRevision"]
        / f"{draft['locale']}.review.html"
    )
    assert_non_deployable_output(output)
    build_review_document(payload, output)
    print(
        f"Wrote noindex local review for canonical private {draft['locale']} "
        f"draft to {output}; publication remains blocked."
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (FileNotFoundError, RuntimeError, ValueError) as error:
        print(f"localisation review error: {error}", file=sys.stderr)
        raise SystemExit(1) from error
