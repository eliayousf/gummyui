# Production account and provider verification — 29 July 2026

## Status

This record extends the 28 July launch audit with the first real account and
data-lifecycle evidence from `https://gummyui.dev`. It does not mark the
product launched. Stripe commerce remains disabled and the single North Star
remains **0 of 8 production-verified steps** until each complete customer
journey has end-to-end production evidence.

The runtime used for the account and webhook verification was Vercel deployment
`dpl_CYKTU6sq1uWWt57EZTe8dTbxAcsu`, built from public commit
`2fb2b6bf704509b7688832c6a35dd109b688a99c`. GitHub Quality run `30451901159` passed the
complete launch gate for that exact commit.

The current public runtime is deployment
`dpl_Gnv4Akeu31WcguSzUXBTCxHYivxb`, built from commit
`e6861f544e3c86ee71b2bcdd21c57beee1d2651b`. It is Ready, owns the canonical
apex and `www` aliases, and its GitHub Quality run `30453896180` passes.

## Real account and privacy journeys

One founder-controlled production identity completed the WorkOS hosted sign-up
and canonical callback. Convex now contains one active account profile, two
active workspaces and the matching owner/admin memberships. The authenticated
account UI proved:

- a personal workspace and a separate `Gummy UI Launch Verification` team;
- owner/admin authorization and workspace switching;
- a ready data export followed by an authenticated download;
- an account-deletion request with the explicit confirmation phrase, followed
  by successful cancellation;
- a silent session refresh after the five-minute access-token boundary; and
- an authenticated unpaid account receiving no protected releases or download
  grants.

The production deletion was deliberately cancelled so that the sole controlled
identity remains available for the remaining acceptance journeys. Account
recovery, final deletion and a second-identity invitation acceptance remain
open.

## WorkOS and Resend delivery

`WORKOS_WEBHOOK_ENABLED` and `RESEND_WEBHOOK_ENABLED` are enabled in Vercel
Production. WorkOS delivered signed `user.created`, `user.updated` and
`organization.created` events, and Convex applied the matching projections.
Signed Resend delivery events were also applied; the two privacy-operation
messages created by the real export and deletion/cancellation journey reached
provider status `delivered`.

The first `organization_membership.created` delivery exposed a contract bug:
WorkOS does not include an organization name in that event, while the
normalizer incorrectly required it. Public commit `2fb2b6b` removes that
unused requirement and adds a real-payload regression fixture. The focused
WorkOS/Convex/team suite, production-gate suite, TypeScript check, secret scan
and `git diff --check` passed before deployment. WorkOS retried the same signed
event at 13:56 BST after the corrected deployment and records it as Delivered.
The matching Vercel request log for deployment
`dpl_CYKTU6sq1uWWt57EZTe8dTbxAcsu` records HTTP 200. This closes the
membership projection regression without creating a duplicate membership.

## Non-empty production backup and restore

A fresh production backup created at `2026-07-29T12:39:11.183Z` exported all
24 durable tables and 26 records. Backup ID
`20260729T123911183Z-2b453beb402d4f6d818aafde6ecf6f7d` passed encrypted B2
upload, full-object readback and the independent
`/api/cron/backup-verify` path with identical table and record counts.

The restore target was an empty, isolated non-production Convex deployment.
Restore re-read, authenticated and decrypted every B2 object, reconciled all
24 durable tables and 26 records, and returned `verified=true`. The protected
post-restore re-export matched the source counts and proved the intentionally
ephemeral `rateLimitWindows` table remained empty. Evidence digests:

- manifest SHA-256:
  `96cd4a727d92a36f61d0cb7c71f9b8043d9fd371c99748347359ac09fc3add56`;
- restored-target fingerprint:
  `095eb0d9a65dbfadb39271e6db62dc9afef249352d5bb69ac55fcce5eda217f7`.

Production was export-only throughout this drill. No production record was
changed or deleted.

After the successful WorkOS membership retry added the final account-journey
audit records, backup
`20260729T125815872Z-36a3348ed93148cfad2fa6e193d8023a` captured the current
production state: all 24 durable tables and 28 records. Both creation-time
verification and an independent latest-backup readback returned identical
counts. The preceding 24-table/26-record backup remains the restore proof; a
redundant second restore was not required.

## Public-origin and product state

- All 292 current sitemap URLs returned HTTP 200.
- HTTPS, canonical redirects, security headers, account-route `noindex` and
  anonymous account/download denial passed.
- The mobile Lighthouse median remains 98, with accessibility, best practices
  and SEO at 100.
- Fresh SquirrelScan 0.0.80 full audit `41bcc736` crawled 376 URLs and scored
  85/B: 28,143 checks passed, 1,134 warned and 10 failed. Core SEO,
  crawlability, E-E-A-T and legal compliance are among twelve categories at
  100; the required score above 95 remains open.
- `robots.txt` now uses the exact `/components/lab$` rule, so
  `/components/label` is crawlable and returns 200.
- Checkout and the Stripe webhook remain fail closed; there are no purchases,
  licences, entitlements, grants or published paid releases.

## Figma boundary

The founder-owned `Gummy UI Pro Design Kit — v1` file remains accessible and
its live page structure contains Cover, Getting Started, Foundations,
Components, Patterns, Reference and Utilities. The current private 0.5.0
materializer still expects 138 editable sets and 2,588 variants. Remote
read-only inspection through the Figma agent connector was rejected because
the Starter-plan MCP call allowance is exhausted; the UI offered a paid seat,
which is not authorized by the recorded no-paid-Figma decision. Therefore the
0.5.0 local Desktop materializer run, clean review evidence, `.fig` export and
restore remain founder-controlled gates. No paid source or editable export was
placed in the public repository.

## Remaining launch gates

The product is not ready to accept customers. The remaining external gates
include Stripe founder identity verification and restricted-key issuance,
an approved protected paid release, complete sandbox and production payment
journeys, a second controlled invitation identity, the Figma/localisation and
assistive-technology reviews, Backblaze key revocation/recovery custody, the
full-site audit target above 95, and the authorized real purchase/full refund.
