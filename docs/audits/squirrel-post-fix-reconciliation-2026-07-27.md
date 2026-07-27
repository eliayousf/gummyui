# Full local website-audit reconciliation — 27 July 2026

## Authoritative completed run

The last complete full-coverage local report is
`squirrel-local-full-2026-07-26.llm` with its machine-readable JSON companion.
Squirrelscan 0.0.38 crawled 163 pages on the production build at
`http://127.0.0.1:3000` and recorded:

| Measure | Result |
| --- | ---: |
| Overall | 78 (C) |
| Security | 72 |
| Accessibility | 98 |
| Crawlability | 84 |
| Performance | 86 |
| Content | 78 |
| Core SEO | 94 |
| Passed checks | 9,068 |
| Warnings | 502 |
| Failed checks | 126 |

This is not the required 95+ production score. Of the 126 recorded failures,
101 are the expected result of auditing a loopback HTTP origin. The crawl also
compares loopback pages with 170 production-domain sitemap entries, which
cannot reconcile until the approved production origin exists.

## Findings reconciled

Real findings found by the audit were corrected in source, including metadata
and description coverage, ambiguous links, heading hierarchy, robots
behavior, invalid ARIA, hidden glyph naming, RTL slider behavior, card
composition hierarchy, mobile header/reflow failures, focus visibility,
contrast, and route-style loading. The shared compiled CSS was reduced from
roughly 202 kB to 150,645 bytes (26,788 bytes gzip).

The remaining completed-report findings have explicit treatment:

- Base UI hidden inputs reported as focusable or unnamed are crawler
  false-positives against library-managed hidden controls; current Chrome
  accessibility trees and seven representative axe runs report no unnamed
  controls or violations.
- the locale table header association warning is a static-rule false-positive
  against a real table with scoped headers;
- the four pagination URLs intentionally share component metadata and
  canonicalize to the unpaginated component route;
- `/registry` intentionally exposes 155 component/material links as a
  machine- and human-readable index;
- short content remains on deliberately concise status, legal-gate, and
  utility pages; filler or invented operating claims were not added;
- the Scroll Area demonstration intentionally renders 61 children to
  demonstrate overflow;
- route-specific CSS remains render-blocking where the current framework emits
  it as required page CSS;
- local HTTP/1.1, HTTPS, HSTS, production CSP, canonical-domain sitemap, and
  production cache results remain deployment-only checks; and
- the About-page heuristic is not treated as authority to invent a founder or
  company identity before those facts are approved.

The independent production-build Chrome gate is the stronger current rendered
evidence for source-controlled behavior: 32 public routes, 15 sensitive
routes, two protected endpoints, 320-pixel reflow, dark/light, RTL, reduced
motion, native keyboard traversal, four accessibility-tree probes, and seven
axe runs all pass without horizontal overflow, unnamed interactive nodes,
serious/critical violations, runtime errors, or failed resources. Its
limitations—painted contrast, actual browser zoom, real screen readers,
Firefox/WebKit, physical touch devices, and long translated RTL copy—remain
explicit manual/external gates.

## Repeat-run tool defect

Two post-fix repeat attempts exhausted the installed auditor path:

1. the bundled 0.0.38 binary completed the page crawl but stalled during rule
   analysis while trying production-domain external connections;
2. a temporary checksum-verified 0.0.80 binary reproduced the defect after
   crawling all 163 pages, even with external-link checks disabled in both the
   rule list and crawler configuration.

Process inspection confirmed multiple production-domain HTTPS sockets in
`SYN_SENT` while the UI remained indefinitely at `Analyzing audit rules`.
The local configuration was restored after the diagnostic. The incomplete run
was stopped and is not presented as a score or successful audit.

## Production owner and closure

Launch operations owns the remaining score gate. After founder-approved
deployment, run a fresh full-coverage audit on `https://gummyui.dev` with a
working current auditor, fix every real error, document each surviving warning
with an owner, and require a score above 95. Engineering owns any source defect
found; content owns genuinely thin public information; legal/operations own
the approved identity and policy facts; accessibility QA owns the manual
assistive-technology and painted-contrast record.

