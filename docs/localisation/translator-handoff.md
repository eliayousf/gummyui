# AI translation and founder-review handoff

## Package to receive

An AI translation run begins with:

- the current `app/i18n/generated/en.source.json`;
- the matching `sourceRevision`, full `sourceChecksum`, and message count;
- `app/i18n/generated/review-handoff.json`;
- this message contract and the relevant reviewer checklists; and
- rendered English context for the pages and states in scope.

Do not begin from an earlier email attachment or an unpinned export. Run the
source check immediately before preparing the handoff.

## Translation rules

- Translate meaning and task intent rather than mirroring English word order.
- Keep terminology consistent across shared chrome, component names,
  account and checkout states, catalogue descriptions, semantics, keyboard
  guidance, articles, guides, metadata, and changelog copy.
- Preserve message IDs, placeholders, protected spans, Markdown relationships,
  source links, code blocks, commands, product names, and API identifiers.
- Do not add pricing, availability, legal, security, support, compatibility, or
  capability claims absent from the reviewed English source.
- Keep user-provided content outside the dictionary.
- Record questions and unresolved terminology rather than silently guessing.
- Never treat AI output or dictionary completeness as founder approval.
- Record the model, version, run date, source checksum and generation settings.
- Do not claim professional, native-speaker or independent linguistic review.

## Metadata, canonical, hreflang, sitemap, and search

Translate document titles, descriptions, social metadata, image alternative
text, and search labels in rendered context. Confirm each approved locale URL
has its own reviewed metadata and self-canonical.

Do not create hreflang, sitemap alternates, locale switcher links, or indexed
search content until the dictionary is complete and reviewed at the current
source revision. Equivalent URLs must represent the same content and must not
fall back to English.

## Plurals, dates, and numbers

Use the target locale's plural categories; do not assume English singular and
plural are sufficient. Test representative values for every required category.

Format display dates, numbers, percentages, signs, grouping, and decimal
separators through locale-aware formatting. Preserve protected ISO source dates,
version identifiers, code, and machine-readable values. Do not introduce a
currency or price when the reviewed source contains none.

## Delivery back for review

The returned dictionary must include the source revision/checksum, every
required message ID, placeholder/protected-span validation, generation notes,
model provenance, and a complete list of unresolved questions. Founder-review
identity, dates, and approval belong in the approved private release record and
must reflect real completed work.
