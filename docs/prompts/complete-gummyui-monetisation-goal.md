# One persistent goal prompt — launch and operate Gummy UI

Copy the prompt below into a new Codex goal.

---

Take Gummy UI from its current verified local state to a fully operational
commercial production launch. Continue autonomously until a real customer can
complete the whole revenue and support journey safely, and until the founder
can operate and recover the service.

Treat `/Users/eliayousf/dev/gummyui/MASTER_SPEC.md` as the authoritative product
and execution contract. Read it in full before making changes. Then read:

- `/Users/eliayousf/dev/gummyui/docs/research/retroui-benchmark-2026-07-26.md`
- `/Users/eliayousf/dev/gummyui/docs/catalogue-plan.md`
- `/Users/eliayousf/dev/gummyui/docs/component-quality-standard.md`
- `/Users/eliayousf/dev/gummyui/docs/repository-boundary.md`
- `/Users/eliayousf/dev/gummyui/docs/design-direction.md`
- `../gummyui-pro/docs/operations/launch-requirement-audit-2026-07-27.md`
- `../gummyui-pro/docs/operations/founder-approval-packet-2026-07-27.md`
- `../gummyui-pro/docs/operations/provider-provisioning-register-2026-07-27.md`

Do not stop at a plan or a partial implementation. Work persistently through all
remaining stages, keep the master spec and manifests accurate as the product
changes, validate every milestone, and finish every safe in-scope task that does
not require a remaining founder-only action.

## The one North Star

The only completion metric is the **production-verified revenue loop**. It
starts at 0 of 8 and increases only when the matching journey has evidence on
the real production service:

1. a customer discovers and understands the real offer;
2. the customer creates or recovers an account;
3. the customer completes an eligible worldwide checkout;
4. the correct purchase, licence and entitlement are created;
5. only the paid releases that customer owns can be downloaded;
6. transactional email arrives and the support route works;
7. cancellation or refund produces the correct access result; and
8. monitoring, backup/restore, incident response and rollback work in
   production.

Local code, passing tests, catalogue counts, Figma materialisation, sandbox
payments and audit scores are supporting evidence. They never count as a
production step by themselves. Keep unfinished customer-facing paths fail
closed and never replace this metric with a subjective percentage.

## Required product envelope

The finished system must include:

1. The full free catalogue of 57 original component categories, with canonical
   React/TypeScript source, native accessibility foundations and the required
   Base UI/Radix variants, Tailwind styling, light/dark themes, RTL, reduced
   motion, responsive behaviour, complete states, examples, anatomy/API docs,
   registry payloads and clean-install verification.
2. The full paid catalogue of 158 original blocks across the exact 22
   categories and counts in `docs/catalogue-plan.md`.
3. Six complete original templates: developer tools, multipage SaaS, creative
   agency, portfolio, AI product and SaaS/commerce administration.
4. A complete, versioned design kit with at least 300 useful Figma
   component/variant definitions across the free and paid system, auto layout,
   component properties, light/dark variables, code-token/Tailwind annotations,
   usage guidance and release notes.
5. A public product and documentation site with the complete information
   architecture, developer discovery, content, community, localisation, legal,
   trust and account surfaces required by the master spec.
6. A shareable multi-axis Gummy theme builder with live real-component preview,
   accessible light/dark output, reset/copy/share actions and one-command
   installation.
7. An original browser-only Gummy frame/screenshot studio. All imported images
   must remain on the device; include material frame, background, corner,
   shadow, border, padding, orientation and export controls.
8. A shadcn-compatible public source registry, generated registry indexes,
   direct source view/copy, npm/pnpm/Yarn/Bun examples, Next.js and Vite guides,
   markdown docs, `llms.txt`, machine-readable API catalogue, MCP onboarding,
   RSS and health endpoint.
