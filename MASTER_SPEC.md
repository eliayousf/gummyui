# Gummy UI Master Product and Execution Spec

## Purpose

This document is the authoritative source of truth for building Gummy UI. When
another document, prompt, or implementation conflicts with it, this document
wins unless the founder explicitly changes a decision.

Gummy UI is a public React component system and a paid library of production
blocks, templates, and design assets. It applies a fresh, tactile visual style
to genuine SaaS products without sacrificing accessibility or usability.

## North Star

The one governing outcome is:

> A new customer in an eligible country can discover Gummy UI, choose the
> correct plan, sign in, pay, receive the correct licence and protected
> download, get support, and receive a valid refund; the founder can monitor,
> restore, and roll back the service without exposing paid source or exceeding
> the approved fixed-cost limit.

The North Star metric is **production-verified revenue loop: 0 of 8 steps
passing**. It is deliberately binary at each step and is never replaced with a
subjective completion percentage:

1. discover and understand the real offer;
2. create or recover an account;
3. complete an eligible worldwide checkout;
4. receive the correct purchase, licence and entitlement;
5. download only the paid releases the customer owns;
6. receive transactional email and obtain support;
7. complete cancellation/refund handling with the correct access result; and
8. prove monitoring, backup/restore, incident response and rollback in
   production.

Local code, sandbox tests, Figma materialisation, catalogue counts and audit
scores are supporting evidence. None can mark a North Star step passed without
the matching production journey. Codex continues this single goal
autonomously, requests founder input only for material cost/legal/identity or
subjective review decisions, and must keep every unfinished step fail closed.
The reusable continuation prompt is
[`docs/prompts/complete-gummyui-monetisation-goal.md`](docs/prompts/complete-gummyui-monetisation-goal.md).

## Founder role and operating model

The founder is non-technical and acts as product and creative director. Codex
is expected to perform the research, product planning, design-system work,
implementation, testing, documentation, and routine technical decisions.

Do not ask the founder to choose between technical options unless the choice
materially affects the product, cost, legal position, or customer experience.
Explain unavoidable choices in plain language and recommend a default.

Founder approval is required for:

- the first visual direction checkpoint;
- paid pricing and licence terms;
- purchases, identity checks, contracts, and account ownership;
- making repositories public or deploying to production; and
- major changes to the agreed product scope.

## Founder decisions — 27 July 2026

The founder supplied the seller, licensing and operating facts recorded in the
private consolidated approval packet. For the public master specification, the
following changes are authoritative:

- KREYD LABS LTD, company 17152066, trading as GUMMY UI, is the seller,
  licensor, IP owner and privacy controller.
- The intended paid market is worldwide, with each country remaining disabled
  until the approved payment/tax model supports it.
- The paid model tracks RetroUI's current public price grid: Free at $0;
  Individual at $49 monthly, $389 yearly or $899 lifetime; Team at $99 monthly,
  $789 yearly or $1,899 lifetime; and Organisation at $199 monthly, $1,589
  yearly or $3,899 lifetime. Gummy UI retains its own seller, copy, design,
  code and legal terms.
- The founder chose Stripe Managed Payments for worldwide sales when eligible,
  Vercel, the sole role address `support@kreydlabs.com`,
  AI-generated/founder-reviewed translation, personal
  manual QA and a free Figma workflow.
- AI translation may be used for the 19 pending locales. It is not final until
  automated integrity/layout/accessibility/RTL gates pass and the founder
  manually approves it. It must never be described as professional human
  translation.
- KREYD LABS LTD is not VAT registered. The founder approved a $30/month hard
  fixed-service limit excluding Stripe transaction fees and the existing
  domain renewal. The private repository remains founder/approved-developer
  only; customers receive entitlement-protected downloads.

## Product promise

**Gummy UI makes vibe-coded products look deliberately designed.**

The target customer is a React developer, indie SaaS founder, or small agency
that wants something more recognisable than generic component-library defaults
but still needs credible production software.

The brand must feel:

- playful and distinctive;
- fresh, clean, and high quality;
- tactile without becoming ornamental;
- colourful without becoming childish; and
- suitable for marketing sites, forms, dashboards, and dense SaaS interfaces.

## Business model

Gummy UI follows RetroUI's product architecture and catalogue breadth with
original Gummy UI design, code, copy, examples, and assets.

The free product creates trust, adoption, search visibility, and developer
distribution. The paid product sells speed and assembled outcomes.

### Free product

- 57 documented component categories
- MIT licence, including commercial use
- React and TypeScript source
- native elements plus both Base UI and Radix UI versions where a headless
  interaction engine is required
- Tailwind CSS styling
- shadcn CLI-compatible public registry
- light and dark themes
- right-to-left layout support
- theme builder
- documentation and examples
- AI-readable documentation and MCP discovery

The exact category checklist is maintained in
[`docs/catalogue-plan.md`](docs/catalogue-plan.md).

### Gummy UI Pro

- 158 original blocks across 22 categories
- six original complete templates
- complete design kit
- public previews with gated source downloads
- a commercial licence and defined update period

The paid catalogue must never contain copied RetroUI source, compositions,
template structures, visual designs, copy, product names, or design files.

## RetroUI benchmark and parity definition

The benchmark was re-verified against RetroUI's public product on 26 July 2026.
The research record, source links, observed product surfaces, and Gummy UI gap
analysis are maintained in
[`docs/research/retroui-benchmark-2026-07-26.md`](docs/research/retroui-benchmark-2026-07-26.md).

“RetroUI parity” means an equivalent or better product envelope, developer
journey, catalogue breadth, trust layer, and commercial operating capability.
It never means visual imitation, copied code, copied information architecture,
copied product names, or adopting a RetroUI decision that conflicts with Gummy
UI's users or quality standard.

Counts are only one part of parity. Gummy UI is not parity-complete until all
of the following product surfaces exist and work together:

