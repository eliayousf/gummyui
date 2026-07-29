# Production launch verification — 28 July 2026

This record begins with public commit
`aaea08413afd9c3a015217e380a1418a5bc528a3` and records the subsequent
production corrections in `52fe463df5c37dc6767c23c75a3d1d49e30de1b8`
plus the Node 22 runtime pin in
`977012c3500e5293ec711407f736c567289b022f`, the payload-deferment release
`c4d0d7847ef1701392bf430f96cc8fccf0eb000e`, the reconciled launch candidate
`14dab3225f3d26f3d2d500c761ff88b8e6b5c593`, and the callback-hardening
release `e7859e261b4ddaa11dc77e92d3d77aa98cd5dfea`. Typed-test follow-up
`7211e363092a014a86ca45f3fa8f0b6f5814f4e2` is proved by Vercel deployment
`dpl_DFpZ86uTmF8842A8nakhdCWnoP8z`; its build log records the exact head and
a Node 22 build. GitHub Quality run `30386937076` passes the complete
exact-commit launch gate. This supersedes
`c4d0d78`, whose only CI failure was the generated English localisation corpus
being stale after legitimate copy changes. The current protected-release
change `98483e353ad9323602bdfe9aa7d90dd37c7c15e6` and documentation
follow-up `c9feeba856bc9380b401c6be3df5b11987501a0a` pass GitHub Quality run
`30407698983`. Ready production deployment
`dpl_Cc41SdA8BSeg1XGMDmdPQv2Jhe5c` was built from a clean checkout at the
latter head after Convex and WorkOS credential rotation. This is production
evidence for the public application, not evidence that commerce is enabled or
that a customer purchase has completed.

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
- All 362 sitemap URLs in the initial audited deployment returned HTTP 200.
  The current HTML sitemap contains 292 URLs after intentional non-HTML
  discovery-resource removal, and its complete controlled probe passes.
- No public page in that crawl exposed a non-approved support address.
- Pricing, commercial licence, refund, terms, privacy, support and contact
  surfaces matched the approved model and `support@kreydlabs.com`.
- Empty, code-only and error-state authentication callbacks returned the same
  private, no-store, noindex 400 response. Authentication initiation used the
  canonical `https://gummyui.dev/auth/callback` URI.

GitHub Quality run `30362390307` completed successfully for the exact commit,
including the production launch-verification job.

GitHub Quality runs `30371961881` and `30373015318` completed successfully for
the deployed audit-correction commit `52fe463` and exact Node 22 runtime-pin
commit `977012c` respectively.

GitHub Quality run `30386937076` completed successfully for the exact current
deployed head `7211e36`, including reproducible localisation, native Next and
Vinext production builds, 462 Vitest tests, clean consumer installs,
browser/accessibility evidence, dependency, licence, secret and repository
boundary gates.

## Current release origin and browser matrix

Credential-rotation Vercel deployment `dpl_Cc41SdA8BSeg1XGMDmdPQv2Jhe5c` is
Ready and owned the apex, `www`, Vercel alias and canonical project aliases
when verified. It was
uploaded from a clean checkout at exact public head
`c9feeba856bc9380b401c6be3df5b11987501a0a`; its Node 22 build audited 683
packages with zero vulnerabilities and generated 322 static pages. GitHub
Quality run `30407698983` independently passes that exact head. Prior
runtime-proof Vercel deployment `dpl_DFpZ86uTmF8842A8nakhdCWnoP8z` remains
historical evidence: its build log records commit `7211e36`, Node 22, zero
dependency vulnerabilities, 322 generated static pages and a completed
deployment.

A fresh real-origin probe found all 292 current HTML sitemap URLs at HTTP 200.
The homepage and health route returned 200; HSTS, CSP, MIME-sniffing,
referrer-policy and permissions-policy headers were present. The empty
authentication callback, including a structurally complete callback rejected
by AuthKit, returned private/no-store/noindex 400; an anonymous
invalid download returned private/no-store/noindex 404, and `www` returned a
canonical 308 while preserving path and query.

