# Contributing to Gummy UI

Gummy UI accepts work on its MIT-licensed public component system, registry,
documentation, examples, and public website. Paid blocks, templates, design
source, releases, credentials, and customer information belong in the separate
private repository and must never be copied here.

## Development environment

Use the checked-in Nix development shell:

```sh
nix develop
npm ci
npm run dev
```

With direnv installed, `direnv allow` loads the same shell through `.envrc`.
Do not install project tools globally.

## Before proposing a change

1. Read `MASTER_SPEC.md`, `docs/component-anatomy.md`, and
   `docs/component-quality-standard.md`.
2. Preserve native semantics or the approved Base UI behavior.
3. Use shared tokens and logical CSS properties; verify light, dark, RTL,
   reduced-motion, responsive, zoom, pointer, and keyboard paths.
4. Update canonical source, tests, Lab coverage, catalogue metadata,
   documentation, registry output, and changelog together when behavior changes.
5. Keep claims, compatibility statements, counts, and product status
   manifest-derived and evidence-backed.

## Required checks

Run the complete local gate before requesting review:

```sh
nix develop path:. -c npm run typecheck
nix develop path:. -c npm run lint
nix develop path:. -c npm test
```

`npm test` covers unit and accessibility tests, registry fixture verification,
the production build, and rendered-output checks. Include focused manual
keyboard and responsive evidence for interaction or layout changes.

## Security and private material

Do not include credentials, customer data, private Pro source, unreleased
design files, vulnerability details, or third-party confidential material in a
public change. Follow `SECURITY.md` for disclosure status and
`docs/repository-boundary.md` for the source boundary.
