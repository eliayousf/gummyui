# Production launch verification — 28 July 2026

This record covers public commit
`aaea08413afd9c3a015217e380a1418a5bc528a3` at the real
`https://gummyui.dev` origin. It is production evidence for the public
application, not evidence that commerce is enabled or that a customer purchase
has completed.

## Origin and discovery

- Vercel served the exact commit from a Ready production deployment.
- The apex, `www` and Vercel alias were attached to the same project.
- `www` and the Vercel alias redirected to the apex with path and query
  preserved.
- HTTPS certificate verification, HSTS, CSP, frame denial, MIME sniffing
  protection, referrer policy and permissions policy passed.
- `/AGENTS.md`, `/llms.txt`, `/robots.txt`, `/sitemap.xml`, the catalogue API
  and the MCP-status guidance page were available. The page correctly says
  that hosted MCP transport is not yet advertised as live.
- All 362 sitemap URLs returned HTTP 200 in the controlled crawl.
- No public page in that crawl exposed a non-approved support address.
- Pricing, commercial licence, refund, terms, privacy, support and contact
  surfaces matched the approved model and `support@kreydlabs.com`.
- Empty, code-only and error-state authentication callbacks returned the same
  private, no-store, noindex 400 response. Authentication initiation used the
  canonical `https://gummyui.dev/auth/callback` URI.

GitHub Quality run `30362390307` completed successfully for the exact commit,
including the production launch-verification job.

## Lighthouse

Lighthouse 13.4.0 ran in a fresh Chrome 150 process with storage reset for each
run. Three cold mobile runs and three desktop runs targeted the production
homepage.

| Mode | Run | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
| ---- | ---: | ----------: | ------------: | -------------: | --: | --: | --: | --: |
| Mobile | 1 | 93 | 100 | 100 | 100 | 2.891 s | 0 | 17 ms |
| Mobile | 2 | 98 | 100 | 100 | 100 | 2.414 s | 0 | 0 ms |
| Mobile | 3 | 98 | 100 | 100 | 100 | 2.280 s | 0 | 0 ms |
| Mobile median | — | **98** | **100** | **100** | **100** | **2.414 s** | **0** | **0 ms** |
| Desktop | 1 | 100 | 100 | 100 | 100 | 0.540 s | 0 | 36 ms |
| Desktop | 2 | 98 | 100 | 100 | 100 | 0.550 s | 0 | 121 ms |
| Desktop | 3 | 100 | 100 | 100 | 100 | 0.498 s | 0 | 69 ms |
| Desktop median | — | **100** | **100** | **100** | **100** | **0.540 s** | **0** | **69 ms** |

The homepage-median performance check exceeds 95 on both mobile and desktop,
and the other three Lighthouse categories score 100. One mobile run scored 93.
This is lab evidence for the homepage rather than a full-coverage site score or
a claim about field INP. The separate full-coverage greater-than-95 gate remains
open.

## Full-site diagnostic crawl

SquirrelScan 0.0.80 completed a fresh full audit with a 500-page limit:

- 457 URLs crawled and 304 HTML pages scored;
- 29,386 checks passed, 1,353 warned and 33 failed;
- aggregate diagnostic score 79/C;
- group scores: SEO 84, performance 62, security 95 and agents 50.

That aggregate is not substituted for Lighthouse and is not presented as a
95+ result. Most loss is caused by reproducible tool-model differences:
pre-hydration form mirrors, cross-origin WorkOS content attributed to the local
route, Markdown/XML sitemap entries treated as uncrawled, intentional noindex
routes, Vercel cache evidence ignored by the rule, site-wide aggregate byte
weight, and agent warnings that do not recognize the live `/AGENTS.md` and
`/llms.txt` resources.

The crawl did identify actionable issues. The subsequent source change:

- shortens 22 block-category descriptions plus the design-kit and template
  descriptions below 160 characters;
- keeps each Select trigger's accessible name aligned with its visible default
  value; and
- gives repeated Base and Radix registry links component-specific accessible
  names.

The large interactive component-inspector chunk and CSP `unsafe-inline` remain
explicit optimization and hardening work. Neither is concealed by the
Lighthouse result.

### Rule reconciliation and ownership

| Rule(s) | Disposition | Owner and next evidence |
| --- | --- | --- |
| `core/meta-description`, `core/meta-title` | Genuine source issue. Descriptions and the longest dynamic title are corrected. | Engineering; re-crawl the deployed correction. |
| `a11y/label-content-name-mismatch` | The Select mismatch is genuine and corrected. Other named-link examples intentionally provide more context while retaining the visible text in the accessible name. | Engineering; exact component tests plus the production crawl. |
| `a11y/select-name`, `aria-hidden-focus`, `aria-input-field-name`, `aria-required-attr`, `aria-toggle-field-name`, `form-labels` | The reported nodes are Base UI pre-hydration mirrors or hidden native controls. Full hydrated axe and accessibility-tree gates pass; no exception is used for the genuine Select mismatch above. | Engineering; keep hydrated browser/axe coverage and recheck after dependency upgrades. |
| `perf/ttfb` | Four uncached crawl samples were slow; six isolated Lighthouse runs recorded 12–13 ms median TTFB. | Operations; production monitoring and a fresh post-deploy sample. |
| `perf/total-byte-weight`, `perf/bad-caching` | The scanner aggregates shared site resources and does not recognize Vercel CDN evidence as a freshness lifetime. | Operations; retain real-origin headers and per-page Lighthouse evidence. |
| `perf/js-file-size`, `perf/dom-size`, `perf/lcp-hints`, `perf/lazy-above-fold`, `perf/render-blocking` | Genuine optimization backlog concentrated in the complete interactive Component Lab and inspector. | Engineering; reduce the inspector chunk and repeat mobile Lighthouse. |
| `security/csp` | `unsafe-inline` remains a known hardening item; other security headers and the security group score pass. | Engineering; nonce/hash migration before marking the full audit closed. |
| AuthKit SEO, canonical, link, content, agent and sitemap warnings | Cross-origin AuthKit, intentional private/noindex routes, Markdown/XML resources or crawler-model differences. | Operations; retain the explicit reconciliation and re-evaluate with each scanner release. |

The redacted Squirrel LLM report is retained at
`docs/audits/evidence/squirrel-production-full-2026-07-28-redacted.llm`; the
larger redacted JSON stays in the protected operator workspace. Their SHA-256
checksums are
`0322ec1170abaa3517d7804e4e35a7a8ed961711a1e43ce15172872e5686f877`
and
`704323d8a4c954de912091875d0de33d223da1caa1275fb81e3e1a6a61078030`.
The six raw Lighthouse JSON checksums, in desktop run order then mobile run
order, are:

1. `8e01c1a623eafb3492a61b01f5d4a120fd9c7aa4946438a8cd1a6709eeed9fca`;
2. `48993a3064828ccf59d1cc8589873262cd7dc01846bcda4450eb0145bdd21dc4`;
3. `d3fbbee0a2bebbcb975b5e2c8a9f74d817781e5eaa04e5cc3f5ab8fbb390ea32`;
4. `1540faf5970512f2e7a343bfe0e9c979d4cea5d8872f56fccc6907c2003167a7`;
5. `80684718578f1a4d4bf80801caef686b5ad694a33de63cc15bb4b1047e4c7c44`;
6. `d9721f74677ce3c3fa2d7b241c735ad8d65173a86188feba9a968785f8171690`.

The raw Squirrel reports include transient third-party AuthKit authorization
flow parameters. They are intentionally excluded from the public repository;
only this redacted reconciliation and the checksums are retained publicly.
