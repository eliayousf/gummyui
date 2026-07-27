# Installation

Gummy UI distributes editable source through a shadcn-compatible registry. The
first production family contains the base theme and canonical Button.

```sh
npx shadcn@latest add https://gummyui.dev/r/gummy-base.json https://gummyui.dev/r/gummy-button.json
```

The installer adds:

- `components/gummy-theme.css` — semantic canvas, surface, ink, focus, and fruit tokens;
- `components/gummy-button.css` — Button material, state, and reduced-motion styles; and
- `components/ui/gummy-button.tsx` — the readable React and TypeScript source.

Import both CSS files from the consuming application's global stylesheet or
root layout. The root `data-theme="dark"` attribute activates the included dark
environment.

## Package-manager commands

Each command below installs the same two public registry items. The clean
consumer release matrix executes every form against a local HTTP copy of the
generated shadcn-compatible payloads.

### npm

```sh
npx shadcn@latest add https://gummyui.dev/r/gummy-base.json https://gummyui.dev/r/gummy-button.json
```

### pnpm

```sh
pnpm dlx shadcn@latest add https://gummyui.dev/r/gummy-base.json https://gummyui.dev/r/gummy-button.json
```

### Yarn

```sh
yarn dlx shadcn@latest add https://gummyui.dev/r/gummy-base.json https://gummyui.dev/r/gummy-button.json
```

### Bun

```sh
bunx shadcn@latest add https://gummyui.dev/r/gummy-base.json https://gummyui.dev/r/gummy-button.json
```

## Local verification

Two committed consumer templates live in `fixtures/consumers/next` and
`fixtures/consumers/vite`. Neither imports from the Gummy UI website. The
verifier copies each template to a new temporary directory, installs its own
dependencies, serves the generated registry payloads over a local HTTP server,
runs the real shadcn command, and then runs the fixture's independent typecheck
and production build. Temporary projects and caches are removed after the run;
the repository's `node_modules` is never linked into a fixture.

The default release gate checks both frameworks with the npm command path:

```sh
nix develop path:. -c npm run registry:verify
```

Run the complete eight-case package-manager matrix before publication:

```sh
nix develop path:. -c npm run registry:verify:matrix
```

The matrix acquires every runtime through explicit
`nix shell nixpkgs#… -c …` commands. npm uses Nix Node 22, pnpm 11.17.0 and
Yarn 4.14.1 use isolated Corepack shims backed by Nix Node 22, and Bun uses the
Nix Bun package. No package manager is installed globally. The matrix requires
network access for clean dependency installation and has no paid-service cost.
`npm run registry:build` continues to generate the public registry-item
payloads under `public/r`.
