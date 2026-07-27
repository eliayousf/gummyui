# Provider-neutral commerce foundation

**Status:** local implementation only; no live provider, authenticated account,
credential, product, price, entitlement, checkout, storage bucket, database,
queue, sender, monitor, or deployment is configured.

This foundation supplies the local data contracts and security rules needed to
build account, workspace, commerce, entitlement, protected-download, lifecycle,
and recovery flows without selecting or activating a vendor.

## What exists

- `db/schema.ts` defines 24 D1/SQLite tables for account projections, profiles,
  workspaces, memberships, invitations, provider-event ingestion, billing
  customers, purchases, subscriptions, invoices, refund/credit/chargeback
  adjustments, licences, seats, releases, entitlements, one-use download
  grants, audit and consent events, exports, deletions, outbox work,
  reconciliation runs, dead letters, and retention actions. Workspace-level
  and account-level entitlements use separate partial unique indexes so a
  nullable account cannot bypass scope uniqueness.
- `drizzle/0000_cool_jimmy_woo.sql` and
  `drizzle/0001_right_stark_industries.sql` are the generated migrations. They
  have foreign keys, replay/idempotency uniqueness, lookup indexes, timestamps,
  uppercase ISO-currency checks, and period/update/status/value constraints.
- `lib/commerce/providers.ts` defines identity, billing, transactional email,
  object-storage, queue, and monitoring ports. `fakes.ts` provides deterministic
  in-memory implementations and simulated provider failures.
- `authorization.ts` makes access decisions only from explicit current facts.
  It requires both the current identity-provider membership and reconciled
  local membership to match account, workspace, active state, and role.
  Missing providers, missing projections, mismatched opaque identifiers,
  inactive accounts/workspaces/memberships/licences/seats/entitlements, closed
  update windows, and unavailable releases all deny access.
- `grants.ts` creates HMAC-authenticated, short-lived, same-origin download
  paths. Tokens bind account, workspace, release, entitlement, optional request
  fingerprint, nonce, issue time, and expiry. `downloads.ts` additionally
  requires a current request-authenticated caller, binds that caller and
  request fingerprint to the token, re-fetches every authorization fact at
  consumption time, and places authorization plus one-use nonce consumption
  behind an explicitly atomic repository contract. Tampering, replay, expiry,
  membership/seat/entitlement revocation, and binding changes fail closed with
  one generic external denial.
- `webhooks.ts` verifies exact raw bytes through an adapter contract. Its local
  HMAC adapter is test-only. Projection decisions reject unverified events,
  deduplicate provider event IDs, and prevent older or same-time events from
  regressing current state.
- `security.ts` provides signed session-bound CSRF tokens, unsafe-method origin
  checks, hardened cookie serialization, deterministic local rate limiting,
  and recursive PII/secret/log redaction.
- `lifecycle.ts`, `delivery.ts`, and `backup.ts` provide explicit export,
  deletion, retention, retry/dead-letter, checksum, restore-verification, and
  record-reconciliation state machines. Backup objects can be encrypted and
  authenticated with AES-256-GCM, fresh nonces, and bound object metadata.
  Backup manifests can separately be authenticated with a keyed, versioned
  HMAC envelope and key identifier; the unkeyed checksum remains corruption
  evidence only.
- `/sign-in`, `/checkout`, and the `/account` overview, purchases, licences,
  downloads, billing, team, members, invitations, profile, security, privacy,
  export, and deletion routes now provide a noindex, private-cache information
  architecture. The production server guard returns an honest unavailable
  state and never injects a fake customer.
- `/api/download-grants` and `/downloads/[grant]` are present only as generic
  fail-closed 404 boundaries. They issue or stream nothing until an approved
  request-session resolver and transactional repository are connected.
- `email-intents.ts` defines product-owned release access, invitation
  follow-up, security, export, deletion, refund-workflow, and access-recovery
  messages. Authentication, identity recovery, invoices, receipts, billing
  portal, and provider dunning messages remain outside this layer.

No module imports a vendor SDK. Commercial offers, products, plans, terms,
retention periods, role policies, retry policies, templates, and provider
references remain opaque caller-supplied configuration.

## Security invariants

1. Browser checkout success is never entitlement evidence.
2. A verified provider event is applied at most once and may not regress a
   projection with an earlier or equal provider occurrence time. Equal-time
   conflicts require provider reconciliation.