| Surface                   | Gummy UI launch requirement                                                                                                                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public foundation         | 57 original, documented, installable component categories, with native elements plus both Base UI and Radix UI versions where a headless engine is needed                                                            |
| Source distribution       | Editable React and TypeScript source through a valid shadcn registry, direct source viewing, copy actions, registry indexes, and clean-project install verification                                                  |
| Developer documentation   | Searchable docs with introduction, installation, Next.js, Vite, theming, RTL, accessibility, MCP, changelog, per-component examples, anatomy, API, states, dependencies, and troubleshooting                         |
| AI discovery              | `llms.txt`, markdown versions of docs, copy-page/open-in-AI actions, a machine-readable API catalogue, registry indexes, MCP setup for major editors, and a public health endpoint                                   |
| Component discovery       | Searchable component index and detail pages with working live examples, source, CLI commands, light/dark and RTL inspection, responsive preview, and accessible keyboard interaction                                 |
| Theme system              | A shareable theme builder covering colour, type, shape, borders, shadows, patterns, charts, light/dark tokens, live component preview, reset, copy, and one-command installation                                     |
| Paid blocks               | 158 original blocks across the 22 categories and counts in `docs/catalogue-plan.md`, with public responsive previews and protected source                                                                            |
| Paid templates            | Six complete original products: developer tools, multipage SaaS, creative agency, portfolio, AI product, and SaaS/commerce administration                                                                            |
| Design kit                | A versioned Figma-ready system with at least equivalent breadth to the code catalogue, variants and states, auto layout, light/dark variables, component properties, and Tailwind/token annotations                  |
| Utility tool              | An original browser-only Gummy screenshot/frame studio with local processing, configurable material frame, canvas, padding and export; uploaded images must not leave the device                                     |
| Marketing site            | A product-specific home page, clear navigation, interactive real-component proof, benefits, catalogue previews, authentic evidence, calls to action, and complete footer navigation                                  |
| Content and community     | At least 18 substantial original launch articles, changelog with RSS, community showcase and submission flow, support/community destination, and contribution governance                                             |
| Localisation              | Internationalisation architecture, locale selector, translated metadata and content, hreflang and locale sitemaps, plus correct RTL behaviour for Arabic, Persian and Hebrew                                         |
| Commerce                  | Honest Free/Solo/Team/Organisation comparison, approved billing periods and prices, secure checkout, tax/invoice handling, cancellation and refund paths, and no misleading scarcity or savings claims               |
| Accounts and entitlements | Google, GitHub and email-link sign-in or an approved equivalent; account, purchases, licences, downloads, billing and team/workspace access; expiring signed downloads and auditable entitlement changes             |
| Trust and legal           | Public privacy, terms, commercial licence, refund, support and contact information; consent and data-rights flows; no fabricated testimonials, customers, usage counts, discounts, or performance claims             |
| Growth and discovery      | Crawlable semantic pages, unique metadata, canonicals, structured data, Open Graph/X images, robots and segmented sitemaps, useful internal links, authorship, dates, analytics and consent-aware funnel measurement |
| Partnerships              | Optional, clearly labelled direct sponsorship/partner inventory with evidence, disclosure and no third-party advertising network or cross-site tracking; this is not a launch blocker                                |
| Operations                | Error monitoring, uptime/health monitoring, transactional email, backups, restore testing, support ownership, incident handling, dependency/security maintenance, and documented release/rollback procedures         |

RetroUI's public site contains inconsistencies and quality defects, so parity is
not permission to repeat them. Its current component catalogue publicly offers
both Radix UI and Base UI versions. Gummy UI therefore treats dual-engine
delivery as a parity requirement while still exceeding the benchmark in
correctness, accessibility, performance, security, and honesty.

## Public information architecture

The production application must provide, at minimum:

- home;
- component index and one canonical detail page per component;
- block index, category pages, individual preview pages, and protected
  source-access actions;
- template index, detail pages, and isolated source-free image previews;
- theme builder and installable theme result;
- Figma/design-kit product page;
- Gummy screenshot/frame studio;
- pricing and plan comparison;
- documentation home, introduction, installation, framework guides, MCP guide,
  changelog, and troubleshooting;
- blog index and original article pages;
- community showcase and submission instructions;
- sign-in, account, downloads, licences, billing, team/workspace, invitation,
  and account-data controls;
- privacy, terms, commercial licence, refund, support, contact, accessibility,
  and security disclosure pages; and
- machine-readable `robots.txt`, sitemaps, `llms.txt`, markdown docs, registry
  indexes, API catalogue, RSS, and health endpoints.

Every route must have its own useful title, description, canonical, social
metadata, semantic heading structure, internal links, and appropriate
structured data. Pages must not advertise products, counts, integrations,
testimonials, customers, prices, discounts, or support promises that are not
currently true.

## Visual system: Gel Pop

Gummy UI's initial design language is **Gel Pop**:

> Clean editorial SaaS layouts with selective gel materiality: bright tinted
> surfaces, soft inflated geometry, a crisp internal highlight, coloured depth,
> and quick elastic feedback.

The gel treatment is an emphasis and hierarchy tool, not an effect applied to
every surface. Dense forms, tables, and reading experiences remain restrained.

Pinterest's official 2026 trend forecast independently validates this
direction: its Gimme Gummy cluster reports 50–130% growth across related gummy
and jelly searches. Gummy UI translates that consumer appetite into
professional software rather than reproducing literal candy imagery.

The working formula is 70% restrained gummy materiality, 15% clean editorial
SaaS foundation, 10% opalescent and icy optical accent, and 5% geometric or
eccentric campaign detail. These percentages describe creative emphasis, not
literal screen coverage.

Initial colour families are deep aubergine ink, warm off-white canvas,
raspberry, grape, lime, tangerine, aqua, and ice blue. Tokens use OKLCH values
and must support accessible light and dark themes.

Detailed visual rules are maintained in
[`docs/design-direction.md`](docs/design-direction.md).

## Code and distribution decisions

- React and TypeScript
- Tailwind CSS
- native HTML first, with Base UI and Radix UI versions for applicable
  interactive components
- shadcn-compatible source-code registry
- Next.js-compatible documentation and marketing application
- native Next.js deployment on Vercel; the obsolete Sites deployment manifest
  and packaging plugin are removed so production has one authoritative host
  preserved until the hosting control-plane conflict is resolved
- npm as the repository package manager
- Nix devShell as the reproducible local development environment

Customers receive editable component source rather than depending on a black
box package. The current Base UI implementation remains canonical until each
Radix counterpart passes the same behaviour, accessibility, registry and
clean-install gates; parity cannot be claimed before that dual-engine work is
complete.

## Component-first execution workflow

