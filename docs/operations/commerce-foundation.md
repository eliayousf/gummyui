# Convex commerce foundation

**Status:** implemented locally and uploaded to the EU Convex development
deployment. Stripe Managed Payments is live-account ready with three products,
nine prices and `support@kreydlabs.com` configured. Production control-plane
resources now exist for WorkOS, Resend, Better Stack, Backblaze B2, Convex and
Vercel, and every planned Vercel Production environment value is installed.
The Stripe runtime value is now a separately issued least-privilege restricted
key stored only as Vercel's sensitive Production `STRIPE_RESTRICTED_KEY`; the
managed Marketplace Standard key remains present but is not selected by the
application. The current Convex production code/schema is deployed, and Vercel Pro is active
with $1 spend management, notifications and Pause Projects enabled. This is not
customer-journey evidence: a protected paid release and every complete
production customer journey remain gated. The current production deployment is
Ready, both custom domains are Valid, and the full public-origin probe passes.
Stripe webhook
processing is enabled and rejects unsigned input with HTTP 400; checkout
remains fail closed. WorkOS and Resend webhook processing are enabled. GitHub
Quality run `30578846508` passes the operations-only Backblaze and WorkOS
evidence update through the complete launch gate.

## Production provider state — 30 July 2026

| Provider                | Confirmed control-plane state | Still required before launch |
| ----------------------- | ----------------------------- | ---------------------------- |
| Stripe Managed Payments | Live-account ready; three products, nine prices and `support@kreydlabs.com` are configured. The active `gummyui-production` destination listens for the exact 16 required event types at `/api/webhooks/stripe`; its signing secret is installed only in secure runtime/operator stores. The founder completed Stripe email and authenticator verification on 30 July. `gummyui-production-runtime-v3` was rotated exactly once, its predecessor received a 60-minute expiry overlap, and the replacement was installed only as Vercel's sensitive Production `STRIPE_RESTRICTED_KEY`. Prices Read, Checkout Sessions Write, and the required subscription, invoice, refund, dispute and payment-intent reads are configured. A protected Production cron invocation succeeded with `credential: restricted-live`, `checkout: disabled` and all nine prices verified. Webhook processing is enabled and an unsigned request at the production endpoint is rejected with HTTP 400. Test mode has a separate restricted runtime key, operator key, three products and nine verified prices. Genuine Managed Payments Monthly and Lifetime Checkouts completed against the isolated Convex target; purchase, cancellation and full-refund projection ended with exact access revocation. A separate Managed Payments test-clock Checkout proved a natural paid renewal, natural failed renewal, cancellation, and access states active, renewed, suspended and expired. | Verify provider-delivered signed events at the deployed origin, extend the journey through production email and a protected paid release, then pass the authorised live purchase/refund journey. |
| Vercel                  | Pro is active, with spend management set to $1, notifications enabled and Pause Projects on. Every planned Production environment value is installed. Operations-only provider-evidence deployment `dpl_37iEucvtFmnmR1MEKStcstVpr376` is Ready on the apex, `www` and canonical aliases; repository Quality run `30578846508` passes the complete launch gate. The HTTPS health probe remains OK with commerce disabled, and the protected Stripe readiness probe still selects the restricted live credential, reports checkout disabled and verifies all nine prices. Controlled rollback and re-promotion were proved for the preceding audited application release. | Preserve fail-closed checkout until signed delivery and every commerce journey pass at the real origin. |
| Convex                  | Production has the current 25-table schema/functions and now contains the controlled account/privacy journey rather than an empty database. Backup `20260729T123911183Z-2b453beb402d4f6d818aafde6ecf6f7d` encrypted, uploaded and independently verified all 24 durable tables and 26 records; a new empty isolated target restored and re-exported those same counts with `rateLimitWindows` still empty. After the membership retry, current backup `20260729T125815872Z-36a3348ed93148cfad2fa6e193d8023a` independently verified the final 24-table/28-record state. Production was export-only. A fresh dedicated `gummyui-sandbox` project/deployment was created on 30 July, its empty 24-table target was seeded only with the synthetic restore-query identity/release fixture, and the paid-access, grant replay/expiry and refund-revocation proof passed without external integrations. The isolated two-offer and test-clock Stripe journeys also reconciled their exact purchase, licence, entitlement, seat, renewal, failed-invoice and access state. | Preserve the isolated two-offer and test-clock evidence; complete the remaining production customer journeys and later remove superseded isolated targets after founder authentication. |
| WorkOS                  | The replacement production environment is fully configured and the real hosted sign-up/callback now passes. Dashboard inspection on 30 July reconfirmed the production app homepage as `https://gummyui.dev` and its redirect URI as `https://gummyui.dev/auth/callback`. The Convex CLI message that set `http://localhost:3000` was traced to the separate `gummyui-sandbox` development deployment and its WorkOS staging key; it did not target production. One active production profile, two workspaces and the owner/admin memberships are projected in Convex. Team creation/switching, export/download, deletion request/cancellation, session refresh and authenticated unpaid download denial passed. Signed user, organization and membership events were delivered. The live membership payload exposed an unused organization-name requirement; commit `2fb2b6b` fixes it with a real-payload regression test. WorkOS's 13:56 retry is Delivered and the matching Vercel request returned 200. Direct inspection on 30 July reconfirmed that the older orphaned environment and its platform-managed, non-expiring Convex credential still exist; no support confirmation has arrived. The authenticated production application also accepted an invitation for the controlled support identity and reported that WorkOS sent it securely. | Complete recovery/final deletion, accept and reconcile the pending second-identity invitation, and obtain support confirmation that the orphaned key/environment was revoked. |
| Resend                  | `send.kreydlabs.com` is verified. Production sending and the signed webhook are enabled. In addition to the deleted one-use controlled sender authorization, the real export and deletion/cancellation journey produced two application outbox messages; Resend and Convex delivery audits record both as delivered. A fresh 30 July inspection showed all three controlled messages Delivered and successful `email.delivered` webhook signals. | Complete purchase/licence/refund email journeys after Stripe and a protected release are ready. |
| Better Stack            | Free monitoring is configured with an uptime monitor, status page, one active production log source and four scheduled-job heartbeats. All four controlled production jobs return 200 and the UI shows all matching heartbeats Up. The EU host fix is deployed, controlled ingestion receives HTTP 202 and the live tail retains production events. Better Stack's sample incident records email delivery and opening; a separate genuine missing-heartbeat drill on the email-outbox monitor opened incident `994928414`, recorded an email sent to `support@kreydlabs.com`, and returned Up after schedule restoration plus a controlled recovery heartbeat. | Keep the production schedules aligned with Vercel cron and repeat the controlled drill on the documented cadence. |
| Backblaze B2            | Two private encrypted EU buckets exist for protected releases and operational backups. A fresh production backup exported all 24 durable tables, uploaded encrypted/authenticated objects, read every object back and passed latest-backup verification. The mode-0600 operator copy independently verified it, and the isolated restore reconciled all 24 tables. Founder dashboard reauthentication on 30 July exposed the exact three-key inventory; the pre-rotation backup key was reconciled against the current runtime and recovery configurations and revoked, while the release-read and dated current-backup keys remain. The surviving backup credential then reauthenticated through an isolated CLI profile, read its scoped bucket and enumerated all 200 current objects. No key ID, object name or reusable credential was retained in evidence. | Upload and verify immutable paid releases, prove paid delivery, and move the recovery bundle into founder-approved custody. |

