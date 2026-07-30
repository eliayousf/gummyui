# Production reverification — 30 July 2026

This record covers the canonical `https://gummyui.dev` origin after the
restricted Stripe runtime deployment. Commerce remained disabled throughout;
no purchase, customer, licence or paid-release evidence is inferred from these
checks.

## Full production crawl

SquirrelScan 0.0.38 ran fresh, uncached surface and full crawls:

```sh
squirrel audit https://gummyui.dev -C surface --refresh --format llm
squirrel audit https://gummyui.dev -C full --refresh --format llm
```

The surface crawl audited 100 pages, scored 96/A, passed 9,138 checks, warned
on 120 and failed none. The full crawl audited 219 pages/resources across all
135 sitemap URLs, scored 96/A, passed 12,420 checks, warned on 162 and failed
none.

The authoritative full-crawl groups were:

| Group | Score |
| --- | ---: |
| Accessibility, Core SEO, Crawlability, E-E-A-T, Internationalization, Images, Legal Compliance, Links, Mobile, Structured Data, Social Media and URL Structure | 100 |
| Content | 99 |
| Performance | 96 |
| Security | 94 |

This satisfies the greater-than-95 full-coverage gate. It does not satisfy any
production revenue-loop step.

## Warning reconciliation

There were no errors or failed checks. Every warning remains owned:

- Engineering owns the constrained CSP `unsafe-inline` allowance and the
  existing nonce/hash migration backlog. Operations owns the scanner's
  informational observation that HTTP routes correctly redirect to HTTPS.
- Content owns keyword-density warnings on catalogue, pricing, licence, blog
  and locale pages and will reassess them during the next copy review. No
  indexability, structured-data or legal failure accompanies them.
- Operations owns the ten isolated 638–836 ms crawler TTFB samples and monitors
  the same origin through Better Stack. Engineering owns the eight reported
  critical request chains, which are the intentional route-scoped CSS and
  interaction bundles already covered by the passing Lighthouse and local
  performance budgets.

## Origin and fail-closed checks

Fresh independent checks confirmed:

- apex and `www` DNS, HTTPS, redirect and HSTS behaviour;
- HTTP 200 for the home, pricing, licence, commercial licence, terms, privacy,
  refund, support, contact and security pages;
- all nine approved USD prices and `support@kreydlabs.com` on the relevant
  commercial and support surfaces;
- `/api/health` returning HTTP 200 while commerce reports `disabled`;
- the checkout page explicitly unavailable, anonymous checkout creation denied,
  and the internal sandbox-attestation route absent in production; and
- a malformed unsigned Stripe request rejected with HTTP 400 before
  projection.

The production-verified revenue loop remains 0 of 8 until the founder-controlled
review, account, protected-release, provider-delivery and live
purchase/refund gates are completed.

## Subsequent sandbox evidence

Later on 30 July, the isolated Managed Payments sandbox gates completed:
Monthly and Lifetime purchase/cancellation/full-refund access reconciliation
passed, and a separate Stripe test clock proved a natural paid renewal, natural
failed renewal, cancellation, and active/renewed/suspended/expired access
states. This does not alter the production crawl result above or the North Star:
production checkout remains disabled and the production-verified loop remains
0 of 8.

## Post-deployment full crawl

After public application commit `227c2b4` was pushed, Ready production
deployment `dpl_71ifvhmBZYXXjJk3WUBvcyci1MX8` was created and promoted to the
apex aliases. Vercel does not expose that deployment's source SHA, so this
records the observed chronology rather than asserting an unavailable
provider-side exact binding. SquirrelScan 0.0.38 then ran another fresh,
uncached full-coverage crawl. It again audited 219
pages/resources across all 135 sitemap URLs and improved to 97/A, with 12,427
passing checks, 155 warnings and zero failures. Performance improved to 97;
content remained 99, security 94, and every other reported category remained
100. The residual warning groups were the same owned CSP and HTTP-upgrade
observations, content-density heuristics, three isolated 630–734 ms TTFB
samples and eight route-scoped critical request chains. This re-proves the
greater-than-95 production website gate without changing the 0-of-8 revenue
loop.

Lighthouse 13.4.1 then re-ran against the same apex release. Mobile scored 98
performance and 100 for accessibility, best practices and SEO, with 1.6 s FCP,
2.3 s LCP, 10 ms total blocking time and zero CLS. Desktop scored 100 in all
four categories, with 0.4 s FCP, 0.6 s LCP, zero blocking time and zero CLS.
These controlled lab results meet the above-95 gate; they are not field Core
Web Vitals.
