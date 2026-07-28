# Backup and restore runbook

Status: the application implements encrypted, authenticated backups for all 24
durable Convex commerce tables, immutable B2 retention settings, latest-backup
verification, and a fail-closed isolated restore-proof runner. The live schema
has a 25th table, `rateLimitWindows`, which contains ephemeral HMAC-derived
abuse-control state and is deliberately excluded from backup and restore.
The Convex production deployment has its server secret and production WorkOS
deploy-time credentials. The current 25-table schema, indexes and functions are
deployed, and a post-deploy inspection confirmed all 25 tables are present and
empty. A separate private encrypted EU B2 backup bucket and scoped backup key
are provisioned, and the corresponding Vercel Production values are installed.
On 28 July 2026 the production backup route completed successfully: it exported
all 24 durable tables, encrypted and authenticated every object, uploaded the
objects to the private B2 backup bucket, read every object back successfully and
sent the matching Better Stack success heartbeat. The production
backup-verification route then completed successfully against the latest
backup. Redacted Vercel function logs retain the 200 responses and structured
completion records; object names, provider tokens and cryptographic material are
not copied into this repository.

An isolated Convex development restore target has the current schema and backup
functions with only distinct restore/export secrets and the `isolated-test`
classification. On 28 July 2026 the scoped B2 credential, both backup
cryptographic keys, their versioned identifiers and the cron credential were
rotated and deployed. The replacement values are stored in a mode-0600 operator
recovery bundle outside both repositories. The superseded cron value is proven
rejected with 404 while the replacement returns a verified 200.

A fresh production backup under the current keys exported, encrypted,
authenticated, uploaded, read back and verified all 24 durable tables. The
operator-held copy independently authenticated and decrypted that exact latest
backup. The isolated target then restored all 24 tables in the fixed sequence,
re-exported them and reconciled the manifest successfully. A subsequent
fail-closed synthetic drill on the still-empty target proved account, team,
licence, entitlement, release, one-use and expired download, full-refund
revocation and audit-query semantics without invoking any outbound provider.
Its redacted evidence is recorded in
`docs/operations/isolated-restore-query-proof-2026-07-28.md`. Superseded B2-key
revocation after dashboard
reauthentication and founder password-manager custody/removal of the local
recovery copy remain required before this control is marked fully complete.

The backup format has two separate cryptographic controls:

- each backup object can be encrypted with an injected, exactly 256-bit
  AES-256-GCM key; its backup ID, object name, schema version, record count,
  plaintext size, checksum, algorithm, and key ID are authenticated as
  associated data, and each encryption receives a fresh 96-bit nonce; and
- the complete manifest can be authenticated with a separately injected
  HMAC-SHA-256 key and versioned key ID.

Wrong keys, object swaps, metadata/ciphertext tampering, weak keys, incomplete
table sets, and plaintext-checksum mismatches fail closed. Neither key is
stored in source, the envelope, or the backup destination.

## Required backup sets

- account, workspace, membership, invitation, licence, purchase, invoice,
  subscription, entitlement, audit, consent, export, and deletion records;
- protected immutable Pro release archives, manifests, checksums, release notes,
  and rollback packages;
- production configuration records that do not contain reusable secrets;
- provider identifiers needed to reconcile payments, email, and authentication;
  and
- the public and private immutable source commits for each release.

Secrets remain in the approved secret manager and follow their own recovery and
rotation process. They must not be copied into a repository backup.

## Automated database restore proof

1. Create a new Convex **development** deployment used only for this drill. Do
   not configure Stripe, WorkOS, Resend, downloads, cron jobs, or public
   routing. Deploy the same schema and backup functions.
2. Give the target two distinct random secrets of at least 32 characters and
   set only:

   ```text
   CONVEX_SERVER_SECRET=<target export secret>
   BACKUP_RESTORE_ENABLED=true
   BACKUP_RESTORE_TARGET_CLASS=isolated-test
   BACKUP_RESTORE_SECRET=<target restore secret>
   ```

3. Create a local, ignored, mode-0600 `.env.restore-proof`. Copy the production
   backup B2 settings and approved backup encryption/authentication keys into
   it. Add:

   ```text
   NEXT_PUBLIC_CONVEX_URL=<production Convex URL, isolation comparison only>
   CONVEX_SERVER_SECRET=<production server secret, isolation comparison only>
   BACKUP_RESTORE_PROOF_ENABLED=true
   BACKUP_RESTORE_TARGET_CONVEX_URL=<new development Convex URL>
   BACKUP_RESTORE_TARGET_SERVER_SECRET=<target export secret>
   BACKUP_RESTORE_SECRET=<target restore secret>
   BACKUP_RESTORE_TARGET_CLASS=isolated-test
   BACKUP_RESTORE_TARGET_CONFIRMATION=RESTORE_TO_EMPTY_ISOLATED_TEST_ONLY
   ```

4. Run from the repository dev shell:

   ```sh
   nix develop -c node --conditions=react-server --env-file=.env.restore-proof --import tsx scripts/backup-restore-proof.ts
   ```

5. Retain the single JSON evidence object. A pass has `verified: true`, exactly
   24 durable-table entries, the authenticated manifest checksum, a one-way
   target fingerprint, and per-table counts/checksums. It contains no records,
   URLs, secrets, email addresses, or provider diagnostics.
6. Exercise representative account, team, entitlement, expired-link,
   revocation, download and audit-log queries with every outbound integration
   still absent. The fail-closed operator command is:

   ```sh
   nix develop -c node --conditions=react-server \
     --env-file=.env.restore-proof --import tsx \
     scripts/isolated-restore-query-proof.ts
   ```

   It refuses a non-empty or non-isolated target, restores one synthetic
   release record through the fixed 24-table sequence, provisions only
   synthetic identity and purchase projections, proves account/team/licence
   queries, one-use and expired grants, refund revocation and audit output, and
   emits counts and booleans rather than records or provider identifiers.
7. Verify protected release archives separately against their release
   manifest; this database runner intentionally handles only the 24 durable
   Convex tables. It also proves `rateLimitWindows` is empty before restore but
   never imports or exports ephemeral windows.
8. Remove the local environment file and destroy the isolated deployment under
   the approved provider procedure after evidence is retained.

The runner authenticates and decrypts the latest B2 backup, proves the target
is empty, restores tables in one fixed sequence through
`backup:restoreTable`, re-exports all 24 durable tables, and reconciles the
exact original manifest. The emptiness check covers all 25 schema tables,
including the excluded ephemeral table. The runner never clears or overwrites
data. A partial failure leaves the target non-empty, so do not retry it:
investigate using provider-side request logs, create a new empty development
deployment, and repeat.

The runner refuses:

- missing opt-in or the exact confirmation phrase;
- targets not classified by both operator and deployment as `isolated-test`;
- the production Convex URL or either production/target shared secret;
- HTTP, non-Convex, or production-looking target hostnames;
- any non-empty or schema-mismatched target;
- incomplete, unauthenticated, tampered, oversized, or non-v1 backups; and
- count or checksum differences after the fresh export.

Launch evidence requires a successful drill in the selected provider
architecture, not only green automated tests or this runbook.
