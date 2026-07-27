# Stage 3 overlays

Alert Dialog, Drawer, Hover Card, Popover, Sheet, and Tooltip are the sixth
Stage 3 dependency group. All use Base UI; each keeps a distinct interaction
contract.

## Installation

```sh
npx shadcn@latest add \
  https://gummyui.dev/r/gummy-alert-dialog.json \
  https://gummyui.dev/r/gummy-drawer.json \
  https://gummyui.dev/r/gummy-hover-card.json \
  https://gummyui.dev/r/gummy-popover.json \
  https://gummyui.dev/r/gummy-sheet.json \
  https://gummyui.dev/r/gummy-tooltip.json
```

## Choosing an overlay

| Component | Use it for | Interaction |
|---|---|---|
| Alert Dialog | Consequential confirmation | Modal; explicit cancel and action |
| Drawer | Mobile-first bottom task or details | Modal, bottom edge, touch-safe and draggable by Base UI |
| Hover Card | Non-interactive supporting preview | Hover and keyboard focus |
| Popover | Contextual information or compact controls | Non-modal by default; optional focus trap |
| Sheet | Longer side workflow or filters | Dialog-modal, four edge positions |
| Tooltip | A short description for an already-labelled control | Hover/focus, Escape dismissal, no actions |

Every modal needs a Title and Description. Alert Dialog must include a visible
cancel route and should focus the least destructive action first. Popover with
focus trapping requires a Close control so touch screen-reader users can exit.
Tooltip and Hover Card content must not contain required interactive controls.

## Behaviour

- Trigger focus is restored after dismissal.
- Dialog-derived overlays contain focus and support Escape.
- Popover positions against its trigger and handles viewport collisions.
- Drawer applies bottom safe-area spacing.
- Sheet uses logical inline edges for left/right behaviour in RTL.
- Tooltip Provider shares open and close delay across adjacent descriptions.
- All popup transitions have a static reduced-motion path.

## Verification

Automated coverage exercises Alert Dialog initial focus and restoration,
Popover Escape and restoration, Sheet side state and close behaviour, Tooltip
keyboard focus and Escape, open-state axe checks, registry copying, and
isolated type checking. Drawer and Hover Card share the tested Base UI
foundations and have live Lab specimens; touch dragging and real-browser hover
remain explicit manual release checks.