Canonical reusable components are the product foundation and must be designed,
built, tested, and approved before they are used to assemble marketing pages,
dashboards, pricing sections, registry entries, or catalogue-scale production.
The public website must eventually import and use the real Gummy UI components;
it must not recreate their appearance with page-local imitations.

ImageGen is used only for focused material studies and art-direction reference.
Accessible React component source, shared tokens, documented states, and tested
interaction behaviour remain the product and the source of truth.

Component work is approved serially. The Button is approved. Stage 1B Group 1
(Input, Badge, and Card) remains open to later visual refinement. Stage 1B Group
2 (Switch, Tabs, Dropdown Menu, and Dialog) was reviewed, and the founder then
authorised Stage 1C composition work and the Stage 2 system foundation. The
canonical Component Lab remains available as the editable source catalogue.

## Repository and licensing boundary

Gummy UI uses two separate Git repositories:

| Repository    | Intended visibility | Contents                                                    |
| ------------- | ------------------- | ----------------------------------------------------------- |
| `gummyui`     | Public              | MIT components, registry, docs, site, free blocks, examples |
| `gummyui-pro` | Private             | Pro blocks, templates, design source, releases, internal QA |

Paid editable source must never enter the public repository, even temporarily.
Credentials and customer data must never be committed to either repository.

The complete boundary is maintained in
[`docs/repository-boundary.md`](docs/repository-boundary.md).

## Commercial infrastructure

The open-source launch requires no database or customer-account backend.

Commercial infrastructure is deliberately deferred until Pro needs it, but its
required outcomes are now fixed. The final system must minimise service count
while providing:

- secure authentication and verified-email recovery;
- users, organisations/workspaces, membership, roles and invitations;
- approved plans, prices, billing intervals, seats and commercial-use rights;
- hosted checkout and a self-service billing portal;
- idempotent, signature-verified payment webhooks;
- purchase, subscription, invoice, refund and entitlement records;
- protected private releases and short-lived, entitlement-checked downloads;
- transactional receipt, access, renewal, cancellation, refund, invitation and
  recovery emails;
- tax/VAT and invoice handling appropriate to the selling entity and customer;
- analytics, consent state, audit logs, error monitoring and health monitoring;
- encrypted transport, least privilege, secrets management, rate limiting,
  backups, restore tests and incident procedures; and
- account export, account deletion, marketing opt-out, data retention and
  support processes that match the published policies.

The approved production direction is Vercel, WorkOS AuthKit, Stripe Managed
Payments when eligible, Convex in its EU region, Resend, Better Stack and
encrypted Backblaze B2 backups. The $30/month fixed-service ceiling excludes Stripe
transaction fees and the existing domain renewal. Pricing, licence, refund,
support and entity decisions are approved; production provider reality and the
founder-approved, non-professionally-reviewed legal pages must still be tested
as one system.

## Delivery stages

### Stage 0 — Foundation

Outputs:

- separate public and private local repositories;
- reproducible development environments;
- product, catalogue, repository, and technical decisions;
- researched visual direction; and
- a passing public application build.

Exit criteria:

- [x] Both repositories exist.
- [x] Public/private rules are documented.
- [x] Free and Pro launch scope is countable.
- [x] The public project passes lint and production build.
- [x] The master spec exists.

### Stage 1 — Component-first visual proof

Stage 1 proceeds through explicit approval gates rather than producing a page
of provisional lookalikes.

#### Stage 1A — Button pilot (approved 22 July 2026)

Build one independent, reusable, open-source Button and a dedicated Component
Lab that proves every Button variant and state. Use the approved material image
and a focused ImageGen state sheet as art direction, then translate the result
into accessible React and CSS rather than shipping rendered artwork.

Required Button proof:

- convincing translucent gummy volume with geometry-following highlights;
- colour-matched thickness, chromatic contact shadow, and readable fruit colour;
- rest, hover, keyboard focus, pressed/squashed, loading, and disabled states;
- obvious horizontal expansion and vertical compression on press;
- quick chewy rebound, with restrained reduced-motion behaviour;
- light and dark themes;
- keyboard, pointer, touch, and mobile support; and
- meaningful automated tests, accessibility checks, type checking, lint, and a
  production build.

Exit criteria:

- [x] The Button reads as gummy in isolation without relying on the wordmark.
- [x] The component source is independent from the Lab page and suitable for
      reuse by the future public website.
- [x] Every variant and required state can be inspected and interacted with in
      the Component Lab.
- [x] The founder approves, rejects, or requests specific revisions.

Founder review note — July 2026:

- The overall Button direction is a major improvement and is close to the
  intended Gummy character.
- The live press and chewy rebound are strongly approved and must be preserved.
- The permanently flattened `Pressed / squashed` Lab specimen is rejected; it
  makes the component look thin and should not represent the resting material.
- Replace that frozen specimen with an interactive high-transmission finish
  that is visibly see-through, using glass-level translucency while retaining
  Gummy colour, thickness, readable text, and the existing press physics.
- The founder approved the canonical Button on 22 July 2026. Classic Gummy is
  the default finish, High-transmission is optional, and the live press/rebound
  physics are locked as the interaction reference for later components.

#### Stage 1B — Remaining component proofs

After Button approval, build and approve Input, Badge, Card, Switch, Dialog,
Tabs, and Dropdown Menu as canonical reusable components, one controlled group
at a time. Each component must meet the same accessibility, theme, responsive,
state, and test quality bar before composition work begins.

Group 1 is **Input, Badge, and Card**. It tests Gummy material across a form
control, a small status element, and a restrained content surface.

Stage 1B Group 1 material and API decisions — 22 July 2026:

- Input uses a calm milky native editing surface with visible fruit-rim state
  changes; labels and feedback remain outside the gel body and are associated
  through native form semantics.
- Badge is non-interactive by default and carries the strongest small-scale
  fruit colour. Its optional dot or icon is decorative and never replaces its
  text label. Its silhouette is one asymmetric gel pebble: subtly pressure-
  uneven and visibly different from a pill, rounded rectangle, pasted-on lobe,
  or outlined chip. Its default `alive` motion runs a quick lean, squash,
  wobble, and settle followed by a restrained periodic breath; explicit one-
  shot and static modes are also available. The highlight and internal cloud
  move with that deformation. It never reacts to hover, which could imply a
  false interactive affordance. Depth is formed inside the gel body, with no
  hard bottom shelf, detached drop shadow, or rainbow stripe.
