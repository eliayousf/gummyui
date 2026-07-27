# Stage 3 form foundations

Label, Field, Textarea, Checkbox, Radio Group, and Native Select are the first
Stage 3 free-catalogue dependency group. They use native HTML behavior and keep
labels, descriptions, validation, and editing content on calm, optically stable
layers. Connected fruit-gel edges communicate focus, selection, success, and
error without covering the form in material.

## Installation

Install the theme foundation and all six components:

```sh
npx shadcn@latest add \
  https://gummyui.dev/r/gummy-base.json \
  https://gummyui.dev/r/gummy-label.json \
  https://gummyui.dev/r/gummy-field.json \
  https://gummyui.dev/r/gummy-textarea.json \
  https://gummyui.dev/r/gummy-checkbox.json \
  https://gummyui.dev/r/gummy-radio-group.json \
  https://gummyui.dev/r/gummy-native-select.json
```

Import the generated theme and form styles once in the application stylesheet.
The registry copies editable React, TypeScript, and CSS source into the
application. It does not introduce a Gummy UI runtime package.

```css
@import "./gummy-theme.css";
@import "./gummy-form-controls.css";
```

## Label

### Anatomy

1. Native `label` root and association through `htmlFor`.
2. Stable label copy.
3. Optional state metadata: Required, Optional, Read only, or custom `meta`.

### API

`GummyLabel` preserves native `label` props.

| Prop | Type | Default | Purpose |
|---|---|---:|---|
| `required` | `boolean` | `false` | Shows a visible required cue. Native constraint behavior still belongs to the control. |
| `optional` | `boolean` | `false` | Shows a quiet optional cue. |
| `disabled` | `boolean` | `false` | Mirrors the associated control's disabled presentation. |
| `readOnly` | `boolean` | `false` | Mirrors the associated control's read-only presentation. |
| `meta` | `ReactNode` | generated | Replaces generated state metadata. |

### Accessibility and states

- Always set `htmlFor` to the associated control's `id`.
- Visible labels are mandatory for editable controls; placeholder text is not a
  label substitute.
- Required state is also applied natively to the control by Field, Textarea,
  or Native Select.
- Disabled and read-only cues supplement, rather than replace, native or ARIA
  state.
- Label itself has no synthetic keyboard behavior. Activating it delegates
  focus or selection to the associated native control.

### Usage

Use Label by itself when composing a custom control. Prefer Field, Textarea, or
Native Select when their complete label and message composition already fits.

```tsx
<GummyLabel htmlFor="workspace-name" required>
  Workspace name
</GummyLabel>
<input id="workspace-name" name="workspace-name" required />
```

## Field

### Anatomy

1. Layout root.
2. Gummy Label.
3. One connected shell containing a calm editing plane and attached state pool.
4. One native or custom control supplied as the child.
5. Description and error or success message.

Field clones its single child to compose `id`, `required`, `disabled`,
`readOnly`, `aria-describedby`, `aria-errormessage`, and `aria-invalid`.
Existing child values take precedence.

### API

| Prop | Type | Default | Purpose |
|---|---|---:|---|
| `label` | `ReactNode` | required | Visible control label. |
| `children` | `ReactElement` | required | Exactly one native or custom form control. |
| `description` | `ReactNode` | — | Supporting copy associated through `aria-describedby`. |
| `errorMessage` | `ReactNode` | — | Invalid feedback; takes precedence over success and uses an alert. |
| `successMessage` | `ReactNode` | — | Positive feedback associated with the control. |
| `required` | `boolean` | `false` | Applies native required state and a visible cue. |
| `optional` | `boolean` | `false` | Adds an optional cue. |
| `disabled` | `boolean` | `false` | Applies native disabled state. |
| `readOnly` | `boolean` | `false` | Applies native read-only state when supported by the child. |
| `orientation` | `"vertical" \| "horizontal"` | `"vertical"` | Controls label and control layout; horizontal reflows on narrow screens. |
| `density` | `"default" \| "compact"` | `"default"` | Tightens layout spacing without reducing the touch target. |
| `controlId` | `string` | generated | Overrides the composed control and label ID. |

### Accessibility and states

- Field does not invent a group role. Its label targets the real child control.
- Error feedback uses both `aria-invalid` and `aria-errormessage`, plus readable
  alert text and a non-colour-only state mark.
- Focus remains on the child control. The surrounding shell responds through
  `:focus-visible`.
- Disabled state remains native. Read-only inputs remain focusable and
  selectable.
- Horizontal layout uses logical properties and reflows vertically below
  620px.