9. A complete commercial platform: approved plan model, checkout, billing
   portal, authentication/recovery, accounts, licences, invoices, entitlements,
   organisations/workspaces, roles/invitations, protected versioned releases,
   expiring downloads, transactional email, refunds/cancellation, tax/invoice
   handling, data export/deletion, analytics, audit logs, monitoring, backups
   and restore procedures.
10. At least 18 substantial original launch articles, changelog with RSS,
    community showcase and submission flow, contribution/security/support
    routes and honest evidence. Never fabricate customers, testimonials,
    community numbers, partners, savings, prices, discounts, compatibility or
    accessibility claims.
11. Reviewed localisation across the 20 benchmark locales, with translated
    route metadata and content, locale-aware search, hreflang and segmented
    sitemaps. Arabic, Persian and Hebrew must have correct RTL layout and
    interaction. Do not represent unreviewed machine translation as final.
12. Production-grade SEO, accessibility, performance, security, privacy,
    observability, release and support operations that exceed RetroUI's audited
    quality rather than reproducing its defects.

## Current starting state — 28 July 2026

Preserve the approved Gel Pop design direction and all completed work. Read the
live manifests and evidence before acting; do not rebuild verified work from
scratch.

- The public catalogue has 57 canonical components, 61 registry payloads and
  474 passing Vitest tests. Clean Next.js/Vite installs and the npm, pnpm, Yarn
  and Bun package-manager matrix pass.
- The private catalogue has 158 blocks, six templates, 474 block tests, 142
  template tests, 948 Chrome captures and 132 contact sheets. Clean paid
  download packaging passes but real releases remain fail closed pending human
  review.
- The current Figma file contains the successful v0.4.0 materialisation. The
  v0.5.0 local materialiser expects 138 editable component sets and 2,588
  editable variants, including 72 editable pattern sets and 1,728 pattern
  variants. Its live Figma Desktop run, founder review, export and archive
  restore remain pending.
- A Convex commerce foundation with 24 durable commerce tables and one
  intentionally ephemeral distributed-rate-limit table, Stripe
  checkout/webhook lifecycle, durable email, privacy, refund and chargeback
  handling pass locally. The current 25-table schema/functions are deployed to
  production. The latest encrypted production backup independently verified
  all 24 durable tables and 26 records, and a new empty isolated target restored
  and protected-re-exported the same counts with `rateLimitWindows` empty.
  After the WorkOS membership retry, a current backup independently verified
  all 24 durable tables and 28 records; the preceding 26-record backup remains
  the restore proof. Production was export-only throughout both operations.
- Stripe Managed Payments is live-account ready with three products, nine
  prices and `support@kreydlabs.com` configured. The application runtime still
  lacks its restricted production key and verified production webhook, and no
  sandbox or live revenue-loop journey has been completed; checkout and webhook
  flags remain fail closed.
- The Vercel-targeted production build passes across 322 generated and dynamic
  routes. Vercel Pro is active, Namecheap DNS has converged, HTTPS and custom
  domains are valid, and `gummyui.dev` serves the pushed public commit with
  commerce still fail closed.
- Production hosted sign-up/callback, profile/workspace projection, team
  switching, data export/download, deletion request/cancellation, session
  refresh, authenticated unpaid download denial and two real privacy emails
  pass. Recovery, a second-identity invitation, final deletion and commerce
  remain open.
- English revision `en-e5d133b48e13` contains 2,942 records. All 19 private AI
  drafts pass structural and automated quality checks with zero high-severity
  flags and have checksum-bound founder-review screens; every locale remains
  fail closed pending rendered QA and founder review.
- The cross-repository local readiness check passes 18 of 18 evidence groups.
  The North Star remains 0 of 8 because no production journey has been proved.

## Execution rules

- Preserve the public `gummyui` and private `gummyui-pro` repository boundary.
  Paid editable source and design files must never enter the public repository,
  commit history, public build artefacts or preview payloads.
- Use only original Gummy UI design, code, examples, copy, template structures,
  product names and assets. Do not reverse-engineer or copy RetroUI paid source
  or visual compositions.