- Card uses composable header, title, description, content, and footer slots.
  The base Card is not interactive; separate link and button foundations own
  genuine interactive Card behaviour so no clickable generic container is
  introduced. Its signature is a calm frosted reading plane held by an
  asymmetric translucent gel-pocket frame. Thicker upper-start and lower-end
  reservoirs visibly pool material while narrow connecting edges keep the
  content stable. Selection changes the pocket to raspberry; keyboard focus
  redistributes aqua into those reservoirs and deforms the frame rather than
  drawing a surrounding outline.
- Classic Gummy is the default finish for this group. Badge alone offers a
  restrained high-transmission finish because its compact silhouette preserves
  genuine optical transmission without disrupting reading or editing surfaces.
- The focused reference sheet is recorded in
  `docs/research/concepts/gummy-input-badge-card-imagegen-01.png`; it remains an
  art-direction aid and not product source.
- The Badge material and deformation follow-up is recorded in
  `docs/research/concepts/gummy-badge-material-motion-imagegen-01.png`, with its
  exact prompt beside the image.
- The founder-directed Badge and Card iteration is recorded in
  `docs/research/concepts/gummy-badge-pebble-imagegen-02.png` and
  `docs/research/concepts/gummy-card-pocket-frame-imagegen-02.png`. Their exact
  prompts are saved beside the images. These studies supersede the earlier
  Badge and Card silhouettes where the references conflict.
- Founder clarification — the Card iteration 02 sheet is a literal visual
  contract, not loose inspiration. The canonical Card must preserve its one
  continuous concave gel perimeter, integrated icon well, inset warm-milky
  plane, lower-end reservoir, three-metric anatomy, and restrained text action
  across default passive, elevated passive, selected, and interactive-focus
  states. A rounded rectangle with independently overlaid corner bubbles is not
  an acceptable translation. The decorative frame may use a component-internal
  scalable SVG while all content and interaction semantics remain native HTML.
- Founder optical-material clarification — the Card frame must transmit more
  of its backdrop and use layered glass-like edge light rather than an opaque
  pastel fill. The icon mark belongs directly to the upper-start reservoir:
  there is no independent icon Badge competing with that mass. The optional
  high-transmission Button takes its aqua glass, stable inner layer, and internal
  pool from the earlier optical-shell treatment while Classic Gummy remains
  unchanged. Its pool stays inside the silhouette rather than becoming an
  independently outlined bubble. Selected Badge specimens may use the
  same translucent shell, and Input translates it as a transmitting fruit shell
  around a stable warm-milky editing plane rather than making editable text
  optically unstable. In dark mode, high-transmission and glass-fruit Badges use
  a warm near-white label so their text remains readable against the transmitted
  page colour. Input shells borrow the glass-fruit Badge's local glint, cloudy
  colour pool, asymmetric rim, and internal rather than external depth. Responsive
  Card frames preserve the physical size of the
  upper-start icon reservoir and lower-end reservoir while only their thin
  connecting spans expand; horizontally stretching either reservoir, or letting
  the title enter its footprint, is a contract failure.

Founder sequencing direction — 22 July 2026:

- Group 1 is accepted provisionally so the component proof can advance. Input,
  Badge, and Card are not declared visually final and remain open to later
  refinement.
- Build all four remaining Stage 1B components together as **Group 2: Switch,
  Tabs, Dropdown Menu, and Dialog**. This direction authorises Group 2 only; it
  does not authorise Stage 1C compositions.

Stage 1B Group 2 material and API decisions — 22 July 2026:

- The focused visual contract is recorded in
  `docs/research/concepts/gummy-switch-tabs-menu-dialog-imagegen-01.png`, with
  its exact prompt beside the image. It extends the same translucent fruit-gel,
  warm-milky reading plane, internal colour pool, and asymmetric pressure rules
  established by Group 1.
- Switch is a native switch control with one compact asymmetric transmitting
  track and one physically attached fruit-glass thumb. Checked state redistributes
  lime through the track; keyboard focus redistributes aqua inside the track.
  It must not become a generic iOS switch or gain an exterior focus outline.
- Tabs share one calm translucent rail. The active material pools beneath the
  selected label and moves along the rail during selection; inactive tabs do not
  become independent pills. Arrow-key navigation, Home/End behaviour, tab-panel
  semantics, and visible keyboard focus belong to the component.
- Dropdown Menu uses a stable warm-milky popup held by a thin asymmetric gel
  edge and one attached lower-end reservoir. It owns menu semantics, roving
  focus, typeahead, Escape/outside dismissal, and focus restoration. Menu rows
  stay calm enough to scan and never become a stack of gummy buttons.
- Founder-directed Dropdown Menu iteration 02 is recorded in
  `docs/research/concepts/gummy-dropdown-menu-imagegen-02.png`, with its exact
  prompt beside the image. It supersedes the generic rounded trigger and
  keylined rectangular popup: the trigger is one transmitting milk-glass mass
  with a thick attached grape end, while the popup is one wavy transmitting
  membrane whose lower-end reservoir grows from the same material. Selected and
  keyboard-focused rows receive internal colour tides rather than boxed rows.
- Dialog is a compact frosted reading plane held by a restrained raspberry
  gel-pocket perimeter. It owns labelling, modal focus containment, Escape and
  backdrop dismissal, and trigger-focus restoration. It must not read as a
  giant Card or a giant Button.
- Founder cross-family quality clarification — the approved Switch is the
  material benchmark for the remaining controls. The focused follow-up at
  `docs/research/concepts/gummy-input-tabs-dialog-imagegen-02.png` and its exact
  prompt supersede flat Input shells, pill-in-rail Tabs, and Dialogs made from a
  rounded rectangle plus detached corner blobs. Input status belongs to its
  attached trailing reservoir; Tabs selection remains a pool inside one shared
  rail; Dialog reservoirs grow continuously from its transmitting perimeter.
- Founder UI-audit clarification — a reservoir, lobe, shine, or other irregular
  geometry must be removed when it reads as a nearby decoration instead of a
  continuous part of the functional body. For Dropdown Menu specifically, the
  trigger-to-popup bridge may carry the physical connection while grape colour
  stays inside the reading plane; a detached lower-end lobe is not required.
- Base UI primitives supply the interaction and accessibility foundation for
  Group 2; Gummy wrappers own the public anatomy, state styling, and material
  behaviour. Motion is quick, local, and chewy, with a restrained reduced-motion
  path.

