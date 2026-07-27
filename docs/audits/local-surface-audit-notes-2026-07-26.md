# Local 100-page surface audit notes — 26 July 2026

The source report is `local-surface-2026-07-26.llm.txt`, produced by
squirrelscan 0.0.38 against the production build on
`http://127.0.0.1:4173`.

## Baseline

- Overall: 72 (C)
- Accessibility category: 98
- Performance category: 83
- Core SEO category: 85
- Internationalisation, images, links, legal, mobile, social, and URL
  structure: 100

This is a local pre-production baseline, not the required production score.

## Environment-only findings

- 97 HTTPS failures and the HTTP/2 warning result from the required local
  `http://` origin. Production must still prove HTTPS and HSTS.
- 174 sitemap-domain errors result from crawling `127.0.0.1` while the canonical
  sitemap correctly targets the gated production domain `gummyui.dev`.
- noindex findings on Pro, pricing, terms, blocks, and templates are deliberate
  while those products and legal promises are unavailable.

These findings are documented rather than suppressed. They must disappear on
the approved production origin before launch.

## Actionable findings addressed after this baseline

- added self-canonicals to all 17 affected route families;
- added unique documentation metadata and expanded short route metadata;
- completed Article Open Graph/Twitter images and JSON-LD image/publisher-logo
  fields;
- added accessible switch naming, unique combobox part IDs, named Command
  results, a labelled scroll-region role, and hidden arrow glyphs;
- removed a non-submitting documentation demo from form semantics;
- corrected the home heading hierarchy;
- added explicit HTML, hashed-asset, registry, API, and sensitive-route cache
  policies at the worker boundary; and
- converted six Component Lab studies from roughly 10 MB of PNG delivery
  copies to 593 KB total WebP, with bundle/image budgets enforced; and
- moved the complete primitive, form-control, inspector, and frame-studio CSS
  out of the shared bundle and onto the routes that render it. The compiled
  shared CSS fell from 332,998 to 198,793 bytes, with a 220 KB release budget
  and separate route-style budgets.

Focused TypeScript, ESLint, component behavior, security-header, rendered
output, artifact, dependency, secret, and performance gates pass after those
changes. A new score is intentionally not recorded: the installed audit binary
completed the next crawl but did not analyze the newest crawl reliably. The
full audit must be repeated with the approved production URL and a current
auditor before the 95+ definition of done can pass.

## Remaining owned findings

- Owner: engineering/accessibility review — manually verify Base UI hidden
  form controls that the crawler reports despite `aria-hidden` and
  `tabIndex=-1`; do not alter their semantics solely to satisfy a crawler.
- Owner: content — expand genuinely useful short status pages where more
  operational facts become available; do not add filler or invented promises.
- Owner: launch operations — repeat the full crawl, HTTPS/header checks,
  controlled performance runs, keyboard/zoom/reflow/RTL/reduced-motion checks,
  and screen-reader smoke tests on the approved production deployment.
