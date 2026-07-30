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
review, sandbox Checkout, protected-release and live purchase/refund gates are
completed.