### Usage

Use Field for one control. Use `fieldset` and `legend`, or Gummy Radio Group,
for a related set of controls.

```tsx
<GummyField
  label="Workspace name"
  description="Shown in navigation and invitations."
  required
>
  <input name="workspace-name" autoComplete="organization" />
</GummyField>
```

## Textarea

### Anatomy

1. Gummy Label.
2. Connected multiline shell.
3. Native `textarea` on a stable reading plane.
4. Attached lower-inline-end state reservoir and non-colour-only status mark.
5. Description, validation or success message, and optional live character
   count.

### API

`GummyTextarea` preserves native `textarea` props.

| Prop | Type | Default | Purpose |
|---|---|---:|---|
| `label` | `ReactNode` | required | Visible associated label. |
| `description` | `ReactNode` | — | Supporting copy. |
| `errorMessage` | `ReactNode` | — | Invalid feedback and alert. |
| `successMessage` | `ReactNode` | — | Positive confirmation. |
| `optional` | `boolean` | `false` | Shows an optional cue. |
| `resize` | `"none" \| "vertical" \| "both"` | `"vertical"` | Controls CSS resizing without changing native editing behavior. |
| `showCount` | `boolean` | `false` | Shows an associated live character count. |
| `wrapperClassName` | `string` | — | Styles the outer composition. |

### Accessibility and behavior

- It is a native multiline text control with standard selection, clipboard,
  spelling, mobile keyboard, and form behavior.
- Controlled and uncontrolled values both update the visible count.
- `maxLength` remains a native constraint. Do not add it unless the product has
  a real storage or editorial limit.
- Error and success copy are associated through generated IDs. Error takes
  precedence when both are supplied.
- Read-only content remains focusable, selectable, and copyable.
- Reduced motion removes pool deformation while retaining focus, validation,
  and count information.

```tsx
<GummyTextarea
  label="Project summary"
  name="summary"
  description="Help collaborators understand the outcome."
  maxLength={180}
  showCount
/>
```

## Checkbox

### Anatomy

1. Native checkbox input covering a 44px target.
2. Compact connected fruit-glass indicator.
3. Visible checked mark or mixed-state bar.
4. Label, description, and optional validation message.

### API

`GummyCheckbox` preserves native checkbox props except `type`, `size`, and
`children`.

| Prop | Type | Default | Purpose |
|---|---|---:|---|
| `label` | `ReactNode` | required | Visible checkbox label. |
| `description` | `ReactNode` | — | Associated supporting copy. |
| `errorMessage` | `ReactNode` | — | Invalid feedback and alert. |
| `indeterminate` | `boolean` | `false` | Sets the native indeterminate property and `aria-checked="mixed"`. |
| `readOnly` | `boolean` | `false` | Keeps the checkbox focusable while blocking pointer and keyboard changes. |
| `onCheckedChange` | `(boolean \| "indeterminate") => void` | — | Convenience callback for accepted state changes. |
| `wrapperClassName` | `string` | — | Styles the outer composition. |

### Accessibility and behavior

- Pointer or label activation and Space use native checkbox behavior.
- Disabled checkboxes are removed from the tab order by the browser.
- Read-only is an explicit Gummy extension because HTML checkboxes do not have
  native read-only behavior. It sets `aria-readonly`, prevents activation, and
  remains focusable so the current state can be inspected.
- Indeterminate is a presentation and accessibility state; application code
  decides what the next checked value should be.
- A visible check or mixed bar ensures state does not depend on lime colour.

Use Checkbox for independent choices or multi-selection. Use Switch for a
setting that takes effect immediately.

```tsx
<GummyCheckbox
  label="Weekly delivery digest"
  description="One calm summary every Friday."
  defaultChecked
/>
```

## Radio Group

### Anatomy

1. Native `fieldset` root.
2. Visible `legend` and optional group description.
3. Same-name native radio inputs with 44px targets.
4. Connected indicators, stable item labels, and optional item descriptions.
5. Group-level validation message.

### API

`GummyRadioGroup` supports controlled and uncontrolled selection.

| Group prop | Type | Default | Purpose |
|---|---|---:|---|
| `label` | `ReactNode` | required | Native legend content. |
| `description` | `ReactNode` | — | Group instructions. |
| `errorMessage` | `ReactNode` | — | Group invalid state and alert. |
| `value` | `string` | — | Controlled selected value. |
| `defaultValue` | `string` | — | Initial uncontrolled value. |
| `onValueChange` | `(value: string) => void` | — | Runs after an accepted selection. |
| `orientation` | `"vertical" \| "horizontal"` | `"vertical"` | Item layout. Horizontal wraps and becomes vertical on small screens. |
| `required` | `boolean` | `false` | Applies the native group constraint to items. |
| `disabled` | `boolean` | `false` | Uses native fieldset disabling. |
| `readOnly` | `boolean` | `false` | Keeps items focusable while preventing selection changes. |