#### Stage 1C — Composition proof (complete locally 22 July 2026)

Only after the canonical reference components are approved may the public
application assemble the SaaS hero, pricing section, compact dashboard, or
other marketing and product examples. These examples must import the real
Gummy UI components rather than reproducing their visuals locally.

The local composition proof includes the public SaaS hero, a compact dense
dashboard, and a plan comparison assembled from canonical components. The
approved Pro price book starts at $49 monthly and also offers yearly and
lifetime options; production deployment remains a separate test and review
gate.

### Stage 2 — Open-source system foundation

Outputs:

- stable design tokens and theme architecture;
- component anatomy and contribution conventions;
- shadcn-compatible registry base;
- documentation shell and navigation;
- installation workflow;
- accessibility and visual regression strategy; and
- the first production-quality component family.

Exit criteria:

- [x] A developer can install the Gummy base and a component into a clean app.
- [x] Installed source is readable, editable, and documented.
- [x] The component quality bar is written and repeatable.
- [x] Registry, docs, tests, and examples build successfully.

### Stage 3 — Free catalogue

Implement and document all 57 categories in coherent dependency groups. Every
component requires examples, states, accessibility verification, responsive
behaviour where relevant, light/dark support, and registry installation.

#### Stage 3 Group 1 — form foundations (complete locally 23 July 2026)

The first dependency group is Label, Field, Textarea, Checkbox, Radio Group,
and Native Select.

- Label is a native `label` foundation with visible required, optional,
  disabled, and read-only cues. It carries no decorative material of its own.
- Field composes one Label, one native or custom control, descriptions,
  validation, disabled and read-only state, and horizontal or vertical layout.
  It owns generated accessibility relationships while preserving explicit
  child props.
- Textarea is a native multiline editing surface with an optically stable
  plane, connected lower-end reservoir, native resizing, controlled and
  uncontrolled values, validation, and an optional live character count.
- Checkbox is a native checkbox with a 44px target, visible checked and mixed
  states, validation, disabled state, and a focusable read-only extension. Its
  compact connected indicator descends from the approved Switch material.
- Radio Group uses a native `fieldset`, `legend`, and same-name native radio
  inputs. It supports controlled and uncontrolled values, pointer and keyboard
  selection, Home/End, RTL-aware horizontal arrows, validation, disabled items,
  and focusable read-only selection.
- Native Select preserves the platform single-select picker for pointer,
  keyboard, touch, and mobile. Its chevron belongs to one attached trailing
  reservoir. A focusable read-only extension prevents value changes because
  HTML select has no native read-only state.
- Stable labels, descriptions, values, and messages stay on calm reading
  planes. Fruit material is limited to connected shell edges, attached state
  reservoirs, compact indicators, and local interaction.
- The focused material study is recorded in
  `docs/research/concepts/gummy-stage3-form-controls-imagegen-01.png`; its exact
  prompt is saved beside it and the bitmap remains reference rather than
  product source.
- The complete five-pass browser audit and every resulting fix are recorded in
  `docs/audits/stage3-form-foundations-five-pass-audit.md`.
- All six components have complete Component Lab specimens, public
  documentation, shadcn-compatible registry items, clean-fixture installation
  verification, unit and behavior tests, automated axe checks, token contrast
  tests, rendered-output checks, RTL and responsive coverage, reduced-motion
  rules, type checking, lint, and a production build.

The next catalogue dependency group is **Stage 3 Group 2 — layout and feedback
primitives: Separator, Typography, Kbd, Spinner, Skeleton, and Aspect Ratio**.
These low-level pieces should be completed before higher-level navigation,
selection, data-display, and composite input groups depend on them.

The complete remaining dependency order is:

1. Group 2 — Separator, Typography, Kbd, Spinner, Skeleton, and Aspect Ratio.
2. Group 3 — Alert, Avatar, Empty, Item, and Progress.
3. Group 4 — Accordion, Breadcrumb, Collapsible, and Pagination.
4. Group 5 — Button Group, Slider, Toggle, and Toggle Group.
5. Group 6 — Alert Dialog, Drawer, Hover Card, Popover, Sheet, and Tooltip.
6. Group 7 — Context Menu, Menubar, Navigation Menu, and Sidebar.
7. Group 8 — Calendar, Combobox, Command, Date Picker, Input Group, Input OTP,
   and Select.
8. Group 9 — Carousel, Data Table, Direction, Resizable, Scroll Area, Table,
   and Sonner.

Each group must update the canonical source, public registry, component index,
detail documentation, search index, machine-readable catalogues, Component Lab,
tests, install fixtures, changelog, and accessibility record in the same
change. Counts must be derived from catalogue manifests rather than hand-typed
in multiple pages.

Exit criteria:

- [ ] All 57 catalogue entries meet the quality bar.
- [ ] Every component has live examples, source viewing/copying, Base UI or
      native semantics, complete states, responsive behaviour, light/dark themes,
      RTL, reduced motion, API/anatomy docs, and an install command.
- [ ] Theme builder, RTL, CLI installation, registry indexes, markdown docs,
      `llms.txt`, API catalogue, health endpoint, and MCP documentation work.
- [ ] Next.js and Vite clean fixtures can install the base and representative
      components with npm, pnpm, yarn, and Bun command examples.
- [ ] Search, keyboard navigation, route metadata, robots, sitemaps, social
      cards, structured data and internal linking work.
- [ ] Public launch documentation, MIT licence, contribution guide, security
      policy, changelog and support route are complete.
- [ ] A clean external project can install and use the system without importing
      anything from the Gummy UI website application.

### Stage 4 — Pro commerce foundation

Outputs:

- founder-approved pricing architecture and commercial licence;
- Free, Solo, Team and Organisation comparison across seats, permitted use,
  support, updates and included products;
- secure checkout, billing portal, authentication, account recovery,
  workspaces, memberships and invitations;
- purchase, subscription, invoice, refund and entitlement records with
  idempotent, signature-verified webhook processing;
- protected, versioned release storage with expiring entitlement-checked links;
- receipt, access, renewal, cancellation, refund, invitation and recovery email
  flows;
- preview pipeline from private source to public site that cannot expose paid
  code or design files;
- account pages for downloads, licences, invoices/billing, profile, team access,
  data export and deletion;
