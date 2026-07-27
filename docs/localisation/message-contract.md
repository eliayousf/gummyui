# Localisation message contract

## Stable identifiers

Message IDs use lower-case dotted namespaces and remain attached to meaning,
not screen position. Current namespaces are:

- `core.*` for shared chrome, locale controls, bypass links, and metadata;
- `account.*` for fail-closed account, sign-in, checkout, and account-section
  interface copy;
- `static.*` for AST-discovered page, metadata, shared-interaction, and
  boundary-safe Pro display copy;
- `catalogue.group.*` and `catalogue.component.*` for structured catalogue
  fields;
- `article.*` for article metadata, sections, paragraphs, links, and dates;
- `guide.*` for rendered guide headings, paragraphs, items, and protected code;
  and
- `changelog.release.*` for release titles, summaries, versions, and dates.

Do not recycle an existing ID for different meaning. When meaning changes,
update the English source and let the generated checksum/revision identify the
new translation obligation. When a message is removed, remove its target
translation in the same reviewed revision.

Static IDs derive deterministically from source file, containing scope,
semantic JSX/property role, and occurrence. They stay stable across English
wording edits in the same structural role. A structural reorder can change an
occurrence suffix and must be reviewed as a source-contract change rather than
silently remapped.

## Required fields

Every source record contains:

- `id` — stable semantic identifier;
- `category` and `contentType` — routing and rendering context;
- `source` — canonical English source;
- `description` — translator context;
- `translatable` — whether target dictionaries must translate the value;
- `placeholders` — typed runtime substitutions with representative examples;
- `protectedSpans` — product names, URLs, code, commands, dates, or identifiers
  that must be retained or locale-formatted according to their reason;
- `sourceReferences` — source files used to verify context; and
- `checksum` — deterministic SHA-256 for that record.

The bundle additionally records the ordered-corpus SHA-256 and a revision in
the form `en-{12 checksum characters}`. Target dictionaries must record the
exact full source checksum and revision. A different revision is stale even
when the message count happens to match.

## Placeholders and protected content

Each placeholder must appear exactly once. Validation rejects a missing,
renamed, duplicated, or ill-formed placeholder. Translators must not rename
placeholder keys or change their types. Review representative zero, one,
plural, negative, large, and long-text values as appropriate.

Do not translate product names, source paths, component API names, registry
names, commands, code, URLs, versions, or ISO source dates when they are marked
protected. Locale-aware display formatting may wrap protected values without
changing their underlying identity.

Mixed inline JSX is emitted as `rich-text` with protected relationship markers
such as `<link1>` and `</link1>`. The text inside may be translated and
reordered, but every marker and runtime placeholder must remain present and
balanced in the reviewed dictionary.

## Missing-message behavior

There is no English fallback under a non-English route. A missing, extra,
duplicate, stale, invalid, or unreviewed target message closes the publication
gate. File presence alone never enables routing or discovery.
