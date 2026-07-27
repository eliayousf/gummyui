# Stage 3 form foundations — five-pass UI audit

Date: 23 July 2026

Scope: Label, Field, Textarea, Checkbox, Radio Group, and Native Select.

Reference hierarchy:

1. Canonical Button for material depth and press/rebound quality.
2. Canonical Switch for connected translucent material, compact indicators,
   and focus-state redistribution.
3. `gummy-stage3-form-controls-imagegen-01.png` for focused form art direction
   only; React, TypeScript, CSS, semantics, and live behavior remain canonical.

The real local application was inspected at `http://localhost:3001/components`
in the in-app browser. Each pass included a fix and a second inspection.

## Pass 1 — material continuity

### Inspected

- Field, Textarea, and Native Select shells in the composed form.
- Checkbox and Radio Group indicators beside the approved Switch material.
- Dark-theme default, focus, success, validation, disabled, and read-only
  specimens.
- Connected geometry at 1280 × 900.

### Finding

The long-control reservoirs were clipped inside their shells, but their compact
width and pale gradient made them read as half-circles rather than material
pooled along a functional edge.

### Fix

- Widened Field, Textarea, and Native Select pools.
- Changed the pressure geometry to an elongated trailing/lower-end mass.
- Reduced the proportion of near-white gel in the gradient.
- Moved deformation along the edge so the reservoir joins a longer span of the
  shell instead of appearing as a circular corner decoration.
- Preserved fixed reservoir dimensions while flexible control spans absorb
  width.

### Re-inspection

The composed form showed one continuous shell per long control. Pools now read
as attached pressure reservoirs, with no exterior blobs, detached shadows,
hard keylines, or independent decorative shapes.

## Pass 2 — typography, hierarchy, spacing, and density

### Inspected

- Nine-state Field matrix at 1280 × 900.
- Long labels, descriptions, required/read-only metadata, horizontal density,
  validation, and the realistic workspace form.
- Card widths, vertical rhythm, overflow, and content scan order.

### Finding

Production labels and messages scanned correctly, but the Component Lab's
specimen captions and composed-form autosave status were smaller and fainter
than the review surface needed in dark mode.

### Fix

- Increased specimen caption text from 9px to 10px.
- Increased the autosave status to 10px.
- Moved the autosave status from muted colour to the stronger secondary-ink
  token.

### Re-inspection

All nine Field specimen cards remained equal height with no horizontal
overflow. Metadata became readable without competing with component labels or
editing content.

## Pass 3 — responsive behavior and RTL

### Inspected

- Composed form at 768 × 900 and 390 × 844.
- Grid reflow, touch targets, action order, content wrapping, and document
  overflow.
- RTL Field and Native Select reservoir positions.
- Horizontal Radio Group behavior in RTL.

### Finding

The components and form reflowed without overflow, but the compact Lab header
hid its tag and status text using zero font size. That left an empty outlined
tag and an unexplained green dot at 390px.

### Fix

- Removed the Lab tag and status element from layout at the mobile breakpoint.
- Kept the brand and theme control as the two clear mobile-header actions.

### Re-inspection

- No document overflow at 768px or 390px.
- The composed grid resolved to one column below 820px.
- Mobile actions stacked with the primary action first in reading flow.
- Every measured native control or custom target remained at least 44px high.
- RTL reservoirs moved to inline start through logical properties; the document
  did not overflow.
- RTL Arrow Right moved selection to the preceding DOM option as intended.

## Pass 4 — light/dark optical quality and readable contrast

### Inspected

- Composed form and Field state matrix in both themes.
- Stable text and editing planes, placeholders, descriptions, focus, success,
  validation, disabled, and read-only states.
- Token contrast checks for both stable planes and selected compact marks.

### Finding

Live keyboard focus redistributed aqua through both shell and pool, but the
forced Component Lab focus specimens changed only the rim. Their internal pool
remained grape, so the visual specimen was not a truthful preview of behavior.

### Fix

- Applied the live aqua Field variables to the forced Field focus specimen.
- Applied the same correction to Textarea and Native Select.

### Re-inspection

Light and dark forced-focus specimens now match live focus. Stable text remains
on warm-milky or dark-milky planes; semantic messages are readable and paired
with a visible mark or status icon. Automated OKLCH contrast checks pass WCAG
AA for stable text layers and compact selected marks.

## Pass 5 — interaction, keyboard, touch, focus, and reduced motion

### Inspected

- Checkbox pointer and Space toggling.
- Read-only Checkbox pointer and Space protection.
- Radio Group pointer, Arrow Right, Home/End, and RTL Arrow Right behavior.
- Native Select platform selection and read-only protection.
- Live `:focus-visible` treatment after keyboard input.
- Browser-loaded reduced-motion CSS and target dimensions.

### Browser results

- Checkbox toggled and retained focus after pointer input.
- Read-only Checkbox remained checked after click and Space.
- Radio Group moved checked state and focus together.
- RTL Radio Group reversed horizontal direction correctly.
- Native Select changed to the selected platform option.
- Read-only Native Select remained on its accepted value.
- Live keyboard focus produced the full aqua internal pool and halo.
- Minimum measured target height was 44px.
- No browser console errors or warnings were present.

### Finding

Reduced motion removed transitions, but the active Checkbox, Radio, and Native
Select selectors could still land in a squashed transform.

### Fix

Explicitly neutralised active Checkbox, Radio, and Native Select transforms
inside `prefers-reduced-motion: reduce`. Visible checks, dots, validation, and
focus styling remain intact.

### Re-inspection

The browser-loaded CSS contains reduced-motion overrides for all three active
selectors, transition duration is effectively removed, and visible selected
marks remain present. No focus restoration behavior applies to this group
because none of the six components opens an overlay or moves focus into a
temporary surface.

## Final audit status

All five passes are complete. Every blocking finding was fixed and re-inspected
in the real local application.
