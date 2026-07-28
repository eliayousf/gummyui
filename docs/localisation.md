# Localisation source, review, and publication

## Current public state

English (`en`) remains the only published Gummy UI locale. French, Spanish,
Portuguese, Italian, Dutch, Indonesian, German, Polish, Turkish, Vietnamese,
Japanese, Simplified Chinese, Korean, Hindi, Russian, Ukrainian, Persian,
Hebrew, and Arabic remain `pending-linguistic-review`.

No target-language dictionary, reviewer, approval, route, switcher link,
canonical, hreflang entry, sitemap alternate, search record, or publication
claim has been created for those 19 locales. Native language names are locale
identifiers, not translated interface copy.

The default reviewed English route remains unprefixed. Pending locale prefixes
resolve as unavailable rather than silently serving English under a
non-English URL.

## Implemented English source foundation

The deterministic source builder extracts stable records from:

- shared header, footer, locale-switcher, skip-link, and default metadata copy;
- centralized sign-in, checkout, account-shell, navigation, and all 13
  fail-closed account-section states;
- route-level metadata and rendered JSX on public/static pages, including
  shared interactive demos, accessible names, labels, placeholders, empty
  states, and mixed rich-text relationships;
- reviewed boundary-safe Pro category, block, template, status, requirement,
  and route metadata, with machine identifiers protected from translation;
- all structured catalogue groups and 57 component records;
- all original article fields, sections, paragraphs, links, and source dates;
- the rendered Markdown guides, segmented into headings, paragraphs, list
  items, and protected code blocks; and
- all public changelog releases; and
- an AST coverage audit for every in-scope TSX source plus the public Pro
  metadata and future structured showcase entries.

The generated English source contains 2,933 records, of which 2,662 are
translatable. Exact category and static-audit counts are generated and
checksum-pinned rather than maintained as product claims.

Generated public-safe artifacts live in `app/i18n/generated`:

- `en.source.json` — checksum-pinned English messages;
- `locale-manifest.json` — all 20 locales and their fail-closed eligibility;
- `review-handoff.json` — per-locale handoff and review checkpoints;
- `message-bundle.schema.json` and `locale-manifest.schema.json` — structural
  contracts; and
- `static-copy-coverage.json` — deterministic AST scope, per-file candidate
  counts, candidate checksum, coverage total, exclusions, and limitations; and
- `source-manifest.json` — input/output checksums, counts, revision, and open
  blockers.

Each message has a stable ID, context, translatability flag, content type,
placeholder and protected-span records, source references, and its own SHA-256.
The source revision derives from the ordered message corpus; there is no
volatile timestamp.

## Deterministic commands

These commands run directly with Node inside the project dev shell:

```sh
nix develop path:. -c node scripts/localisation-build.mjs
nix develop path:. -c node scripts/localisation-build.mjs --check
nix develop path:. -c node scripts/localisation-validate.mjs
```

`--check` fails when source content, the English corpus, locale status,
handoff, schema, revision, or checksums drift. Validation also fails if a
pending locale gains a dictionary, reviewer claim, routing, hreflang, sitemap,
or publication eligibility.

The static audit recognises JSX text, mixed inline rich text, visible and
accessibility attributes, common display-data properties, template
placeholders and variants, and approved boundary-safe Pro metadata. It is
deliberately fail-closed when a discovered candidate lacks a source-message
mapping. As static analysis, it cannot prove copy assembled only by arbitrary
runtime computation, returned by a future remote provider, or injected outside
the audited source surfaces. The separately structured account, sign-in, and
checkout routes remain covered by the `account.*` source records.

This is source and production-contract evidence only. The application still
publishes English alone; no runtime target dictionary, completed founder
approval, rendered target-locale QA, or target-locale route has been created.

## Private AI-draft workflow and public handoff

The private `gummyui-pro` repository is the sole source of truth for
checksum-bound model selection, incremental exact-source reuse, AI drafts,
quality reports and founder-review evidence. This public repository tracks no
unreviewed target dictionary or competing model registry.

The public repository contains only a current-source validator and local
noindex review renderer for canonical private draft input. It writes into the
gitignored `work/localisation-reviews` directory and cannot promote a locale or
fabricate approval.

See [Private offline AI drafts and public review handoff](./localisation/offline-draft-workflow.md)
for the canonical private Nix-only incremental generation commands and the
complementary public-safe review command.

Founder review and publication work remain before any target locale can
publish. The approved workflow must:

1. generate every translatable record at the current English revision and
   record the AI model, version, date, settings and source checksum;
2. preserve all protected code, URLs, commands, product names, identifiers,
   placeholders, and structured relationships;
3. complete Elia Samir Yousf's founder review with real identity and approval
   evidence in the approved private release record, without claiming
   professional or independent translation;
4. complete rendered responsive, long-text, keyboard, zoom, reflow, contrast,
   dark-mode, screen-reader, reduced-motion, and formatting review;
5. complete the additional Arabic, Persian, or Hebrew RTL and bidirectional
   review where applicable;
6. verify locale metadata, canonical, hreflang, sitemap, search, routing, and
   no-fallback behavior; and
7. promote the reviewed dictionary, locale manifest, route, alternates, search
   data, and rollback evidence together.

## Detailed handoff

- [Message contract](./localisation/message-contract.md)
- [AI translation handoff](./localisation/translator-handoff.md)
- [Founder reviewer checklist](./localisation/reviewer-checklist.md)
- [Arabic, Persian, and Hebrew RTL checklist](./localisation/rtl-checklist.md)
- [Publication and rollback gate](./localisation/publication-gate.md)
- [Offline draft and founder-review workflow](./localisation/offline-draft-workflow.md)
