# Stage 3 layout and feedback five-pass audit

Audit date: 26 July 2026

Scope: Separator, Typography, Kbd, Spinner, Skeleton, Aspect Ratio, their
Component Lab specimens, registry payloads, and clean-copy installation.

## Pass 1 — material continuity

- Separator uses one attached pool rather than detached decoration.
- Kbd depth stays inside the keycap and does not create a hard external shelf.
- Spinner’s fruit drop is physically attached to the rotating track.
- Skeleton tide remains inside each placeholder.
- Aspect Ratio uses one lower-end reservoir that grows from its frame.
- Typography keeps large reading surfaces calm; material is limited to code and
  the blockquote edge.

Result: pass. No component depends on a generic rounded surface plus a detached
blob.

## Pass 2 — hierarchy and density

- Separator’s default tone is quiet enough for dense lists.
- Heading levels and visual sizes are independent.
- Text measure defaults to 68 characters for sustained reading.
- Kbd remains legible in body copy and compact tables.
- Loading shapes communicate pending layout without implying final content.
- Aspect Ratio protects layout geometry before media is available.

Result: pass. Gel material remains an emphasis system rather than page-wide
decoration.

## Pass 3 — responsive and RTL

- Primitive specimen grids collapse from three columns to one.
- Fluid type scales avoid fixed desktop-only sizes.
- Horizontal and vertical Separator use logical margins.
- Blockquote’s material edge follows inline start.
- Aspect Ratio remains container-driven at every width.
- Fixed pools do not stretch with their containers.

Result: pass in the stylesheet and Lab fixtures at 1280px, 768px, and 390px
layout rules. Interactive browser reinspection remains part of the full-site
release audit rather than evidence claimed by this source review.

## Pass 4 — themes and contrast

- All stable text uses `--ink`, `--ink-soft`, or `--muted` over stable theme
  surfaces.
- Fruit material never sits behind required text.
- Eyebrow colour has a dark-theme override.
- Loading placeholders carry no meaning through colour.
- Aspect Ratio children own their content contrast; its reservoir is
  decorative.

Result: automated axe checks pass with token contrast governed by the existing
contrast suite. A browser contrast reinspection remains required before release.

## Pass 5 — interaction, motion, and semantics

- Separator is decorative by default and exposes a semantic mode explicitly.
- Typography uses native headings, paragraphs, code, and blockquotes.
- Shortcut punctuation is hidden from assistive technology.
- Spinner is a named status.
- Skeleton compositions are named once and individual shapes are hidden.
- Reduced motion removes spinner rotation and skeleton travel without removing
  status information.
- Aspect Ratio uses CSS layout only and adds no keyboard behaviour.

Result: behaviour tests, axe tests, ref forwarding, registry copying, and
isolated TypeScript compilation pass.

## Verification record

- TypeScript: passed.
- ESLint: passed.
- Vitest: 18 files and 61 tests passed after Group 2.
- Registry: 16 payloads built; all 12 Stage 3 component sources copied and
  type-checked in an isolated fixture.
- Production and rendered-output checks: required before marking the group
  complete in the master specification.
