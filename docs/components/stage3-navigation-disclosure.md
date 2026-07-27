# Stage 3 navigation and disclosure

Accordion, Breadcrumb, Collapsible, and Pagination are the fourth Stage 3
dependency group.

## Installation

```sh
npx shadcn@latest add \
  https://gummyui.dev/r/gummy-accordion.json \
  https://gummyui.dev/r/gummy-breadcrumb.json \
  https://gummyui.dev/r/gummy-collapsible.json \
  https://gummyui.dev/r/gummy-pagination.json
```

Accordion and Collapsible use Base UI. Breadcrumb and Pagination use native
navigation and list semantics.

## Accordion

Compose `GummyAccordion` with Item, Header, Trigger, and Panel. Each Item
requires a stable `value`. Use `defaultValue` for uncontrolled initial panels
or `value` and `onValueChange` for controlled state. Set `multiple` when more
than one panel may remain open.

Base UI follows the current ARIA Practices guidance: every trigger participates
in normal Tab order; Enter or Space toggles its panel. Deprecated roving arrow
focus is not represented as a Gummy feature.

Panels expose generated trigger relationships, animated measured height, and a
static reduced-motion path.

## Breadcrumb

`GummyBreadcrumb` renders a labelled `nav` containing an ordered list. Compose
Item, Link, visual Separator, optional Ellipsis, and Page. Page applies
`aria-current="page"`. Separators are hidden from assistive technology and
reverse visually in RTL.

Do not use Breadcrumb as the only page heading or navigation system. It
communicates location within a hierarchy.

## Collapsible

`GummyCollapsible` re-exports Base UI Root. Trigger and Panel supply Gummy
anatomy while retaining `aria-expanded`, generated relationships, controlled
or uncontrolled state, disabled behaviour, and reduced-motion panel changes.

Use Collapsible for optional supporting content. Use Accordion for a related
set of sections and Dialog for content that requires modal focus.

## Pagination

Pagination is a labelled `nav` containing an ordered list. Link targets are at
least 44px. `current` applies `aria-current="page"`. Previous and Next include
visible labels and decorative arrows that reverse in RTL. Ellipsis exposes
visually hidden “More pages” text.

Pagination uses links because changing pages is navigation. Applications that
update results without navigation should retain linkable URLs and manage focus
or an announced results summary after the update.

## Verification

Coverage includes Base UI disclosure relationships, pointer and keyboard
activation, normal Tab order, current-page semantics, useful navigation names,
logical RTL arrows, 44px targets, axe, ref forwarding, registry copying,
isolated type checking, responsive Lab examples, themes, and reduced motion.
