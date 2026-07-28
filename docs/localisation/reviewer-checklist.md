# Founder linguistic and rendered reviewer checklist

## Corpus integrity

- Confirm the target dictionary declares the current English revision and full
  checksum.
- Confirm every translatable ID appears exactly once and no unknown IDs exist.
- Confirm protected non-translatable records remain unchanged.
- Confirm placeholders retain their name, type, count, and required context.
- Resolve every generation question or record an explicit release blocker.

## Linguistic review

- Review meaning, grammar, terminology, register, tone, punctuation, quotation,
  list, casing, and spacing conventions.
- Review product and component terminology across chrome, catalogue,
  documentation, articles, metadata, feeds, and changelog.
- Check culturally inappropriate examples, idioms, ambiguity, and accidental
  legal, security, support, or capability promises.
- Review plurals with the target language's actual CLDR-style categories.
- Review locale-aware date, number, percentage, sign, and grouping output.

## Long text, keyboard, zoom, and reflow

- Render narrow mobile, tablet, desktop, 200% zoom, 400% text reflow, and long
  unbroken values.
- Inspect navigation, controls, status, validation, tables, cards, dialogs,
  headings, catalogue entries, article links, metadata previews, and feeds.
- Confirm text wraps without overlap, clipping, hidden actions, horizontal
  page scrolling, or changed reading order.
- Complete every route and interactive state by keyboard with visible focus,
  correct order, and no trap.
- Review screen-reader names, descriptions, headings, landmarks, tables, live
  regions, and form relationships.
- Review light/dark contrast, forced colors, reduced motion, touch targets, and
  pointer/keyboard equivalence.
- Review ready, loading, empty, error, success, disabled, permission, offline,
  and destructive-action wording where those states exist.

## Metadata and discovery

- Check titles and descriptions for meaning, length, truncation, and duplicate
  output.
- Check Open Graph/social titles, descriptions, and image alternative text.
- Verify the locale's self-canonical and same-content URL mapping.
- Verify hreflang is reciprocal, complete, reviewed, and limited to published
  equivalents.
- Verify sitemap and search records appear only after reviewed publication.
- Verify no target route or metadata surface silently presents English.

## Approval evidence

Record the AI model/version, generation date/settings, founder reviewer
identity, source revision, dictionary checksum, completed checkpoints,
exceptions, and the approval or rejection in the approved private release
system. Do not describe the result as professional, native-speaker or
independent linguistic review. This repository intentionally contains no
prefilled approval or review date.
