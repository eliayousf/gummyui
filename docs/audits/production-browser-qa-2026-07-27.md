# Production-build Chrome QA — 27 July 2026

## Outcome

The automated local production-build gate passes in system Chrome
150.0.7871.187. It ran against an isolated `vinext start` server and a fresh
temporary Chrome profile over the Chrome DevTools Protocol.

This is automated browser evidence. It is not a production-origin test, a
human screen-reader walkthrough, or manual visual/contrast approval.

The exact checked source and production-build SHA-256 fingerprints are recorded
in the machine-readable evidence JSON and bound by its checksum manifest. The
production-build fingerprint is intentionally not duplicated in this prose
because each fresh production build has a distinct generated artifact identity.

## Automated coverage

- 32 public routes returned HTML directly with a title, H1, substantive body,
  no horizontal overflow, and no collision between visible top-level header
  columns at a 320 CSS-pixel viewport.
- 15 sensitive account, sign-in, and checkout routes returned fail-closed
  pages with `private, no-store`, an `X-Robots-Tag` containing `noindex`, and a
  `noindex` document meta directive.
- Invalid protected-download and download-grant requests returned the expected
  fail-closed 404 responses with private no-store and noindex headers.
- Seven checksummed screenshot scenarios covered 1280-pixel light and dark
  rendering, 320-pixel mobile rendering, RTL, reduced motion, a fail-closed
  account page, and the documented 200%-equivalent reflow condition.
- The 200%-equivalent condition used a 320 CSS-pixel viewport at device pixel
  ratio 2, producing 640 physical pixels. It did not simulate a person changing
  the browser zoom control.
- Keyboard traversal reached 28 unique focus stops on the home page and 32 on
  the Accordion detail page. Reverse traversal completed, the first home-page
  focus target was the skip link, no trap was detected, and every sampled
  keyboard target matched a visible `:focus-visible` treatment.
- The reduced-motion scenarios matched
  `prefers-reduced-motion: reduce`; maximum animation and transition durations
  were both 0.01 milliseconds.
- Dark-mode media emulation selected the dark token set and produced a palette
  distinct from light mode.
- The English RTL guidance route retained the correct LTR document direction
  and exposed a scoped RTL component boundary with computed RTL direction.
- Accessibility-tree smoke checks on the home, Accordion, RTL, and account
  routes found one main landmark per page and no unnamed focusable links,
  buttons, form controls, tabs, or sliders.
- Axe ran on seven representative routes and returned zero violations,
  including zero serious or critical violations.
- No unignored page exceptions or error-level browser logs occurred.

## Axe limitation

Axe marked painted colour contrast as `incomplete` on every representative
route because the production CSS uses OKLCH, `color-mix()`, transparency, and
layered backgrounds that the automated rule could not resolve consistently.
Those nodes are retained in the machine evidence. The result must not be read
as manual contrast approval.

The harness also records one expected local-origin diagnostic group: the
absolute production favicon URL is rejected by the local server's self-only
CSP when the page origin is `127.0.0.1`. On `https://gummyui.dev` the same URL
is same-origin. This diagnostic is grouped separately and is not counted as a
production-page runtime error.

## Defects resolved during the run

- Closed language-picker content had an authored `display: grid` rule that
  overrode native closed-`details` hiding and contributed off-screen layout.
- The 320-pixel header retained too many navigation and account actions after
  account scaffolding was added, allowing its visible grid columns to collide.
- Several grid and code surfaces allowed min-content width to escape a
  320-pixel viewport.
- Long display headings could exceed the mobile content box rather than
  wrapping at a safe opportunity.
- The mobile component hero kept a fixed mark beside a large heading instead
  of stacking.
- Source-viewer controls and theme output code had serious axe contrast
  findings before their foreground/background rules were corrected.
- Tabs panels exposed keyboard focus without a visible focus treatment.
- Two labelled generic containers lacked roles that permit an accessible name.

The production build was regenerated and the complete browser gate rerun after
these changes.

## Evidence

- Machine-readable run:
  [`browser-production-2026-07-27.json`](./evidence/browser-production-2026-07-27/browser-production-2026-07-27.json)
- SHA-256 manifest:
  [`browser-production-2026-07-27.checksums.json`](./evidence/browser-production-2026-07-27/browser-production-2026-07-27.checksums.json)
- Reproducible command:
  `nix develop path:. -c npm run test:browser:production`

The evidence JSON includes route-by-route response hashes, headers, viewport
metrics, overflow diagnostics, screenshots, axe results and incomplete nodes,
accessibility-tree summaries, keyboard traversal records, runtime diagnostics,
and source/build fingerprints.

## Human and external gates still pending

- Manual screen-reader walkthroughs in at least VoiceOver/Safari and
  NVDA/Chrome or the approved support matrix.
- Manual browser zoom at 200% and 400%, including text-only zoom where
  supported.
- Painted contrast inspection in both themes and interactive states.
- Firefox and WebKit rendering and keyboard review.
- Touch hardware, representative devices, and long translated RTL content.
- The same direct-route, header, CSP, console, and accessibility checks on the
  final production origin.
