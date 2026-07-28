# RetroUI product benchmark

Research date: 26 July 2026
Latest commercial/component recheck: 27 July 2026

## Purpose and boundary

This benchmark defines the current product envelope Gummy UI intends to meet or
exceed with original design, code, content, assets, names and commercial terms.
It is not a licence to copy RetroUI's source, paid assets, compositions,
template structures, copy or visual identity.

The canonical Gummy UI decisions remain in `MASTER_SPEC.md`. When RetroUI's
public surfaces disagree, Gummy UI follows the decision that best serves its
customers and can be implemented and tested consistently.

## Research method

The review covered:

- RetroUI's home, components, blocks, templates, themes, Figma, screenshot
  studio, pricing, documentation, installation, MCP, changelog, blog, showcase,
  sign-in, privacy and terms pages;
- the public GitHub repository and shadcn registry positioning;
- `robots.txt`, `sitemap.xml`, `llms.txt`, registry/API discovery and RSS;
- interactive browser inspection of the public home and sign-in journeys;
- a 120-page surface audit and a separate full-coverage crawl; and
- the local Gummy UI repository, public routes, component source, registry,
  tests, build and a three-page full local crawl.

RetroUI is a moving target. Re-run this benchmark before final pricing and
launch, then record material changes without silently expanding scope.

## 27 July 2026 material recheck

The current public product changed or clarified two launch-critical points:

- the component documentation and catalogue now present both Radix UI and Base
  UI versions; Gummy UI has since closed that local parity gap with 22
  official-primitive Radix counterparts while accurately keeping Combobox
  Base-only;
- the current public pricing page presents Free at $0; Individual at $49
  monthly, $389 yearly or $899 lifetime; Team at $99 monthly, $789 yearly or
  $1,899 lifetime; and Organization at $199 monthly, $1,589 yearly or $3,899
  lifetime.

RetroUI's home and pricing pages still use inconsistent block totals (158
catalogued blocks versus broader “200+” marketing language), so Gummy UI keeps
manifest-derived counts and never inflates the 158 implemented block catalogue.
The current pricing and dual-engine facts supersede the older observations
below where they conflict.

## Verified RetroUI envelope

### Catalogue

