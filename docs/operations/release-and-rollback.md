# Release and rollback — pre-production runbook

Status: the Vercel release and rollback procedure has been exercised at the real
origin. Every planned Production environment value except the Stripe runtime
key is installed, including provisioned WorkOS, Resend, Better Stack and
Backblaze connections. Commerce flags remain fail closed. The current Convex
production schema, indexes and functions are deployed and its 25 tables are
confirmed empty. Vercel Pro is active with spend management set to $1,
notifications and Pause Projects enabled. Deployment
`dpl_3wAAVz7UQx6fVE3szd55zwgXgBW7` is Ready at public runtime-bearing commit
`c4d0d7847ef1701392bf430f96cc8fccf0eb000e` on Node 22. Vercel marks both
custom domains Valid, public DNS
returns the Namecheap records, and the complete origin probe passes at
`gummyui.dev`.

The controlled rollback switched production to recorded known-good deployment
`dpl_7HCcW6w9uQB8vhvTe4HcUzUtpy52`, verified the homepage, LLM index, health
contract and authentication initiation, and promoted the then-current audited
deployment `dpl_FPQy9sZw4t4fR156SnJfSUa2CZuf` (`977012c`) back.
Post-promotion homepage, agent guide and health probes passed. A fresh
backup, independent operator-key verification and isolated restore also pass.
The Stripe key, paid-release ownership and complete customer acceptance gate
remain pending.

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