Chrome 150, Firefox 144 and WebKit 2311 each passed isolated mobile and desktop
checks across `/`, `/components/button`, `/pricing` and `/rtl`: every response
was 200, titles and headings were present, no route overflowed, and there were
no console or page errors. All three engines also activated the deferred Button
interactive preview and editable source; each replaced its load control and
rendered the expected controls/code without runtime errors. These are
automated browser checks, not a claim of founder visual or named screen-reader
approval.

The credential-rotation deployment's focused probe returns 200 health with
commerce mode `disabled` and readiness `not_required`. Unsigned Stripe and
WorkOS webhook requests return fail-closed 503 responses, the disabled Resend
webhook returns 404, and anonymous download-grant creation returns the
indistinguishable private 404. `/auth/sign-in` returns 307 to the replacement
WorkOS client without leaking query values into this record. The replacement
WorkOS environment has the exact callback/homepage, apex and `www` CORS
origins, 30-day maximum sessions, 5-minute access tokens, a 2-day inactivity
timeout, all four authentication-email classes, the Gummy UI display identity
and `support@kreydlabs.com`. Its webhook is enabled for the 13 implemented
identity, organization, membership and invitation events while the application
processing flag remains false. WorkOS support is handling revocation of an
orphaned, unused platform-managed key that neither Convex nor the WorkOS
dashboard exposes for self-service deletion.

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
This was lab evidence for the earlier audited release rather than a
full-coverage site score or a claim about field INP.

### Current-release Lighthouse recheck

After the final functional release reached production, Lighthouse 13.4.0 ran
three additional sequential mobile checks and one desktop check. Mobile
performance scored 94, 92 and 94 (median **94**); accessibility, best practices
and SEO scored 100 on every run. Mobile CLS was zero; LCP was 2.580 s,
2.719 s and 2.717 s, and TBT was 92 ms, 151 ms and 87 ms. The desktop check
scored 100 in all four categories with 0.506 s LCP, 0 ms TBT and zero CLS.

That release's mobile median therefore did not satisfy the homepage performance
target above 95. Lighthouse attributed most remaining loss to H1 render delay,
with 26 KiB estimated unused JavaScript and measurable style/layout work. This
result remained open until the managed-credential recheck below; the separate
full-site diagnostic gate remains open. The
earlier 98 mobile median is retained as historical evidence only.

### Managed-credential release Lighthouse recheck

After the managed-credential deployment became canonical, Lighthouse 13.4.1
ran three more sequential, storage-isolated mobile checks against the real
production origin. Performance scored 93, 99 and 99 (median **99**);
accessibility, best practices and SEO scored 100 in all three runs. Median FCP
was 1.066 s, LCP 2.266 s, Speed Index 1.066 s, TBT 34 ms and CLS zero.

This restores the homepage mobile median above 95 without replacing the slower
93 tail or claiming field performance. No performance experiment was deployed:
a homepage prefetch candidate reduced requests but regressed its focused local
median and was reverted. The separate full-site greater-than-95 diagnostic
gate remains open. The run table, raw working paths and SHA-256 hashes are
recorded in
[`evidence/lighthouse-production-2026-07-28/mobile-recheck-summary.md`](evidence/lighthouse-production-2026-07-28/mobile-recheck-summary.md).

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

### Post-fix production crawl

After those corrections reached production, SquirrelScan 0.0.80 repeated the
full crawl with the same 500-page limit:

- 445 URLs crawled with no page-cap truncation;
- 28,466 checks passed, 1,288 warned and 25 failed;
- aggregate diagnostic score 81/B;
- group scores: SEO 87, performance 63, security 98 and agents 50.

This is an improvement from 79/C, 33 failures and 1,353 warnings. It is still
below the required 95+ full-coverage gate. The remaining 23 accessibility
errors are attributed to hidden native/proxy form controls generated by Base
UI and Radix while the hydrated axe and accessibility-tree suites pass; the
other two failures are aggregate page-weight and cache-freshness rules.
Security has no errors. The redacted post-fix report SHA-256 is
`603929c3d9d43de4d994bac62d6e1c3c87072e1834b6378bdf827eaf20ef7c4a`.

### Next safe remediation tranche

The current source applies the next non-gaming improvements identified from
the 81/B report:

- component detail pages fetch registry JSON only after an explicit
  `Load editable source` action;
