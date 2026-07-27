# Locale publication and rollback gate

## Fail-closed default

A target locale remains pending when any required artifact, message, review,
rendered check, URL, discovery surface, or rollback step is missing. A
dictionary file must never enable a route merely by existing.

## Required evidence before promotion

1. The dictionary is complete and structurally valid for the current English
   source revision and checksum.
2. All IDs, placeholders, protected spans, code, commands, URLs, API names,
   product names, versions, and source dates pass automated validation.
3. AI-generation provenance and Elia Samir Yousf's completed manual review are
   recorded with the model/version, source revision, date and approval in the
   approved private evidence. The review must not be called professional
   translation or independent linguistic review.
4. Terminology, grammar, tone, plural, date, number, metadata, long-text, and
   all rendered state checks pass.
5. Keyboard, zoom, reflow, contrast, dark mode, forced colors, screen reader,
   touch, responsive, and reduced-motion checks pass.
6. Arabic, Persian, or Hebrew passes the additional RTL and bidirectional
   checklist.
7. The locale route returns only reviewed target-language content and has a
   reviewed self-canonical.
8. Locale switcher, reciprocal hreflang, x-default, sitemap alternates, and
   search records contain only complete published equivalents.
9. Monitoring and rollback ownership are identified in the approved release
   process.

## Coordinated promotion

Promote the founder-reviewed dictionary, generated locale manifest, runtime locale
status, route handling, switcher link, metadata, canonical, hreflang, sitemap,
search data, and release evidence in one reviewed change. Partial promotion is
an error.

The current generated manifest deliberately reports only `en` as routeable,
hreflang-eligible, and sitemap-eligible.

## Rollback rehearsal

Rollback must restore together:

- the prior English source revision reference and target dictionary;
- locale publication status and route availability;
- locale switcher and negotiation behavior;
- metadata, canonical, hreflang, x-default, and sitemap alternates;
- locale search data and caches; and
- the previous monitoring and release evidence.

After rollback, re-run direct URLs, English and target navigation, invalid and
pending prefixes, canonical/hreflang reciprocity, sitemap output, search, and
no-English-fallback checks.
