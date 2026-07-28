# Convex commerce foundation

**Status:** implemented locally and uploaded to the EU Convex development
deployment. Stripe Managed Payments is live-account ready with three products,
nine prices and `support@kreydlabs.com` configured. Production control-plane
resources now exist for WorkOS, Resend, Better Stack, Backblaze B2, Convex and
Vercel, and every planned Vercel Production environment value except the Stripe
runtime key is installed. The current Convex production code/schema is deployed,
but this is not customer-journey evidence: Vercel Pro activation,
production-origin WorkOS integration, the Stripe restricted runtime key, Vercel
deployment, DNS and every production customer journey remain gated. Checkout
and webhook flags remain fail closed.

## Production provider state — 28 July 2026

| Provider                | Confirmed control-plane state | Still required before launch |
| ----------------------- | ----------------------------- | ---------------------------- |
| Stripe Managed Payments | Live-account ready; three products, nine prices and `support@kreydlabs.com` are configured. The active `gummyui-production` destination listens for the exact 16 required event types at `/api/webhooks/stripe`; its signing secret is installed only in secure runtime/operator stores. | Resolve the generic Stripe Dashboard error preventing creation of the least-privilege restricted runtime key, install it, verify signed delivery at the deployed origin, then pass sandbox and authorised live purchase/refund journeys. |
| Vercel                  | The project and domain attachment exist. Every planned Production environment value except the Stripe runtime key is installed; commerce remains disabled. | Add the founder-controlled card and activate Pro, install the Stripe key, preserve fail-closed flags until dependencies pass, deploy, cut over Namecheap DNS, and verify HTTPS and the real origin. |
| Convex                  | The EU development deployment exists; production has `CONVEX_SERVER_SECRET` and the canonical WorkOS deploy-time credentials. The current 25-table schema, indexes and functions are deployed; post-deploy inspection confirmed all 25 tables are present and empty. | Verify WorkOS identity at the production origin, then prove data lifecycle, backup, isolated restore and customer journeys. |
| WorkOS                  | Staging journeys passed. Production AuthKit is enabled and its redirect, application, branding and webhook are configured; production credentials are installed in Vercel and Convex production, whose current auth configuration is deployed. | Verify the JWT integration and repeat sign-in, recovery, team, invitation, export and deletion journeys at the production origin. |
| Resend                  | `send.kreydlabs.com` is verified. Its production API key and webhook plus the current sender/reply-to settings are installed in Vercel. | Verify signed webhook receipt and controlled access/status email delivery through the deployed origin. |
| Better Stack            | Free monitoring is configured with an uptime monitor, status page, log source and four scheduled-job heartbeats. The corresponding Vercel environment values are installed. | Prove deployed-origin uptime/log ingestion, successful job heartbeats, missing-heartbeat behavior and controlled alert receipt. |
| Backblaze B2            | Two private encrypted EU buckets exist for protected releases and operational backups, with separate scoped runtime and backup keys installed in Vercel. | Upload and verify immutable paid releases, prove unpaid denial and paid delivery, create a real encrypted backup, and complete isolated restore verification. |

Control-plane readiness is not runtime readiness. No row above marks a North
Star step passed; the production-verified revenue loop remains 0 of 8.

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
archive credential or a permanent public download URL. No paid release or
production download journey is yet verified.

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

1. Add the founder-controlled Vercel card, activate Pro and install the Stripe
   restricted runtime key without exposing any credential.
2. Verify the deployed Convex/WorkOS integration at the production origin,
   preserving the already-set `CONVEX_SERVER_SECRET`.
3. Resolve the generic Stripe Dashboard error, create and install the restricted
   runtime key, verify all nine price mappings and signed delivery through the
   active 16-event destination, then pass the sandbox payment journeys.
4. Build and upload an immutable protected release, prove unpaid denial and paid
   delivery, then create, verify and restore a real encrypted backup.
5. Deploy with commerce still fail closed, cut over Namecheap DNS, verify HTTPS
   and the real origin, then prove WorkOS, Resend and Better Stack end to end.
6. Run founder browser and translation review, enable commerce only after every
   earlier gate passes, then complete the authorised production purchase and
   full refund.
