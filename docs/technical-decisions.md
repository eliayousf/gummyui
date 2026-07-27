# Initial Technical Decisions

## Component engine: Base UI

Gummy UI will initially support one component engine: Base UI.

In July 2026, shadcn made Base UI the default for new projects while continuing
to support Radix. Starting on the current default gives Gummy UI the most direct
registry path and avoids duplicating every interactive component at launch.

We will not add a Radix edition until customer demand and revenue justify the
extra maintenance and testing.

## Distribution: shadcn registry

The free system will be distributed through a public shadcn registry. Component
source is copied into the developer's application, where it can be read,
changed, and owned.

The registry will eventually expose a `registry:base` item so colours, fonts,
configuration, dependencies, and component foundations can be installed as one
Gummy design-system preset.

## Application framework

- React and TypeScript for components
- Tailwind CSS for the styling layer
- Next.js-compatible documentation and marketing application
- Cloudflare-compatible deployment output

## Convex

Convex is technically suitable for account and entitlement records, but Gummy
UI does not need a database for its open-source launch. We will defer the final
commercial backend until the Pro account flow is built.

If Convex is selected then:

- it will store customer, purchase, seat, and entitlement metadata;
- an established authentication system will be used instead of depending on
  Convex Auth while its Next.js server support remains beta/experimental; and
- protected Pro archives will use private object storage with expiring access,
  rather than permanent bearer-style file URLs.

The current hosting environment already provides a small database and private
object storage option, so the final choice will prioritise fewer services and
less operational complexity.

## Secrets

All credentials are runtime environment variables. They are never committed to
Git, written into registry files, or bundled into browser code.
