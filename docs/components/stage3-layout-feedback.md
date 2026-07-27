# Stage 3 layout and feedback primitives

Separator, Typography, Kbd, Spinner, Skeleton, and Aspect Ratio are the second
Stage 3 dependency group. They give later catalogue groups stable layout,
reading, instruction, loading, and responsive-media foundations without
turning every surface into gel.

All six use native HTML or CSS semantics. They have no headless dependency.
Their Gummy signature is restrained: one connected material pool, a small
internal tide, or compact fruit depth where it improves hierarchy.

## Installation

Install the theme, shared primitive material, and the complete group:

```sh
npx shadcn@latest add \
  https://gummyui.dev/r/gummy-base.json \
  https://gummyui.dev/r/gummy-primitives-styles.json \
  https://gummyui.dev/r/gummy-separator.json \
  https://gummyui.dev/r/gummy-typography.json \
  https://gummyui.dev/r/gummy-kbd.json \
  https://gummyui.dev/r/gummy-spinner.json \
  https://gummyui.dev/r/gummy-skeleton.json \
  https://gummyui.dev/r/gummy-aspect-ratio.json
```

Import the generated styles once:

```css
@import "./gummy-theme.css";
@import "./gummy-primitives.css";
```

The registry copies editable React, TypeScript, and CSS source. It does not add
a Gummy UI runtime package.

## Separator

### Anatomy

1. Horizontal or vertical root.
2. Quiet rule that fades at each end.
3. One attached aqua material pool.

### API

`GummySeparator` preserves native `div` attributes.

| Prop | Type | Default | Purpose |
|---|---|---:|---|
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Sets visual direction and semantic orientation. |
| `decorative` | `boolean` | `true` | Uses `role="none"` when the boundary does not communicate structure. |
| `tone` | `"quiet" \| "fruit"` | `"quiet"` | Controls the prominence of the attached pool. |

Use a decorative Separator when surrounding headings already communicate the
structure. Set `decorative={false}` only when the boundary itself is meaningful.

```tsx
<GummySeparator />
<GummySeparator decorative={false} orientation="vertical" />
```

## Typography

### Anatomy and exports

- `GummyHeading` renders a real `h1`–`h6`.
- `GummyText` renders a paragraph with explicit size, tone, and reading measure.
- `GummyEyebrow` renders restrained interface metadata.
- `GummyInlineCode` renders a semantic `code` element.
- `GummyBlockquote` renders a native `blockquote` with an optional visible
  citation label.

### Heading API

| Prop | Type | Default | Purpose |
|---|---|---:|---|
| `level` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | `2` | Selects semantic heading level independently from size. |
| `size` | `"display" \| "title" \| "section" \| "subsection"` | `"section"` | Selects visual scale. |
| `balance` | `boolean` | `true` | Applies balanced wrapping when supported. |

### Text API

| Prop | Type | Default | Purpose |
|---|---|---:|---|
| `size` | `"small" \| "body" \| "large"` | `"body"` | Sets reading size and line height. |
| `tone` | `"default" \| "soft" \| "muted"` | `"default"` | Sets hierarchy with stable token contrast. |
| `measure` | `"compact" \| "reading" \| "wide" \| "none"` | `"reading"` | Prevents unreadably long lines. |

Semantic level must follow document structure; visual size never justifies
skipping a heading level.

```tsx
<GummyEyebrow>Release notes</GummyEyebrow>
<GummyHeading level={2} size="title">Accessible by construction</GummyHeading>
<GummyText tone="soft">
  Install <GummyInlineCode>gummy-base</GummyInlineCode> first.
</GummyText>
```

## Kbd

`GummyKbd` is a native `kbd` element. `GummyKbdGroup` lays out a shortcut and
marks its joiner as decorative so assistive technology reads the supplied
accessible name instead of punctuation.

| Group prop | Type | Default | Purpose |
|---|---|---:|---|
| `separator` | `ReactNode` | `"+"` | Visual joiner between keys. |

Give shortcut groups an `aria-label` that matches the product’s spoken
instruction.

```tsx
<GummyKbdGroup aria-label="Command K">
  <GummyKbd>⌘</GummyKbd>
  <GummyKbd>K</GummyKbd>
</GummyKbdGroup>
```

## Spinner

### Anatomy

1. Named `status` root.
2. Pressure-uneven circular track.
3. Attached fruit drop that moves with the track.

| Prop | Type | Default | Purpose |
|---|---|---:|---|
| `label` | `string` | `"Loading"` | Accessible status name. |
| `size` | `"small" \| "medium" \| "large"` | `"medium"` | Sets physical size. |
| `tone` | `"raspberry" \| "grape" \| "aqua" \| "current"` | `"raspberry"` | Selects semantic material colour. |

Prefer specific labels such as “Saving workspace” over “Loading”. When visible
copy already announces the same live status, avoid adding a second competing
live region.

Reduced motion replaces rotation with a static dotted track while preserving
the accessible status.

```tsx
<GummySpinner label="Saving workspace" size="small" tone="aqua" />
```

## Skeleton

### Exports

- `GummySkeleton` renders one decorative or explicitly named placeholder.
- `GummySkeletonGroup` names a complete busy composition and sets
  `aria-busy="true"`.

| Skeleton prop | Type | Default | Purpose |
|---|---|---:|---|
| `shape` | `"line" \| "text" \| "circle" \| "card"` | `"line"` | Selects placeholder geometry. |
| `lines` | `number` | `1` | Generates between one and twelve text lines. |
| `loadingLabel` | `string` | — | Exposes a standalone placeholder as a status. |

| Group prop | Type | Default | Purpose |
|---|---|---:|---|
| `label` | `string` | `"Loading content"` | Names the busy region once. |

Individual skeletons are `aria-hidden` by default. Prefer one named group over
multiple noisy loading announcements. Once content arrives, remove the group
and let the real content take its place.

```tsx
<GummySkeletonGroup label="Loading profile">
  <GummySkeleton shape="circle" />
  <GummySkeleton shape="text" lines={3} />
</GummySkeletonGroup>
```

Reduced motion replaces the travelling tide with a static internal highlight.

## Aspect Ratio

`GummyAspectRatio` uses the native CSS `aspect-ratio` property rather than
padding hacks. Its child content fills the frame.

| Prop | Type | Default | Purpose |
|---|---|---:|---|
| `ratio` | `number` | `16 / 9` | Sets width divided by height. Invalid or non-positive values fall back safely. |
| `fit` | `"cover" \| "contain" \| "fill"` | `"cover"` | Controls direct image and video fitting. |

The component does not invent image alternative text. Images still require an
`alt` value chosen from their purpose; decorative images use `alt=""`.

```tsx
<GummyAspectRatio ratio={4 / 3}>
  <img src="/component-anatomy.png" alt="Connected Gummy Card anatomy" />
</GummyAspectRatio>
```

## Theme, RTL, and responsive behaviour

- All colour comes from the shared OKLCH theme tokens.
- Logical properties place blockquote edges and separator spacing correctly in
  both text directions.
- Separator reservoirs stay a fixed physical size while the quiet span grows.
- Typography uses fluid scales with stable reading measures.
- Aspect Ratio remains width-driven and does not require fixed breakpoints.
- Loading states keep the same accessible information when reduced motion is
  active.

## Verification

The group ships with ref forwarding, semantic and behaviour tests, axe coverage,
registry clean-copy type checking, reduced-motion styles, light/dark tokens,
responsive Lab specimens, and rendered production verification. The review
record is in
[`docs/audits/stage3-layout-feedback-five-pass-audit.md`](../audits/stage3-layout-feedback-five-pass-audit.md).