- consent-aware product and commerce analytics, error monitoring, health checks,
  backups, restore tests, audit logs and incident procedures; and
- support, contact, refund, accessibility, security, privacy, terms and
  commercial-licence documentation consistent with the implemented system.

Exit criteria:

- [ ] Test-mode journeys pass for new purchase, existing account, magic-link or
      social sign-in, failed payment, duplicate webhook, cancellation, renewal,
      refund, access revocation, expired link, recovery and account deletion.
- [ ] A test customer can purchase, sign in, see the correct invoice/licence,
      invite an allowed teammate, and download only entitled releases.
- [ ] Paid source cannot be retrieved through the public repository or preview.
- [ ] Direct object URLs, guessed IDs, stale links, unauthorised workspace
      access and client-side entitlement bypasses fail closed.
- [ ] Tax, invoicing, privacy, retention, immediate-supply consent, refunds,
      lifetime-product access and recovery behaviour match the approved terms.
- [ ] No live price, discount, savings claim, testimonial or customer logo is
      published without founder approval and evidence.

### Stage 5 — Pro catalogue

Build 158 original blocks, six templates, and the complete design kit. Reuse
approved Gummy foundations while ensuring compositions and content are
original and useful beyond decorative demos.

Exit criteria:

- [ ] Published block counts are manifest-derived and match the 22-category
      catalogue plan exactly.
- [ ] Every block has a public responsive preview, dependency manifest, source
      metadata, light/dark and RTL support where applicable, and protected download.
- [ ] All six templates work as complete products with realistic original copy,
      navigation, responsive layouts, forms, empty/loading/error states, SEO and
      setup documentation.
- [ ] The design kit contains at least 300 useful component/variant definitions
      across the free and paid system, with auto layout, light/dark variables,
      states, properties, Tailwind/token annotations, usage guidance and release
      notes.
- [ ] Code and design assets use matching tokens, anatomy, variants and naming.
- [ ] Every private release is versioned, checksummed, documented, backed up,
      tested from a clean download, and delivered only through entitlement checks.

### Stage 6 — Launch and iteration

Outputs:

- public GitHub repository;
- production `gummyui.dev` deployment;
- the full public information architecture defined above;
- original launch content, component examples, blog/tutorials, changelog/RSS,
  with at least 18 substantive original articles, community
  showcase/submission, and the browser-local Gummy frame studio;
- verified localisation across the 20 benchmark locales, including translated
  metadata, locale sitemaps/hreflang and Arabic, Persian and Hebrew RTL;
- consent-aware analytics, funnel events, error monitoring and uptime checks;
- support, security and feedback intake with named ownership; and
- documented post-launch backlog based on observed demand.

Exit criteria:

- [ ] Free and paid products are publicly accessible as intended.
- [ ] Purchase and installation journeys work from a clean session.
- [ ] Public catalogue, block and template claims match the manifests and
      entitlement catalogue.
- [ ] Search engines and AI agents can discover the intended public pages and
      cannot index previews, account routes, APIs or paid source.
- [ ] Every locale passes functional, metadata, overflow and RTL checks; no
      unreviewed AI translation is represented as final.
- [ ] Full-coverage website audit score exceeds 95, with all errors fixed and
      every remaining warning documented with evidence and an owner.
- [ ] Core user journeys pass automated end-to-end checks on desktop and mobile;
      accessibility checks have no critical or serious violations; manual keyboard
      and screen-reader smoke tests are recorded.
- [ ] Production security headers, HTTPS, rate limits, webhook verification,
      dependency scanning and secret checks pass.
- [ ] Page weight, images, CSS/DOM size and Core Web Vitals meet the recorded
      budgets on representative marketing, docs, component, catalogue and account
      pages.
- [ ] Monitoring, backups, restore testing, rollback, incident response,
      customer-support ownership and post-purchase service levels are established.

## Quality rules for every implementation task

1. Use original design and code; never reverse-engineer paid RetroUI assets.
2. Prefer shared tokens and simple composition over one-off styling.
3. Accessibility and keyboard behaviour are part of the component, not later polish.
4. A component pilot is incomplete without its states, examples, documentation,
   and tests. Registry entries are added only after the canonical component is
   approved and the registry stage is authorised.
5. Avoid unnecessary backend services and dependencies.
6. Preserve the public/private boundary during builds, previews, and releases.
7. Run relevant lint, test, and production-build checks before reporting completion.
8. Record material product or architectural decisions in this spec or its linked docs.
9. Prefer manifest-derived counts and generated indexes over duplicated manual
   claims; fail CI when a public claim disagrees with the source catalogue.
10. Do not use visual-only demos as accessibility evidence. Test actual
    keyboard, focus, screen-reader naming, touch, validation, RTL and reduced
    motion behaviour.
11. Treat SEO, performance, security, privacy, support and operations as product
    requirements, not launch polish.
12. Never fabricate social proof, customers, community size, availability,
    discounts, price anchoring, time saved, compatibility or accessibility.
13. Before a release, run typecheck, lint, unit/behaviour tests, axe and contrast
    checks, registry fixtures, production build, rendered tests, end-to-end
    journeys, secret/dependency scans, and the full website audit.

## Release quality gates

No milestone may be called complete unless its applicable gates pass:

- **Catalogue integrity:** schema-valid manifests, unique names/slugs, generated
  counts, no missing assets, registry payloads and install fixtures.
- **Accessibility:** semantic roles and names, keyboard paths, focus
  restoration/containment, 44px touch targets, contrast, zoom/reflow, reduced
  motion, RTL, axe and recorded manual checks.
- **Performance:** responsive compressed images, route-level code loading,
  bounded CSS and DOM size, caching/compression, and recorded Core Web Vitals
  budgets.
- **Security:** HTTPS, CSP, HSTS in production, frame protection,
  Referrer-Policy, Permissions-Policy, secure cookies, CSRF protection where
  applicable, webhook verification, rate limits, no exposed secrets and least
  privilege.
- **Discovery:** unique titles/descriptions/canonicals, semantic headings,
  internal links, Open Graph/X, structured data, robots, sitemaps, hreflang,
  RSS, `llms.txt`, markdown docs and machine-readable catalogues.
- **Commerce:** plan/licence truth, test checkout, tax/invoice behaviour,
  idempotent events, entitlement enforcement, email delivery, refunds,
  cancellation, recovery, auditability and protected files.