- the complete Base/native and Radix preview runtimes load only after their
  explicit interaction actions, while their hydrated axe suites continue to
  exercise every documented resting state;
- the five ordered component-documentation stylesheets are generated as one
  route-scoped request while their individual registry-consumer files remain
  available;
- the pagination specimen uses fragment-only destinations rather than fake
  crawlable query pages;
- RSS and Markdown resources remain public and linked from their dedicated
  discovery surfaces but are excluded from the HTML SEO sitemap;
- every Pro block-category title and description meets tested, substantive
  length bounds; and
- `og.png` remains 1200×630 while lossless optimization reduces it from
  854,293 to 668,843 bytes.

These source changes did not overwrite the then-authoritative 81/B production
result. The following deployed crawl establishes their effect.

### Payload-deferment production crawl

After the safe remediation tranche reached production at runtime-bearing commit
`c4d0d7847ef1701392bf430f96cc8fccf0eb000e`, SquirrelScan 0.0.80
repeated the full crawl with the same 500-page limit:

- 375 URLs crawled;
- 27,929 checks passed, 1,195 warned and 41 failed;
- aggregate diagnostic score 83/B;
- group scores: SEO 90, performance 61, security 98 and agents 50.

This was the authoritative full-site diagnostic result before the
managed-credential redeployment. It improves the
aggregate from 81/B to 83/B and reduces warnings by 93, but it does not satisfy
the separate required score above 95. The eight accessibility errors are the
same hidden Base UI switch input reported across `/` and `/themes` under four
scanner rules; independent hydrated axe and accessibility-tree suites pass.
The remaining 33 failures are scanner-observed TTFB variance, aggregate byte
weight and cache-lifetime modelling, plus one sitemap URL (`/components/label`)
that the crawler did not visit. The tracked redacted report is
`docs/audits/evidence/squirrel-production-c4-2026-07-28-redacted.llm`; its
SHA-256 is
`071f9609d5d69e806a8c57172e9519e18f1c70b6ec6ad5c3086f1879919e31c3`.
The raw report was deleted after redaction and a sensitive-pattern scan.

### Managed-credential production crawl

After Vercel restricted the imported Stripe resource to Production, rotated its
initial credentials and rebuilt exact public head
`1401963129eb9236c0b973451a20fcc1f2d81cf9`, Ready deployment
`dpl_HmDWC8MZomdq3ZMB2MtK2VJHGdCL` became the canonical origin. Commerce
remained disabled. SquirrelScan 0.0.80 then completed two fresh refreshes:

- surface audit `7e4b8798`: 120 pages, 85/B, 11,640 checks passed, 464 warned
  and 9 failed;
- uncapped full audit `86fcae87`: 375 discovered URLs, 84/B, 28,005 checks
  passed, 1,150 warned and 10 failed;
- full group scores: SEO 90, performance 67, security 98 and agents 50; and
- the full LLM report SHA-256 is
  `d40cd28c26a74dfd20f57ba2a83aed6d4693d34ff46bc02466c66b02e7061885`.

This is the current authoritative full-site diagnostic result. The eight
accessibility failures are four rules reporting the same hidden
`tabindex="-1"` Base UI form-participation mirror on `/` and `/themes`.
Hydrated axe, accessibility-tree, keyboard and focus-visible gates pass. The
other two failures are scanner-wide aggregate site-weight and HTML-cache
models: the former has no affected page and sums shared resources across the
crawl, while the latter does not recognise the observed Vercel CDN cache
evidence. The scanner also skipped `/components/label`, but direct sitemap
parsing finds 292 entries and the route returns 200.

The current crawl still identifies genuine work that is not dismissed as a
scanner limitation: CSP retains constrained inline allowances;
`component-docs.css` is 190,596 raw bytes (30,229 compressed); `/themes`
reports four render-blocking resources; the 18 technical articles have no
external source links; and the public privacy notice names every provider but
does not publish an explicit subprocessor directory. TTFB warnings were
transient: six immediate repeats of the flagged article returned in
46–176 ms. The raw reports remain in the protected operator workspace; a
targeted sensitive-pattern scan found no secrets, authentication query values
or email addresses.

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