Control-plane readiness is not runtime readiness. No row above marks a North
Star step passed; the production-verified revenue loop remains 0 of 8.

The private no-network Figma 0.5.0 materialiser has now run idempotently. Its
exact structural audit and a separate-file restore both confirm 138 sets, 2,588
editable variants, 72 editable pattern sets, 72 raster references, 204
variables, 300 masters and 900 responsive instances. Founder visual review and
approval of the mode-0600 checksum-bound editable export remain fail-closed
release gates.

## Architecture

- `convex/schema.ts` defines 25 application tables. Twenty-four durable
  commerce tables cover accounts, workspaces, memberships, provider events,
  billing, licences, releases, downloads, privacy operations, the email outbox,
  reconciliation, dead letters and retention. `rateLimitWindows` is an
  intentionally ephemeral distributed abuse-control table and is not part of
  the durable backup manifest.
- `convex/commerce.ts` is the transactional backend. Every server call requires
  the deployment-only `CONVEX_SERVER_SECRET`. Stripe and WorkOS events are
  deduplicated by provider event ID and payload hash.
- `db/index.ts` is the sealed Next.js-to-Convex adapter. It validates the
  deployment URL and refuses missing or weak server configuration.
- `convex/auth.config.ts` configures the official WorkOS AuthKit JWT issuers.
  The development deployment uses the provisioned non-production WorkOS
  environment. Production AuthKit and its Vercel credentials are provisioned,
  the matching deploy-time credentials are configured in Convex production,
  and the current auth configuration plus 25-table schema is deployed.
  Production-origin JWT verification remains pending.
- `stripe-convex-store.ts`, `stripe-convex-lifecycle-store.ts` and
  `stripe-convex-adjustment-store.ts` project verified Stripe events into one
  atomic Convex mutation.