- **Operations:** analytics consent, error/uptime monitoring, support intake,
  backups, restore evidence, release notes, rollback and incident ownership.

## Current status and next action

Stages 0 through 3 are implemented locally. All nine Stage 3 dependency groups
provide 57 unique public component categories with canonical editable React
and TypeScript source, shared material tokens, complete meaningful states,
documented semantics and keyboard contracts, forwarded refs, touch/reflow,
light/dark, RTL and reduced-motion treatment, source-derived anatomy/API
records, embedded responsive/theme/RTL inspection, and automated behavior and
accessibility checks. The generated shadcn-compatible registry contains 57
canonical component items plus four shared material payloads, alongside 22
separately installable official Radix UI counterparts and one Radix
state-compatibility payload. Combobox remains explicitly Base-only because
Radix publishes no Combobox primitive. Integrity and public/private boundary
checks cover every item.

The public application implements the complete pre-production information
architecture: marketing and discovery, components, boundary-safe Pro
catalogues and previews, templates, themes, design-kit status, pricing gates,
the browser-local frame studio, Markdown guides and mirrors, framework/editor
setup, troubleshooting, catalogue and health APIs, `llms.txt`, segmented
discovery controls, article/changelog RSS, 18 substantive original articles,
honest community submission and empty-showcase states, legal/operational gate
pages, and fail-closed account, checkout, billing, team, privacy and download
routes. Public claims are generated from the current private boundary-safe
export.

Independent clean consumers pass real shadcn installation, type checking and
production builds for Next.js and Vite across npm, pnpm, Yarn and Bun for the
canonical edition. The complete 22-counterpart Radix edition additionally
passes clean shadcn installation, type checking and production builds in
independent Next.js and Vite npm consumers. Component detail pages expose both
install commands, both editable sources and real interactive Radix previews.
The public gate includes 414 Vitest tests, all 57 canonical preview axe checks,
22 Radix counterpart axe checks, Radix overlay/menu behavior, localisation and
boundary tests, production rendering, artifact leakage, dependency/licence and
secret scans, and enforced gzip/image/style budgets. A production-build Chrome
harness passes 32 public routes, 15 sensitive routes, two protected endpoints,
320-pixel reflow, dark/light, RTL, reduced motion, keyboard traversal, four
accessibility trees, and seven axe scenarios with zero violations, overflow,
unnamed interactive nodes, runtime errors or failed resources. Manual screen
readers, painted contrast, actual 200%/400% browser zoom, Firefox/WebKit, touch
devices and long translated RTL remain external QA gates.

The provider-neutral commerce and account foundation is implemented and tested
behind a fail-closed production configuration. Its Convex schema has 25 tables:
24 durable commerce tables cover identities, accounts, workspaces, memberships,
invitations, purchases, subscriptions, invoices, licences, seats, releases,
entitlements, download grants, webhook idempotency, email intents, privacy
operations, billing adjustments and audit events; `rateLimitWindows` contains
only ephemeral, HMAC-derived distributed abuse-control state. Fake-provider
journeys exercise signature verification, replay resistance, authorization,
atomic one-use short-lived grants, access revocation, subscription lifecycle,
full and partial refunds, chargeback suspension/restoration, account views,
rate-limited data export, grace-period deletion, durable transactional-email
delivery, encrypted database backups and restore verification. The fixed
backup manifest contains exactly the 24 durable tables and deliberately
excludes the ephemeral rate-limit table, while a restore target must have all
25 tables empty before import. These local journeys do not exercise any
production credential, customer, live checkout or production entitlement; the
separately configured Stripe catalogue and live Vercel control plane remain
fail closed for commerce.

The localisation source is frozen reproducibly at revision
`en-a7f7748278cf`: 2,925 records, of which 2,654 are translatable and 271 are
protected. English is the only published language. All 19 private AI drafts
pass checksum, ordering, completeness, placeholder and protected-span
verification. Model replacement and provenance-recorded fallback repair
reduced every automated quality report to zero high-severity flags, and all 19
checksum-bound founder-review screens exist. Every locale remains fail closed
pending rendered QA and founder review; no unreviewed AI translation is
represented as final or as professionally translated.

The private `gummyui-pro` repository contains exactly 158 original implemented
blocks across 22 categories, six original implemented templates, and 300
source-aligned design-kit definitions. The v0.5.0 materialisation contract
expects 300 masters, 900 responsive instances, 138 editable component sets and
2,588 editable variants, including 72 editable pattern sets and 1,728 pattern
variants, alongside 72 raster comparison references and the current 38 public
tokens. The blocks have 474
Testing Library/axe contracts, 948 actual Chrome renders over the controlled
six-state/responsive/theme/direction matrix, and 132 checksummed contact sheets.
All six templates pass 142 tests, production builds and a real Chrome audit of
35 routes and 30 scenarios with zero axe, accessibility-tree, overflow,
runtime, resource or external-network failures. Clean downloads independently
install, typecheck, test and build all 158 blocks and six template packages.
Versioned release and backup code passes synthetic fail-closed fixtures.

Every paid item remains honestly `implemented`, with manual QA `pending`; none
is promoted to `verified` or `release-ready`. The previous v0.4.0 no-network
design-kit materializer ran successfully in the founder-owned Figma Starter
file and reported 300 masters plus 900 responsive instances. The current v0.5.0
payload expands the expected editable result to 138 sets and 2,588 variants,
but its live Figma Desktop run, founder/manual design review, export and archive
restoration remain pending. The actual paid-release builder therefore refuses
to package the catalogue, and the public boundary and deployment contain no
paid editable source.

The production-origin homepage Lighthouse check completed on three cold mobile
and three desktop runs. Median scores are 98 mobile performance and 100 desktop
performance, with accessibility, best practices and SEO at 100 in both modes;
one mobile run scored 93 performance. This satisfies the homepage-median check,
not the separate full-coverage greater-than-95 gate. After the source
corrections were deployed, SquirrelScan 0.0.80 completed a fresh full 445-URL
crawl and scored 81/B, with 28,466 passed checks, 1,288 warnings and 25
failures. This improves on the 79/C baseline; security scored 98 with no
security errors. Remaining loss is concentrated in hidden form-proxy modelling,
aggregate site-wide byte weight/cache rules, thin-content heuristics and agent
rules that do not recognise the live agent resources. Hydrated axe and
accessibility-tree gates continue to pass. The large inspector chunk, CSP
`unsafe-inline` and full-coverage 95+ gate remain explicit optimization,
hardening and audit work. The detailed evidence is in
`docs/audits/production-launch-verification-2026-07-28.md`.

