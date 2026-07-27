# Stage 3 display and feedback

Alert, Avatar, Empty, Item, and Progress are the third Stage 3 dependency group.
They compose the earlier typography, loading, Button, and primitive foundations
into credible product feedback while keeping interaction and live-region
behaviour explicit.

## Installation

```sh
npx shadcn@latest add \
  https://gummyui.dev/r/gummy-alert.json \
  https://gummyui.dev/r/gummy-avatar.json \
  https://gummyui.dev/r/gummy-empty.json \
  https://gummyui.dev/r/gummy-item.json \
  https://gummyui.dev/r/gummy-progress.json
```

All five depend on the shared base and primitive material through their registry
dependencies.

## Alert

`GummyAlert` is static by default. Set `live="polite"` for a non-urgent status
that appears after page load or `live="assertive"` for an urgent error that
requires immediate attention. Do not make content live merely because it is
visually styled as an Alert.

| Prop | Type | Default |
|---|---|---:|
| `variant` | `"neutral" \| "info" \| "success" \| "warning" \| "danger"` | `"neutral"` |
| `live` | `"off" \| "polite" \| "assertive"` | `"off"` |
| `icon` | `ReactNode` | semantic fallback mark |

Compose content with `GummyAlertTitle` and `GummyAlertDescription`. The icon
reservoir is decorative; title and description carry the complete message.

## Avatar

`GummyAvatar` renders an image when `src` succeeds and switches to its required
`fallback` after an error. `alt` follows normal image rules: name an avatar when
the image conveys identity and use an empty string when adjacent text already
names the person.

| Prop | Type | Default |
|---|---|---:|
| `src` | `string` | — |
| `alt` | `string` | `""` |
| `fallback` | `ReactNode` | required |
| `size` | `"small" \| "medium" \| "large"` | `"medium"` |
| `status` | `"online" \| "busy" \| "away" \| "offline"` | — |
| `statusLabel` | `string` | status name |

`GummyAvatarGroup` requires a `label` and visually overlaps direct Avatar
children with logical inline spacing.

## Empty

`GummyEmpty` is a semantic `section`, not an interactive container. Name it
with `aria-labelledby` pointing to `GummyEmptyTitle`. Optional
`GummyEmptyMedia` is decorative. Put real links or Buttons inside
`GummyEmptyActions`.

```tsx
<GummyEmpty aria-labelledby="empty-title">
  <GummyEmptyMedia>+</GummyEmptyMedia>
  <GummyEmptyTitle id="empty-title">No projects yet</GummyEmptyTitle>
  <GummyEmptyDescription>Create the first project.</GummyEmptyDescription>
  <GummyEmptyActions><GummyButton>New project</GummyButton></GummyEmptyActions>
</GummyEmpty>
```

## Item

Item anatomy is shared across passive, link, and button roots:

- `GummyItem` for a passive `div`, `article`, or `li`;
- `GummyItemLink` for navigation;
- `GummyItemButton` for an action;
- media, content, title, description, and action slots.

This split prevents a clickable generic container and avoids nested interactive
controls. `selected` changes the internal material tide; keyboard focus remains
visible on link and button roots. `density="compact"` tightens spacing without
reducing the minimum row target.

## Progress

`GummyProgress` contains a native labelled `progress` element. Supply `value`
for determinate work and omit it for indeterminate work.

| Prop | Type | Default |
|---|---|---:|
| `label` | `ReactNode` | required |
| `valueLabel` | `ReactNode` | generated percentage or “In progress” |
| `tone` | `"raspberry" \| "grape" \| "lime" \| "aqua"` | `"raspberry"` |
| `showValue` | `boolean` | `true` |

The visual value is native browser progress state rather than a client-authored
ARIA percentage. Reduced motion freezes the indeterminate tide in a visible
mid-track state.

## Verification

The group includes native-role, live-priority, fallback, root-separation,
pointer, keyboard, determinate/indeterminate, ref, axe, reduced-motion,
light/dark, RTL-logical, registry-copy, isolated typecheck, Lab, and production
coverage. No customer, uptime, or catalogue-completion claim is introduced by
these examples.