- `workos-identity.ts` and `workos-webhook.ts` store opaque WorkOS identifiers,
  a one-way email hash and minimal profile fields. They do not store the email
  address.
- `convex-downloads.ts` rechecks account, workspace, membership, licence, seat,
  entitlement, release and update-window state before issuing or consuming a
  short-lived one-use grant.
- `privacy-operations.ts` creates audited data exports and deletion requests.
  The final WorkOS deletion happens only after the final outbox notice is
  recorded as delivered.
- `rate-limit.ts` applies atomic multi-bucket limits through Convex. It stores
  only HMAC-derived scope and key hashes, fails closed in production without a
  strong `RATE_LIMIT_KEY_SECRET`, and opportunistically prunes expired windows.
- `resend-outbox.ts` claims bounded batches in Convex, resolves the current
  WorkOS email only at delivery time, uses Resend idempotency keys, retries
  transient failures and records permanent failures without retaining provider
  response bodies.
- `better-stack-heartbeats.ts` validates four optional, server-only Better
  Stack heartbeat URLs against the exact official HTTPS endpoint. The email
  outbox, privacy deletion, backup and backup-verification routes ping only
  after their corresponding work completes successfully. Heartbeat delivery is
  best-effort so a monitoring outage cannot retry a completed destructive or
  non-idempotent job, and secret URL tokens are never logged.

Private paid archives are designed to reside in the provisioned release B2
bucket. Convex stores release metadata, checksums and access state, never the
archive credential or a permanent public download URL. Deterministic
product-specific archive creation and an immutable B2 upload/read-back prover
now exist in the private repository. Secret-protected Convex publication and
withdrawal operations now exist in the public runtime; they validate the exact
private archive-key contract, preserve product-level entitlements, revoke
unused grants on withdrawal and emit only redacted results. These are
fail-closed foundations, not release evidence: no paid archive, B2 release
object, production release record or production download journey is yet
verified.

## Security invariants

1. A checkout return URL is never proof of payment or access.
2. Only signature-verified Stripe and WorkOS projections enter the database.
3. Reusing an event ID with a different payload hash fails closed.
4. Authorization rechecks the current WorkOS session and the current Convex
   projection.
5. Download grants are HMAC-authenticated, short-lived, single-use and bound to
   account, workspace, release and entitlement.
6. Refunds, disputes, subscription failures and identity revocations update
   licences, seats, entitlements and unused grants atomically.
7. Email recipient addresses are fetched from WorkOS at send time and are not
   stored in Convex.
8. Secrets remain server-only runtime values and are never committed, included
   in registry packages or sent to browser code.
9. Database backups include exactly the 24 durable commerce tables. Restore
   refuses any target whose durable tables or ephemeral rate-limit table contain
   data, and never imports rate-limit windows.
10. Scheduled-job monitoring accepts only the Better Stack heartbeat origin and
    success path. Failure-reporting suffixes, query strings, credentials,
    redirects and lookalike hosts are rejected.

Provider setup, schedules and evidence requirements are in the
[monitoring runbook](./monitoring.md#scheduled-job-heartbeat-contract).

## Local and development verification

Run inside the repository dev shell:

```sh
nix develop path:. -c npm run typecheck
nix develop path:. -c npm run lint
nix develop path:. -c npm run test:unit
nix develop path:. -c npm run convex:check
```

`tests/ConvexCommerce.test.ts` runs the real Convex mutation code against
`convex-test`. It checks paid checkout projection, replay rejection,
subscription renewal, refund revocation, safe restoration after overlapping
chargebacks and WorkOS identity minimisation.
`npm run convex:check` typechecks and uploads the same functions to the selected
development deployment.

## Still required before paid launch

1. Preserve the passing Lighthouse production audits (mobile performance 98;
   accessibility, best practices and SEO 100; desktop all 100) and the fresh
   219-resource SquirrelScan result of 97/A with 12,427 passes, 155 warnings
   and zero failures.
2. Complete account recovery, final deletion and a second-identity invitation
   while preserving the already-set `CONVEX_SERVER_SECRET`.
3. Preserve the frozen restricted Stripe runtime key and its successful
   nine-price Production readiness proof. The isolated two-offer
   purchase/refund and test-clock renewal/failure/cancellation journeys pass.
   Next prove provider delivery through the active production destination,
   purchase/licence/refund email, and protected release delivery before
   enabling live checkout.
4. Build and upload an immutable protected release, prove unpaid denial and paid
   delivery, and move the current recovery bundle into approved operator
   custody.
5. Preserve the proved WorkOS/Resend/Better Stack paths and extend them through
   the purchase, licence, cancellation and refund journeys.
6. Run founder browser and translation review, enable commerce only after every
   earlier gate passes, then complete the authorised production purchase and
   full refund.
