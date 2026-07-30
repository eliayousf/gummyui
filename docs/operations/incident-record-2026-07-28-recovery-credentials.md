# Production recovery-credential containment — 28 July 2026

**Classification:** contained operator credential exposure and recovery-copy
drift; no customer data, payment data, paid source or provider-administration
credential involved.

## Cron credential

A production cron credential became visible in a private operator-tool trace
while confirming Vercel configuration. It was rotated immediately, the
application was redeployed, and the replacement was kept only in the Vercel
secret store and the mode-0600 operator recovery bundle. A controlled
production probe then proved:

- the superseded value receives the same private 404 response as an
  unauthorized caller; and
- the replacement value reaches the backup-verification route and returns a
  verified 200 response.

The credential is not retained in either repository, this record, screenshots
or command output.

## Backup recovery copy

The first isolated restore attempt failed closed before changing the target
because the operator recovery copy did not authenticate the newest production
manifest. A second attempt, after aligning the authentication identifier,
failed closed at object decryption. These failures proved that neither a
mismatched manifest key nor a mismatched encryption key can restore data.

Containment and recovery:

1. both 256-bit backup cryptographic keys and their versioned identifiers were
   rotated again;
2. the Vercel Production values were updated and redeployed;
3. the mode-0600 recovery bundle outside both repositories was updated without
   printing the values;
4. a new production backup exported, encrypted, authenticated, uploaded, read
   back and verified all 24 durable tables;
5. the operator-held copy independently authenticated and decrypted that same
   latest backup; and
6. the isolated Convex target restored and reconciled all 24 tables with zero
   production records.

On 30 July the founder reauthenticated to Backblaze. The pre-rotation backup
key was reconciled against the current runtime and recovery configurations and
revoked without changing the surviving release-read or dated current-backup
keys. The current backup key then reauthenticated through an isolated CLI
profile, read its scoped bucket and enumerated all 200 current objects. No key
ID, object name or reusable credential was retained in evidence. Founder
password-manager custody and removal of the local recovery copy remain
required.