| Item prop | Type | Purpose |
|---|---|---|
| `value` | `string` | Required submitted and selected value. |
| `label` | `ReactNode` | Visible option label. |
| `description` | `ReactNode` | Option-specific supporting copy. |
| `disabled` | `boolean` | Disables one item in an enabled group. |

### Accessibility and keyboard behavior

- Tab enters the selected item, or the first available item when no option is
  selected.
- Arrow Up and Arrow Down move and select the previous or next enabled option.
- Arrow Left and Arrow Right also move selection; horizontal direction reverses
  in RTL.
- Home and End move to the first and last enabled options.
- Space selects the focused option through native radio behavior.
- Required validation, disabled fieldsets, labels, descriptions, and submitted
  values remain native.

```tsx
<GummyRadioGroup
  label="Default visibility"
  name="visibility"
  defaultValue="team"
  orientation="horizontal"
>
  <GummyRadioItem value="team" label="Team only" />
  <GummyRadioItem value="invite" label="Invite only" />
  <GummyRadioItem value="public" label="Public" />
</GummyRadioGroup>
```

## Native Select

### Anatomy

1. Gummy Label.
2. Connected shell and stable select plane.
3. Native single-value `select`.
4. Chevron inside the attached inline-end reservoir.
5. Description and error or success feedback.

### API

`GummyNativeSelect` preserves native single-select props. `multiple` and `size`
are intentionally excluded because their platform anatomy requires a separate
listbox presentation.

| Prop | Type | Default | Purpose |
|---|---|---:|---|
| `label` | `ReactNode` | required | Visible associated label. |
| `children` | `ReactNode` | required | Native `option` and `optgroup` children. |
| `description` | `ReactNode` | — | Supporting copy. |
| `errorMessage` | `ReactNode` | — | Invalid feedback and alert. |
| `successMessage` | `ReactNode` | — | Positive confirmation. |
| `optional` | `boolean` | `false` | Shows an optional cue. |
| `readOnly` | `boolean` | `false` | Keeps the value focusable while blocking pointer and keyboard changes. |
| `wrapperClassName` | `string` | — | Styles the outer composition. |

### Accessibility and behavior

- Pointer, touch, platform picker, typing, and arrow behavior stay native.
- The decorative chevron is hidden from assistive technology and never replaces
  the platform control.
- Read-only is a Gummy extension because HTML select has no native read-only
  state. It exposes `aria-readonly`, prevents opening or keyboard selection,
  and retains focusability.
- Use a disabled placeholder option plus `required` for a mandatory prompt.
- Use Native Select for compact text-only choices. Prefer Radio Group when all
  options should remain visible and a custom Select when options need rich
  descriptions, icons, or search.

```tsx
<GummyNativeSelect
  label="Data region"
  name="region"
  defaultValue=""
  required
  description="New project data is stored here."
>
  <option value="" disabled>Choose a region</option>
  <option value="eu">Europe · London</option>
  <option value="us">United States · Virginia</option>
</GummyNativeSelect>
```

## Shared states and quality guidance

- **Default and hover:** the stable plane remains dominant; fine-pointer hover
  lightly redistributes the connected pool.
- **Keyboard focus:** aqua moves inside the shell or indicator and a soft halo
  reinforces shape without a hard exterior keyline.
- **Active and selected:** compact controls squash and rebound quickly. Checked
  states also have visible marks.
- **Validation:** raspberry material is paired with an icon or mark and readable
  associated text. Error takes precedence over success.
- **Disabled:** native disabled behavior is used wherever HTML supports it.
- **Read only:** values remain focusable and inspectable but cannot change.
- **Dense content:** fixed indicators and reservoirs do not shrink or stretch;
  flexible copy wraps.
- **Responsive and RTL:** layouts use logical properties, horizontal
  compositions reflow, and inline-end reservoirs mirror without changing DOM
  order.
- **Dark theme:** stable text and editing planes maintain contrast while
  transmitted fruit colour remains recognisable.
- **Reduced motion:** deformation and check drawing are removed without hiding
  state.

Focus restoration is not applicable to this group because none of the six
components opens an overlay or transfers focus into a temporary surface.