- Follow the current headless-engine contract in `MASTER_SPEC.md`: use native
  HTML where it provides the correct semantics and preserve the implemented
  Base UI/Radix variants required by the canonical catalogue.
- Use the repository's Nix devShell and npm workflow. Keep `flake.nix` and
  `.envrc` working; source temporary tools with `nix shell` rather than global
  installation.
- Preserve the existing architecture and lockfile unless a documented product
  requirement makes a change necessary. Prefer the fewest services and
  dependencies that can securely satisfy the commercial system.
- Make catalogue manifests the single source of truth. Generate indexes, route
  inventories, counts, registry items, search data, sitemaps and public claims
  from manifests, and fail CI on drift.
- For every component or block, complete source, tests, docs, preview, manifest,
  registry/release metadata, changelog and accessibility evidence together.
- Use realistic original product content. Provide loading, empty, error,
  success, disabled, read-only and destructive behaviour where the product
  needs it.
- Maintain accessible names, semantics, keyboard paths, focus management,
  44-pixel touch targets, zoom/reflow, contrast, RTL and reduced-motion
  behaviour. Automated checks supplement rather than replace manual keyboard
  and screen-reader smoke tests.
- Keep stable reading/editing planes calm. Use Gel Pop material selectively for
  hierarchy and state. Preserve connected material geometry and avoid detached
  decoration, generic pill stacks and effects that reduce data density or
  legibility.
- Optimise images, fonts, CSS, JavaScript, DOM size and route loading as the
  catalogue grows. Do not ship research reference images as oversized product
  content.
- Implement unique route metadata, canonicals, structured data, Open Graph/X,
  meaningful internal links, robots, sitemaps, hreflang, authorship and dates.
- Implement production security headers, secure cookies, CSRF protection where
  applicable, signature-verified idempotent webhooks, rate limits, least
  privilege, secrets scanning and dependency maintenance.
- Ensure privacy, terms, licence, refund and support text describes the real
  implementation and approved business. The founder declined professional
  legal/accounting review and will approve the pages personally; never claim
  that they were professionally reviewed.
- Record material product and architecture decisions in the master spec or its
  linked documents as they are made.

## Commercial product requirements

Implement the approved worldwide commercial system for Free, Individual, Team
and Organisation offers across:

- seats and workspace membership;
- personal, commercial and client-project rights;
- included blocks, templates, dashboard and design kit;
- support level;
- update period and access after cancellation;
- monthly, annual and/or lifetime billing if approved; and
- tax, invoice, refund and renewal behaviour.

The approved prices are Individual at $49 monthly, $389 yearly and $899
lifetime; Team at $99 monthly, $789 yearly and $1,899 lifetime for up to five
named users; and Organisation at $199 monthly, $1,589 yearly and $3,899
lifetime for unlimited named users in one purchasing organisation. These
figures match RetroUI's public price grid, but Gummy UI's product, copy, code,
design and legal terms must remain original.

Monthly and yearly subscriptions require active payment for future downloads,
updates and paid support. Lifetime includes those benefits for Gummy UI Pro's
commercial lifetime. Paid source cannot be resold, publicly shared or used to
create a competing UI kit. The approved 14-day goodwill refund applies only
before paid files are accessed, in addition to rights required by law and
corrections for duplicate, fraudulent or provider-error charges. The support
reply target is two UK business days and is not a service-level guarantee.

Use hosted checkout and a self-service billing portal. Payment events must be
signature verified and idempotent. Entitlements must be enforced on the server.
Private release downloads must be short-lived, auditable and fail closed for
guessed IDs, stale links, revoked access, the wrong workspace or client-side
bypass attempts.

Test at least:

- new purchase and account linking;
- Google, GitHub and email-link sign-in or the approved equivalent;
- duplicate/out-of-order webhook delivery;
- failed and recovered payment;
- renewal and plan/seat changes;
- cancellation and post-cancellation rights;
- partial/full refund and access revocation;
- expired/forwarded download links;
- team invitation, role change and removal;
- account recovery, export and deletion; and
- transactional email retries and support recovery.

