# Gummy UI

Gummy UI is an open-source React design system for interfaces that should feel
fresh, tactile, and unmistakably different from generic AI-generated software.

The visual language combines clean SaaS layouts with glossy gel surfaces,
inflated geometry, vivid colour, and restrained squash-and-release motion.

## Repository boundary

This is the **public** Gummy UI repository. It contains:

- the MIT-licensed component source;
- the public shadcn-compatible registry;
- documentation and installation guides;
- the Gummy UI website and theme tools;
- public examples; and
- public catalogue metadata and reviewed source-free raster previews.

Paid block source, templates, production design assets, and premium release
packages live in a separate private repository at `../gummyui-pro`. They must
never be committed to this repository, even temporarily.

See [the repository-boundary decision](docs/repository-boundary.md) for the
complete rule.

## Product scope and status

Gummy UI uses original design, code, copy, and assets. The current local
pre-production product contains:

- 57 implemented MIT component categories and 61 generated registry payloads;
- Base UI, RTL, themes, public docs, CLI registry, and AI/MCP support;
- boundary-safe metadata for 158 privately implemented paid blocks across 22
  categories;
- boundary-safe metadata for six privately implemented complete templates; and
- a private 300-definition code-aligned design-kit materializer.

No paid item is represented as verified, release-ready, purchasable, or
deployed. The public repository contains no paid editable source.

See [the catalogue plan](docs/catalogue-plan.md).

## Source of truth

The [master product and execution spec](MASTER_SPEC.md) records the approved
scope, decisions, delivery stages, quality rules, and next action for the full
project.

## Development

Enter the reproducible development environment with:

```sh
nix develop path:.
npm install
npm run dev
```

With direnv installed, run `direnv allow` once and `.envrc` will load the same
environment automatically.

## Install the production foundations after deployment

The registry publishes the Gummy base theme, canonical Button, form
foundations, layout/feedback primitives, navigation systems, overlays, and
composite inputs:

```sh
npx shadcn@latest add \
  https://gummyui.dev/r/gummy-base.json \
  https://gummyui.dev/r/gummy-button.json \
  https://gummyui.dev/r/gummy-separator.json \
  https://gummyui.dev/r/gummy-typography.json
```

See [installation](docs/installation.md), the [component quality
standard](docs/component-quality-standard.md), and [component anatomy and
contribution conventions](docs/component-anatomy.md).

The local catalogue covers all 57 launch component categories across nine
dependency groups. Every category has public React source, Component Lab
coverage, a documented accessibility contract, and source-derived API/anatomy
guidance. The registry is verified in clean Next.js and Vite consumers across
npm, pnpm, Yarn, and Bun. The `gummyui.dev` commands above are public on the
deployed production origin.

Run the complete local verification gate with:

```sh
nix develop path:. -c npm run typecheck
nix develop path:. -c npm run lint
nix develop path:. -c npm test
nix develop path:. -c npm run registry:verify:matrix
nix develop path:. -c npm run test:browser:production
```

Contributions must follow [CONTRIBUTING.md](CONTRIBUTING.md), the
[repository boundary](docs/repository-boundary.md), and the pre-launch
[security policy](SECURITY.md).
