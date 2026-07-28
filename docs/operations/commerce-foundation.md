# Convex commerce foundation

**Status:** implemented locally and uploaded to the EU Convex development
deployment. Stripe Managed Payments is live-account ready with three products,
nine prices and `support@kreydlabs.com` configured. A Vercel project, domain
attachment and part of its environment are configured. A Convex production
deployment exists and `CONVEX_SERVER_SECRET` is set there. A WorkOS team and
non-production AuthKit environment are provisioned, configured and proved
through the staging sign-in, account, team, invitation, export, deletion,
sign-out and unpaid-download journeys. Current production code/schema,
production AuthKit, remaining runtime environment, webhooks, email, release
storage, monitoring, Vercel Pro, DNS, deployment and all production customer
journeys remain gated; checkout and webhook flags remain fail closed.

## Production provider state — 28 July 2026

| Provider                              | Confirmed control-plane state                                                                                                                                                                                                                                                                                                        | Still required before launch                                                                                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stripe Managed Payments               | Live-account ready; three products, nine prices and `support@kreydlabs.com` are configured. The active `gummyui-production` destination listens for the exact 16 required event types at `/api/webhooks/stripe`; its signing secret is installed only in Vercel Production, the ignored local environment and the operator keychain. | Complete the prepared restricted production runtime key, verify signed delivery at the deployed origin, then pass sandbox and authorised live purchase/refund journeys.         |
| Vercel                                | The project, domain attachment and part of the production environment are configured.                                                                                                                                                                                                                                                | Activate Vercel Pro, finish environment values, preserve disabled commerce flags until dependencies pass, cut over Namecheap DNS, deploy, and verify HTTPS and the real origin. |
| Convex                                | The EU development deployment exists; a production deployment also exists with `CONVEX_SERVER_SECRET` set.                                                                                                                                                                                                                           | Deploy and verify the current code/schema, remaining application environment, WorkOS JWT integration, data lifecycle, backup, isolated restore and customer journeys.           |
| WorkOS                                | Team and staging AuthKit environment provisioned; real staging identity, organization, invitation, export, deletion and sign-out journeys passed.                                                                                                                                                                                    | Add the WorkOS billing method, provision/configure production AuthKit and webhooks, then repeat identity, recovery, team and deletion journeys at the production origin.        |
| Resend, Better Stack and Backblaze B2 | Application adapters and local contracts exist.                                                                                                                                                                                                                                                                                      | Provision each production connection and prove email delivery, monitoring/alerts, protected releases, backup and restore.                                                       |

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
  environment; production remains unavailable until its billing method is
  added and the production environment is provisioned.
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

Private paid archives remain in Backblaze B2. Convex stores release metadata,
checksums and access state, never the archive credential or a permanent public
download URL.

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

1. Add the WorkOS billing method, provision the production AuthKit environment
   from `convex.json`, and install its production-only client ID and key.
2. Deploy and verify the current code/schema against the existing Convex
   production deployment, then finish and verify its application environment
   linkage without exposing or replacing the already-set
   `CONVEX_SERVER_SECRET`.
3. Connect Resend, Backblaze B2 and Better Stack; verify sender DNS, protected
   release delivery, alerts and restore evidence.
4. Complete and install the prepared restricted Stripe runtime key, verify all
   nine runtime price mappings and signed delivery through the active
   16-event production destination, then prove the sandbox journeys while
   checkout and webhook flags remain disabled for customers.
5. Activate Vercel Pro, finish the production environment, cut over Namecheap
   DNS, deploy, and verify HTTPS and the real production origin.
6. Run founder browser and translation review, then the authorised production
   purchase followed by the approved full refund.
