# Initial Technical Decisions

## Component engines: Base UI and Radix UI

Base UI remains the canonical implementation used by the Gummy UI website.
Gummy UI also ships separate Radix UI registry counterparts for all 22
interactive families that have an official Radix primitive. Both editions use
the same public class names, material styles, behavior contract, and
accessibility gates.

Combobox remains explicitly Base-only because Radix does not publish a
Combobox primitive. Native components do not gain unnecessary engine wrappers.
The two editions install to the same component target and are alternatives, not
packages to install over one another.

## Distribution: shadcn registry

The free system will be distributed through a public shadcn registry. Component
source is copied into the developer's application, where it can be read,
changed, and owned.

The registry exposes the shared theme and style payloads, 57 canonical
component categories, and 22 separately named Radix counterparts. Each payload
pins its direct package dependency and is verified in clean Next.js and Vite
consumers.

## Application framework

- React and TypeScript for components
- Tailwind CSS for the styling layer
- Next.js-compatible documentation and marketing application
- native Next.js production output for the approved Vercel direction

## Commercial database

The approved commercial backend is Convex in its EU region, beginning on the
free launch allowance. Its schema has 25 tables: 24 durable commerce tables
keep customer, purchase, seat, entitlement, consent, provider-event and
operational projections separate from private paid release objects, while
`rateLimitWindows` holds only ephemeral HMAC-derived abuse-control state. The
encrypted database backup manifest covers exactly the 24 durable tables; the
rate-limit table is excluded by design and must be empty on an isolated restore
target. High-level commerce mutations are atomic, idempotent and
server-authenticated. WorkOS AuthKit uses Convex's official JWT integration.
Protected Pro archives use private object storage with fresh server-side
entitlement checks rather than permanent bearer URLs.

## Secrets

All credentials are runtime environment variables. They are never committed to
Git, written into registry files, or bundled into browser code.
