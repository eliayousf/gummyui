# Backup and restore — pre-production runbook

Status: requirements drafted; no production database, object store, backup
schedule, retention policy, encryption ownership, or restore owner exists yet.

The local provider-neutral foundation implements two separate controls:

- each backup object can be encrypted with an injected, exactly 256-bit
  AES-256-GCM key; its backup ID, object name, schema version, record count,
  plaintext size, checksum, algorithm, and key ID are authenticated as
  associated data, and each encryption receives a fresh 96-bit nonce; and
- the complete manifest can be authenticated with a separately injected
  HMAC-SHA-256 key and versioned key ID.

Wrong keys, object swaps, metadata/ciphertext tampering, weak keys, and
plaintext-checksum mismatches fail closed in automated tests. Neither key is
stored in source, the envelope, or the backup destination. This proves the
portable cryptographic contract, not production key custody, rotation,
retention, scheduling, or restore operation.

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

## Restore test

1. Create an isolated non-production destination with least-privilege access.
2. Select a dated backup, verify the authenticated manifest, resolve approved
   non-retired keys by key ID, and decrypt each object into isolated storage.
3. Verify every authenticated object binding, plaintext checksum, manifest
   checksum, size, schema version, and record count before restore.
4. Restore structured records and protected objects without enabling outbound
   customer email, live billing, or public downloads.
5. Reconcile record counts and referential integrity.
6. Exercise representative account, team, entitlement, expired-link, access
   revocation, release-download, and audit-log queries.
7. Compare every restored release archive with its recorded checksum.
8. Destroy plaintext staging material and the isolated copy under the approved
   retention procedure, then record timing, findings, owner, and corrective
   actions.

Launch evidence requires a successful restore in the selected production
service architecture, not only this runbook or a provider backup setting.