- [57 public component categories](https://retroui.dev/components).
- [158 blocks across 22 categories](https://retroui.dev/blocks).
- [Six templates](https://retroui.dev/templates): developer tools, multipage
  SaaS, agency, portfolio, AI SaaS and administration dashboard.
- Public component, block and template indexes, category/detail routes and live
  previews.
- Public claims for light/dark themes, RTL, Tailwind, shadcn CLI, editable
  source and accessibility foundations.

The Gummy UI component and block counts in `docs/catalogue-plan.md` match the
verified 26 July 2026 catalogue exactly.

### Developer distribution and documentation

- Editable React and TypeScript source distributed with the shadcn CLI.
- npm, pnpm, Yarn and Bun command tabs.
- Next.js and Vite installation guides.
- Separate registry indexes exposed for the public component engines.
- Component detail pages with live examples, CLI/manual source access and
  documentation navigation.
- Search/command palette across docs and catalogue.
- [MCP setup](https://retroui.dev/docs/mcp) for Claude Code, Cursor, VS Code
  and manual configuration.
- `llms.txt` describing docs, machine-readable endpoints, registry indexes and
  templates.
- Markdown documentation by appending `.md` to a docs URL.
- A `.well-known/api-catalog`, registry indexes and public health endpoint.
- [Changelog](https://retroui.dev/docs/changelog) with an RSS feed.

The current customer-facing documentation and component catalogue present both
Radix UI and Base UI variants. An older changelog direction conflicts with that
live offer; parity is measured against what customers can obtain now. Gummy UI
now implements and tests both where an official Radix counterpart exists.

### Theme and design products

- [Theme builder](https://retroui.dev/themes) with nine advertised axes
  spanning surfaces, primary and chart colours, type, shape, borders, shadows
  and patterns.
- Live component-system preview, shareable state and one-command installation.
- [Figma kit](https://retroui.dev/figma) advertised as 300+ components with
  variants, auto layout, light/dark tokens and Tailwind annotations.
- A browser-only [screenshot studio](https://retroui.dev/screenshot) with local
  file processing, frame/background/corner/shadow/border/padding controls and
  export positioning.

Gummy UI should reproduce the utility and integration value with its own Gel
Pop implementation and product naming, not copy RetroUI's tool appearance.

### Marketing, content and community

- Product home with working component proof, catalogue previews, benefit
  sections, repeated calls to action and social proof.
- GitHub and community metrics, testimonials and showcase evidence.
- [Blog](https://retroui.dev/blog) with 18 indexed articles at the research
  date.
- [Community showcase](https://retroui.dev/showcase) with nine public sites and
  a GitHub-based submission route.
- Discord community, GitHub contribution surface and partner links.
- Footer discovery for products, resources, company/legal and partners.
- Language selector exposing 20 locales: English, French, Spanish, Portuguese,
  Italian, Dutch, Indonesian, German, Polish, Turkish, Vietnamese, Japanese,
  Simplified Chinese, Korean, Hindi, Russian, Ukrainian, Persian, Hebrew and
  Arabic.
- Locale-specific public pages and segmented sitemaps.

Gummy UI must never invent community counts, testimonials, customer sites or
partners to fill these sections. It should build the systems and publish only
evidence it can verify and has permission to use.

### Commerce and accounts

The [pricing page](https://retroui.dev/pricing) observed on the latest recheck
contains:

- Free ($0), Individual, Team and Organization;
- monthly, yearly and lifetime billing, with current prices of $49/$389/$899
  for Individual, $99/$789/$1,899 for Team, and $199/$1,589/$3,899 for
  Organization;
- seat, commercial-use, support, catalogue, templates, Figma, updates, theme
  and RTL comparison dimensions;
- Stripe checkout positioning;
- pricing FAQ, cancellation language and a support email;
- template and community evidence; and
- a value/savings comparison.

The public sign-in flow offers Google, GitHub and email magic links and states
that accounts unlock Pro blocks, templates and the Figma kit. Public policies
refer to purchases/licences, workspaces, membership/collaboration data,
transactional email, analytics and account data rights.

Gummy UI uses the same current price points and cadence under its own seller,
licence, permissions, copy and design. Customer rights must come from Gummy
UI's approved commercial licence, not from copied RetroUI terms.

### Legal, privacy and operations

- Public [privacy policy](https://retroui.dev/privacy) and
  [terms](https://retroui.dev/terms).
- Account data, cookies, analytics, authentication, database, email, retention,
  deletion/export and marketing opt-out disclosures.
- Open-source component rights separated from protected site/paid content.
- Account responsibility, acceptable use, workspaces, third-party services,
  warranty, liability and termination language.

Gummy UI's documents must describe its real selling entity, processors,
jurisdictions, data flows and commercial licence. RetroUI's text is only a
coverage checklist and must not be copied or treated as legal advice.

## Site-quality findings

The 120-page RetroUI surface crawl used squirrelscan 0.0.38 and reported an
overall score of 45/F. A second 500-page full-coverage crawl reported 47/F, with
47,465 passed checks, 7,894 warnings and 1,999 failed checks. Cloudflare
protection and the 500-page limit mean the results are directional, not a
definitive assessment of all 3,260 sitemap URLs.

Material findings included:

- accessible-name, label, focus/`aria-hidden`, landmark, contrast and heading
  issues;
- missing image alternatives/dimensions, oversized images and lazy-loading
  mistakes;
- large HTML, DOM and transfer weight plus cache/font/request-chain issues;
- missing CSP, HSTS and clickjacking protection;
- duplicate or poorly sized titles/descriptions and missing social images;
- localisation canonical/Open Graph mismatches;
- video captions/schema/poster gaps; and
- missing or weak author/contact signals, broken external links, orphan pages
  and thin translated content.

The benchmark is therefore the breadth of RetroUI's offering, not its defects.
Gummy UI's release gate is a greater-than-95 full-coverage audit with all errors
fixed and every remaining warning evidenced and owned.

## Current Gummy UI baseline

Verified locally on 26 July 2026:

- Nix devShell and `.envrc` are present.
- Type checking and lint pass.
- All 16 test files and 54 unit/accessibility tests pass.
- Registry fixture verification passes for nine public registry items.
- Production and rendered-output builds pass.
- Fourteen canonical source components currently exist.
- The public app currently exposes home, components and docs routes.

The local full crawl reported 29/F across three development-server pages. Local
HTTP, compression, caching and security-header findings partly reflect the
development server, but the following are genuine implementation gaps:

- only three routes and nine public registry items;
- no robots file or XML sitemap;
- duplicate route titles/descriptions and missing canonicals;
- no public legal, contact or trust routes;
- missing accessible names on several Switch/demo controls and additional
  labelling/`aria-hidden` findings;
- oversized research PNGs served from the Component Lab;
- a large global stylesheet and large Component Lab DOM;
- thin home-page content and weak internal linking; and
- no complete component-detail, theme, Pro, account, commerce, content,
  community, localisation or machine-readable discovery layer.

## Gap summary

| Area | Current Gummy UI | Required end state |
|---|---|---|
| Free components | 14 canonical source components; 9 registry items | 57 complete, documented and installable categories |
| Public routes | Home, components, docs | Full information architecture in `MASTER_SPEC.md` |
| Docs/discovery | Basic docs and registry | Search, per-component docs, framework guides, markdown, `llms.txt`, API catalogue, indexes, MCP, RSS and health |
| Themes | Static light/dark tokens | Shareable multi-axis builder with preview and install |
| Pro catalogue | Planned | 158 blocks, six full templates, protected previews/downloads |
| Design product | Planned | 300+ useful Figma component/variant definitions with code mapping |
| Utility product | None | Local-only Gummy frame/screenshot studio |
| Commerce | Deferred | Approved plans/licence, checkout, billing, entitlements, downloads, email, tax/invoices and account/team flows |
| Content/community | None | Original blog, changelog/RSS, showcase/submission, support and contribution system |
| Localisation | Component RTL rules | 20-locale product/docs architecture and reviewed translations |
| Trust/operations | MIT repository boundary | Complete legal/support/security/privacy surfaces, monitoring, backups, restore, rollback and incident ownership |
| Web quality | Passing code checks; 29/F local crawl | Passing code/E2E/security checks and >95 full production crawl |

## Decisions carried into the master spec

1. Deliver both Base UI and Radix UI versions where a headless engine is
   required, while keeping native HTML first.
2. Treat 57/158/22/six as minimum catalogue breadth, not the complete product.
3. Add machine-readable docs and registry discovery as first-class deliverables.
4. Add the theme builder, design kit and local screenshot/frame studio.
5. Add the complete marketing, content, community and localisation surfaces.
6. Add plan comparison, accounts, teams/workspaces, billing, entitlements and
   protected release delivery.
7. Add legal, data-rights, support, analytics, monitoring, backup and incident
   operations.
8. Use generated manifests as the source for every public catalogue count.
9. Exceed rather than inherit RetroUI's accessibility, performance, security,
   metadata and content-quality defects.
10. Keep pricing, licence, legal identity and production deployment behind the
    founder approval gates already defined in `MASTER_SPEC.md`.