3. Authorization requires a current request session, current provider
   membership, and current local projection. Provider errors, removed provider
   membership, and provider/local role mismatch are denial conditions.
4. Workspace, account, membership, licence, seat, entitlement, release, and
   token bindings must all agree. Identifier mismatches return the same
   not-found-or-forbidden decision.
5. Download tokens are not sufficient bearer authorization and are not raw
   object-storage URLs. A current caller session and current authorization
   transaction are required; the one-use same-origin grant never exposes
   object keys or storage credentials.
6. State-machine transitions are explicit and timestamps are monotonic. Active
   retention and legal holds block deletion/purge.
7. Backup completion is not evidence of recoverability. Object size, schema
   version, record count, object checksum, manifest checksum, authenticated
   manifest tag, and restored record reconciliation must all pass. A checksum
   alone does not authenticate an off-provider backup.
8. Logs must use scrubbed structured values. Raw provider bodies, credentials,
   signed URLs, licence data, email addresses, cookies, and authorization
   headers must not be exported.

The in-memory rate limiter, protected-download repository, provider-event
inbox, and provider fakes are deterministic test implementations. Production
adapters must supply distributed semantics and make the protected-download
current-state read, authorization decision, and nonce consumption one database
transaction.

## Local verification

Run all commands inside the repository dev shell:

```sh
nix develop path:. -c npm run db:generate
nix develop path:. -c npm run typecheck
nix develop path:. -c npm run lint
nix develop path:. -c npm run test:unit
```

To verify that the generated migration executes in SQLite without installing a
tool globally:

```sh
commerce_check_dir="$(mktemp -d)"
nix shell nixpkgs#sqlite -c sqlite3 \
  "$commerce_check_dir/schema.sqlite" \
  ".read drizzle/0000_cool_jimmy_woo.sql" \
  ".read drizzle/0001_right_stark_industries.sql" \
  "PRAGMA foreign_key_check;" \
  "PRAGMA integrity_check;"
```

The command uses a new temporary database. Do not point this check at a
production or user database.

## Remaining founder, vendor, and account gates

Nothing in this module authorizes the following actions:

1. Approve the selling entity, launch countries, commercial model, product and
   offer references, currencies, billing intervals, price presentation, seat
   rules, licence/update rights, cancellation/refund terms, tax treatment,
   invoice wording, or support commitments.
2. Select identity, billing/merchant-of-record, email, object-storage, queue,
   monitoring, analytics, backup, secrets, support-mailbox, hosting, DNS, or
   registrar vendors.
3. Create any vendor or cloud account; accept terms or data-processing terms;
   provide identity/KYB, company, tax, payout, billing, or beneficial-owner
   information; or purchase a plan.
4. Approve the production owner, backup owner, least-privilege roles, recovery
   process, credential rotation, incident commander, privacy owner, security
   contact, support owner, and monitored alert destinations. Approve separate
   backup authentication and AES-256-GCM encryption keys stored outside backup
   objects, their key identifiers, nonce monitoring, rotation/retirement
   procedures, and restore access for the backup owner.
5. Create or supply OAuth clients, API keys, HMAC secrets, webhook endpoints,
   sender/domain verifications, database/storage/queue bindings, runtime
   secrets, status pages, custom domains, or DNS records.
6. Approve role-to-action policy, commercial offer mapping, entitlement
   projection rules, retention durations, deletion blockers, legal holds,
   export expiry, rate limits, retry/backoff/dead-letter policy, monitoring
   thresholds, and cost/spend limits.
7. Approve privacy notices, consent purposes, data inventory, lawful bases,
   processor register, international transfers, audit retention, deletion
   exceptions, customer exports, licence text, or any other legal/public copy.
8. Wire provider-specific adapters only after official signature, retry,
   ordering, idempotency, session, organisation, refund, email-state, and
   object-access behavior has been mapped and tested against the approved
   vendor's current documentation.
   The production download adapter must prove its current caller lookup and
   authorization-plus-consumption transaction under concurrency and revocation.
9. Provision staging or production infrastructure, apply the migration to a
   non-local database, attach a domain, send an email, create a checkout, upload
   a release, publish account/commerce routes, or deploy.
10. Perform sandbox journeys and recovery tests under separately approved test
    accounts, then obtain a final production approval before any low-risk live
    purchase/refund, customer-facing message, or public launch claim.
