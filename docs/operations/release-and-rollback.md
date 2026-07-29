# Release and rollback — pre-production runbook

Status: the Vercel release and rollback procedure has been exercised at the real
origin. Every planned Production environment value is installed, including
provisioned WorkOS, Resend, Better Stack, Backblaze and a Vercel-managed Stripe
connection. The Stripe resource is restricted to Production and its initial
credential was rotated, but Stripe identifies the resulting secret as a
full-scope managed Standard key rather than the prepared least-privilege
restricted key. Commerce flags remain fail closed. The current Convex
production schema, indexes and functions are deployed. Vercel Pro is active
with spend management set to $1, notifications and Pause Projects enabled.
Ready deployment `dpl_Gnv4Akeu31WcguSzUXBTCxHYivxb` was built from exact
public head `e6861f544e3c86ee71b2bcdd21c57beee1d2651b` on Node 22 with the
protected Stripe credential, rotated Convex server secret and replacement
WorkOS environment. GitHub Quality run `30453896180` passes that exact head.
Vercel marks both custom domains Valid, public DNS
returns the Namecheap records, and the complete origin probe passes at
`gummyui.dev`.

The controlled rollback switched production to recorded known-good deployment
`dpl_7HCcW6w9uQB8vhvTe4HcUzUtpy52`, verified the homepage, LLM index, health
contract and authentication initiation, and promoted the then-current audited
deployment `dpl_FPQy9sZw4t4fR156SnJfSUa2CZuf` (`977012c`) back.
Post-promotion homepage, agent guide and health probes passed. A later fresh
non-empty backup independently verified and restored all 24 durable tables and
26 production records into a new empty isolated target; the protected
post-restore export matched and `rateLimitWindows` remained empty.
After the WorkOS membership retry, current backup
`20260729T125815872Z-36a3348ed93148cfad2fa6e193d8023a` independently verified
the updated 24-table/28-record production state. The preceding 26-record
backup remains the restore proof and production was export-only throughout.
Stripe credential runtime exercise and least-privilege replacement,
paid-release ownership and the complete customer acceptance gate remain
pending.

The paid-release foundation now has two independently checked halves. The
private repository deterministically creates one archive per allowlisted
product outside both repositories and can conditionally upload it to an
Object-Locked B2 bucket, then verify retention, metadata, length and the full
read-back checksum. The public runtime accepts only the matching versioned
object-key contract through server-secret-protected, idempotent Convex
publication and withdrawal operations. Withdrawal preserves purchase and
product-entitlement history while revoking unused grants. No real archive was
built or uploaded and no production release record was published, so all paid
release and customer evidence gates remain open.

## Public release gate

Run from the checked-in Nix shell:

```sh
nix develop path:. -c npm ci
nix develop path:. -c npm run typecheck
nix develop path:. -c npm run lint
nix develop path:. -c npm test
nix develop path:. -c npm audit --audit-level=moderate
nix shell nixpkgs#gitleaks -c gitleaks dir . --config .gitleaks.toml --redact
```

The complete gate also requires the clean Next.js/Vite consumer matrix,
browser accessibility and responsive evidence, a deployment audit, dependency
and licence review, public/private boundary verification, and confirmation that
public claims match current manifests.

## Release record

Every production release must identify:

- immutable public and private repository commits;
- public and Pro catalogue versions and manifest checksums;
- database migration and compatibility status;
- public asset and paid-source boundary scan results;
- approved configuration and service changes;
- the deployer, verifier, and timestamp; and
- the previous known-good release.

## Rollback

1. Stop further rollout and preserve the failed deployment and its logs.
2. Select the recorded previous known-good version; never rebuild an old
   release from a changed working tree.
3. Verify its manifest, checksum, database compatibility, public/private
   boundary, and required runtime configuration.
4. Deploy that saved version through the approved host.
5. Re-run public health, catalogue, registry, account, entitlement, download,
   email, and payment smoke tests applicable to the incident.
6. Record the rollback result and keep the failed version unavailable until its
   cause is understood.

Production rollback cannot be marked operational until one controlled restore
of a saved version has succeeded in the actual production architecture.