## Public site and growth requirements

Build every route and machine-readable surface listed under “Public information
architecture” in the master spec. The experience must make these journeys
obvious and fast:

1. A visitor understands Gummy UI and interacts with a real component.
2. A developer searches for a component, inspects states/source/API, copies or
   installs it, and succeeds in a clean Next.js or Vite project.
3. An AI editor discovers the registry and adds a component through MCP.
4. A designer configures, shares and installs a theme.
5. A buyer previews blocks/templates at desktop and mobile sizes, compares
   plans, purchases in test mode, signs in and downloads the correct release.
6. A team owner invites a member who receives only the permitted access.
7. A customer finds licence, refund, billing, privacy and support answers
   without contacting support.
8. A crawler receives correct metadata, canonical, language, sitemap and
   structured-data signals without indexing private/account/preview/API routes.

Create original, useful content around Gummy UI, tactile interface design,
accessible motion, Base UI, Tailwind, shadcn registries, AI-assisted product
design and real SaaS patterns. Use real authors, dates and update records.
Build the showcase/submission system, but publish only consented real projects.

## Validation and finish definition

Run and fix, as applicable:

- typecheck, lint and formatting checks;
- unit, behaviour, accessibility and contrast tests;
- registry/schema validation and clean Next.js/Vite install fixtures;
- rendered-output and production builds;
- visual regression across light/dark, mobile/desktop and LTR/RTL;
- manual keyboard and screen-reader smoke tests;
- end-to-end free-install, theme, account, commerce, entitlement, email and
  recovery journeys;
- secret, dependency and licence scans;
- backup restore and release rollback drills; and
- a fresh full-coverage production website audit.

The goal is complete only when:

- every required catalogue, route, tool, document, workflow and operational
  owner in `MASTER_SPEC.md` exists;
- all applicable automated checks pass;
- no critical or serious accessibility defects remain;
- no paid asset is exposed publicly;
- the full website audit exceeds 95, all errors are fixed, and every remaining
  warning has evidence, rationale and an owner;
- clean-session free install, sandbox purchase/download and the authorised
  cheapest real purchase/full-refund journey pass;
- manifest-derived public claims match the real catalogues;
- monitoring, backups, restore, rollback, support and incident processes are
  proven in production; and
- all eight North Star steps have direct evidence.

Do not declare success because a stage builds, a route renders or a checklist
was written. Return a concise evidence report mapping every master-spec exit
criterion to its implementation, test result and any founder-gated final action.

## Captured authority and remaining founder actions

The founder has approved the commercial terms above, Stripe Managed Payments
where eligible, Vercel production hosting after all tests and reviews pass,
production resources, the real cheapest-plan purchase/full refund, the public
`eliayousf/gummyui` repository, the private `eliayousf/gummyui-pro` repository,
and the `gummyui.dev` DNS change. The fixed-service hard limit is $30/month,
excluding Stripe transaction fees and the existing domain renewal. Never
enable a purchase or annual commitment above that limit without fresh
approval.

Use WorkOS AuthKit, Convex, Resend, Better Stack, Backblaze B2 and
founder-owned Bitwarden recovery storage at their free tiers where available.
Vercel Pro may use $20/month of the approved limit. The founder owns
`gummyui.dev` at Namecheap and controls `support@kreydlabs.com`.

The founder alone must enter bank details, identity documents, recovery
material and accept provider terms in provider dashboards. Never request or
store those secrets in chat or Git. The founder will also complete subjective
browser/device/accessibility QA, approve AI translations, and approve the
finished Figma design kit. Ask only for the smallest concrete human action
when it becomes the next real blocker, and continue every independent task
while waiting.

Do not materially change the approved catalogue, prices, licence, spending
limit, ownership or publication boundary without fresh founder approval.

---