The consolidated founder decisions are captured and the public/private GitHub
repositories exist. The private launch commits are pushed to private `main`.
The public prelaunch state is preserved by the `prelaunch-2026-07-28.1` tag.
The latest runtime-bearing public commit is `977012c`: source/audit corrections
landed in `52fe463`, and `977012c` pins Vercel to Node 22. Vercel deployment
`dpl_FPQy9sZw4t4fR156SnJfSUa2CZuf` for `977012c` is Ready; its build log proves
the exact commit and the Node 24-to-22 runtime transition.
Namecheap points the apex to `216.150.1.1` and `www` to
`4b8d541dfcd6e48a.vercel-dns-017.com`; Vercel marks both custom domains Valid
and public resolvers return the new records. HTTPS, all 362 sitemap URLs,
canonical-host redirects, route/security headers, malformed authentication
callbacks and fail-closed probes pass at `gummyui.dev`. GitHub Quality runs
`30371961881` and `30373015318` pass for the deployed correction and exact
Node 22 runtime-pin commits respectively. The single North Star remains at 0
of 8 production-verified steps because no complete production customer journey
is live.

Stripe Managed Payments is live-account ready with three products, nine prices
and `support@kreydlabs.com` configured. Its active `gummyui-production`
destination listens for the exact 16 required event types at
`https://gummyui.dev/api/webhooks/stripe`, and the signing secret is installed
only in secure runtime/operator stores. The restricted-key form now has the
required least-privilege permissions selected and stops at Stripe's explicit
founder identity-verification dialog before issuance. Deployed-origin signed
delivery and sandbox/live journeys remain unproved; checkout and webhook flags
remain fail closed.

The Vercel project and domain attachment exist, and every planned Production
environment value except the Stripe runtime key is installed. Vercel Pro is
active; spend management is set to $1 with notifications and Pause Projects
enabled. Deployment `dpl_FPQy9sZw4t4fR156SnJfSUa2CZuf` is Ready at
`977012c` on Node 22; both custom domains are Valid, public DNS has converged,
and the complete public-origin probe passes. The Stripe key and every commerce
journey remain pending. A Convex production deployment has
`CONVEX_SERVER_SECRET` and the production WorkOS deploy-time credentials set
there. The current 25-table schema, indexes and functions are deployed; a
post-deploy inspection confirmed all 25 tables are present and empty. Customer
journeys are not yet verified. The current production backup exported all 24
durable tables, encrypted and authenticated every object, uploaded and read
them back from B2, returned 200 and sent its success heartbeat. The subsequent
latest-backup verification returned 200. The mode-0600 operator recovery copy
then independently authenticated and decrypted that exact latest backup. An
isolated Convex target restored and reconciled all 24 tables successfully with
zero production records. A controlled Vercel rollback switched the real origin
to known-good deployment `dpl_7HCcW6w9uQB8vhvTe4HcUzUtpy52`, passed public
health and authentication probes, and promoted the current deployment back
successfully. Superseded B2-key revocation and founder password-manager custody
remain required.

WorkOS production AuthKit is enabled and its redirect, application, branding and
webhook are configured; its production credentials are installed in Vercel.
The production environment now enables Email + Password with the strong policy
and six-digit Magic Auth; the prior SSO-only customer-facing configuration is
removed.
The real-origin `/auth/sign-in` route returns a 307 to WorkOS with the canonical
`https://gummyui.dev/auth/callback` redirect URI, proving production
authentication initiation without proving account creation or callback/JWT
completion.
Real staging journeys continue to pass for Google sign-in, account projection,
organization creation/recovery, a controlled invitation, export/download,
deletion/cancellation, sign-out and unpaid protected-download denial. Production
callback, account/recovery and deployed Convex JWT-integration evidence remain
pending. The real production sign-up form is reached and filled with the
approved support address, but its human CAPTCHA requires founder interaction
before account creation and email-code evidence can continue.

Resend has a verified `send.kreydlabs.com` domain, and its production API key,
webhook and current sender/reply-to settings are installed in Vercel. A
domain-scoped, sending-only one-use key sent a controlled message from the
production sender to `support@kreydlabs.com`; Resend recorded both sent and
delivered, after which the one-use key was deleted. The application outbox and
signed Resend webhook still require a real account event. Better Stack's free
service has an uptime monitor, status page, one active production log source
and four scheduled-job heartbeats configured, with the corresponding Vercel
values installed. The two-label EU ingestion-host allowlist correction is
deployed. All four controlled production jobs returned 200 and Better
Stack's UI shows backup, backup verification, privacy jobs and email outbox Up.
The active production source accepts controlled ingestion with HTTP 202;
the live tail retains multiple production events. Better Stack's controlled
sample incident records both email delivery to and opening by
`support@kreydlabs.com`. A controlled genuine missing-heartbeat drill then
shortened only the email-outbox monitor window, detected the absent heartbeat,
opened incident `994928414`, and recorded an email sent to
`support@kreydlabs.com`. The production expectation was restored to five
minutes with a five-minute grace period, a controlled recovery heartbeat
returned 200, and the monitor returned Up.
Backblaze B2 has two private encrypted EU buckets for releases and backups with
separate scoped runtime and backup keys installed in Vercel. Fresh backup,
independent operator-key verification and isolated restore now pass. Paid
delivery, superseded B2-key revocation and recovery-copy custody remain
unproved.

Current product gates also include running and visually reviewing the v0.5.0
Figma materialisation of 138 sets and 2,588 variants, reviewing its 72 editable
pattern sets against the 72 raster comparison references, completing founder
rendered/localisation review, and promoting actual paid releases.

The remaining work is dominated by founder-controlled gates: complete the
WorkOS CAPTCHA/account/recovery/JWT journey, complete Stripe identity
verification so the selected restricted key can be issued, run the private
Figma materializer and visual reviews, approve localisation, revoke the
superseded B2 key after reauthentication, and move the recovery bundle into the
founder password manager. Then paid releases, signed webhook/email/customer
journeys and the authorised real purchase/full refund can proceed. The project
is not commercially launched until all eight North Star steps have evidence.
