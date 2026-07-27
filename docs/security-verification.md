# Security verification

The current local gate is reproducible through the checked-in Nix environment.

```sh
nix develop path:. -c npm run typecheck
nix develop path:. -c npm run lint
nix develop path:. -c npm test
nix develop path:. -c npm audit --audit-level=moderate
nix shell nixpkgs#gitleaks -c gitleaks dir . --config .gitleaks.toml --redact
```

`npm test` regenerates the public registry, verifies source containment and
install targets, builds the production worker, scans public artifacts for
private paths, source maps, archives and server-only prerender material, then
tests the rendered application.

The Gitleaks configuration scans production output except for the two exact
Vinext server manifests that carry a per-build prerender secret. The separate
artifact-boundary check rejects that field anywhere under `public/` or
`dist/client/`. Production packaging must keep both manifests on the server
side and repeat the scan against the exact saved release.

This local gate does not replace production HTTPS/header inspection,
real-browser accessibility checks, rate-limit tests, webhook replay tests,
secret-manager review, provider least-privilege review, penetration testing, or
restore and rollback evidence.
