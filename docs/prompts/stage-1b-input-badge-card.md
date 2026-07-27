# Stage 1B Group 1 prompt — Input, Badge, and Card

```text
Read /Users/eliayousf/dev/gummyui/MASTER_SPEC.md and treat it as authoritative.

The founder approved the canonical Gummy Button on 22 July 2026. Classic Gummy
is the default finish, High-transmission is optional, and its quick chewy
press/rebound physics are approved. Preserve the Button implementation and use
it as the visual, interaction, accessibility, and code-quality reference.

For this task, execute only Stage 1B Group 1: Input, Badge, and Card.

Build exactly three independent, production-quality, reusable open-source React
components:

1. Gummy Input
2. Gummy Badge
3. Gummy Card

Do not place their implementations inside the page or Lab component. The Lab
must import and use the real canonical components. Do not recreate the approved
Button’s appearance locally; use the real GummyButton wherever a Button is
needed in an example.

First, update MASTER_SPEC.md and docs/design-direction.md only where necessary
to record material decisions made for this component group. Do not weaken the
component-first workflow or the public/private repository boundary.

Use the built-in ImageGen tool internally as an art-direction aid. Do not use an
external API key. Create one focused reference sheet for Input, Badge, and Card
using these approved references:

- /Users/eliayousf/dev/gummyui/docs/research/concepts/gummy-material-direction-imagegen-01.png
- /Users/eliayousf/dev/gummyui/docs/research/concepts/gummy-button-states-imagegen-01.png

Save the selected reference sheet and exact final prompt under
docs/research/concepts/. ImageGen is not the product: accessible React source,
shared tokens, and tested interaction behaviour remain the source of truth.

Material direction

- Extend the approved bright fruit-gel system without making every surface look
  like a Button.
- Preserve the five Gummy signatures: luminous transmitted colour, saturated
  rim, slight internal clouding, geometry-following highlight, and chromatic
  depth/contact shadow.
- Highlights must belong to the component geometry, never a pasted-on white
  capsule or uniform glass border.
- Use Classic Gummy as the default material. High-transmission may be used only
  where genuine see-through behaviour improves the component.
- Inputs and Cards must keep reading and editing surfaces calmer than primary
  actions. Badge may carry stronger fruit colour at small scale.
- Keep text and icons on optically stable, independently contrast-checked
  layers.
- Support light and dark themes without turning the primary experience dark.
- Use restrained motion and honour prefers-reduced-motion.

Gummy Input requirements

- Use a native input foundation and preserve normal form semantics, ref
  forwarding, name/value/autocomplete/type attributes, and form submission.
- Provide a production API for label, description, error message, disabled,
  read-only, required, and optional leading/trailing adornments without making
  decoration part of the accessible name.
- Show and allow interaction with empty, placeholder, filled, hover, keyboard
  focus, error, success, disabled, and read-only states.
- Focus must be unmistakable and must not depend on colour alone.
- Error and success states need text or an icon in addition to colour.
- Labels, descriptions, and errors must be programmatically associated.
- Maintain comfortable mobile input sizing and prevent iOS zoom behaviour.

Gummy Badge requirements

- Use non-interactive semantic markup by default; do not make a span behave like
  a button.
- Provide a small, coherent set of semantic variants mapped to the approved
  fruit palette: neutral, primary, secondary, success, warning, and info.
- Include solid/default and restrained high-transmission finishes only if both
  remain readable at small sizes.
- Support an optional decorative status dot or icon that does not become the
  sole state indicator.
- Demonstrate short labels, a numeric count, and a longer label without broken
  sizing or unreadable contrast.

Gummy Card requirements

- Build a reusable Card foundation with clear composition slots such as header,
  title, description, content, and footer rather than one page-specific card.
- Default Cards are restrained milky reading surfaces with a faint fruit cast,
  not oversized glossy Buttons.
- Provide default, elevated, selected, and genuinely interactive examples.
- A non-interactive Card must not be focusable or clickable.
- Interactive Cards must use a real link or button interaction path, obvious
  focus, keyboard activation, and an accessible name; never use an onClick div.
- Use the approved GummyButton component for Card actions.
- Support dense content, responsive layout, light/dark themes, and reduced
  motion.

Component Lab

- Replace the Button-only review surface with a focused Stage 1B Group 1
  Component Lab while retaining a small approved-Button reference area.
- Display and allow interaction with every Input, Badge, and Card variant and
  required state.
- Include native Lab controls for changing relevant variants and states.
- Clearly separate canonical specimens from art-direction references.
- State that Button is approved and that the new three-component group is
  pending founder review.
- Keep the Lab responsive for mobile and desktop and fully usable by keyboard.

Implementation rules

- Reuse and extend shared OKLCH tokens; avoid isolated page-only values where a
  component token is appropriate.
- Preserve a minimum 44px touch target for interactive controls.
- Keep decorative pseudo-elements pointer-events: none.
- Preserve the public/private boundary. Paid Pro source must never enter the
  public repository, even temporarily.
- Do not build Switch, Tabs, Dropdown Menu, Dialog, a hero, pricing section,
  dashboard, public marketing page, registry, free catalogue, or Pro catalogue.
- Do not deploy or publish. Stop at a local founder-review checkpoint.

Testing and verification

- Add meaningful unit and interaction tests for all three components.
- Test native semantics, ref and attribute forwarding, disabled/read-only
  behaviour, keyboard paths, accessible names/descriptions/errors, and Card
  interaction rules.
- Run automated axe accessibility checks across representative variants and
  states.
- Add or extend token-based contrast checks for readable text.
- Verify light and dark themes, mobile layout, touch targets, focus visibility,
  reduced motion, and absence of horizontal overflow in the working Lab.
- Run lint, TypeScript type checking, all relevant tests, the production build,
  and server-rendered output checks.
- Present the working Component Lab for founder review and report the exact
  checks run.

Stop after Input, Badge, and Card are ready for founder review. Do not begin the
next component group until the founder explicitly approves this one.
```
