# Stage 3 selection controls

Button Group, Slider, Toggle, and Toggle Group are the fifth Stage 3 dependency
group.

## Installation

```sh
npx shadcn@latest add \
  https://gummyui.dev/r/gummy-button-group.json \
  https://gummyui.dev/r/gummy-slider.json \
  https://gummyui.dev/r/gummy-toggle.json \
  https://gummyui.dev/r/gummy-toggle-group.json
```

## Button Group

`GummyButtonGroup` gives related Buttons one accessible group name and
horizontal or vertical layout. It does not clone or alter Button semantics.
`attached` controls visual edge joining; `GummyButtonGroupSeparator` is
decorative and `GummyButtonGroupText` carries compact non-interactive context.

Use separate Buttons for separate actions. Use Toggle Group when the controls
represent mutually exclusive or multiple pressed state.

## Slider

Slider wraps Base UI Root, Label, Value, Control, and Thumb. Control supplies the
track and indicator automatically. Root supports single numbers and numeric
ranges, controlled and uncontrolled values, min/max/step, form names, locale
formatting, horizontal or vertical orientation, RTL, pointer drag, touch, arrow
keys, Home/End, Page Up/Down, and value-commit callbacks.

Each range Thumb needs a distinct accessible label, such as “Minimum price” and
“Maximum price”. Visible Label names a single-value Slider.

## Toggle

Toggle is a Base UI two-state button with native `aria-pressed`. It supports
controlled `pressed`, uncontrolled `defaultPressed`, disabled state, and
`onPressedChange`. Quiet and fruit variants share the same behaviour.

Use Toggle for a mode or tool that can remain pressed. Use Switch for a setting
that takes effect immediately and Checkbox for a form choice.

## Toggle Group

`GummyToggleGroup` requires a group `label`. Every Item requires a unique
`value`. The group supports single selection by default, multiple selection
with `multiple`, controlled/uncontrolled arrays, horizontal/vertical
orientation, disabled state, loop policy, and RTL-aware arrow focus.

Selection remains visible through `aria-pressed`, shape, internal material, and
stable text—not colour alone.

## Verification

Coverage includes group naming, canonical Button activation, single and range
Slider keyboard changes, pressed-state callbacks, single/multiple Toggle Group
selection, arrow focus, disabled state, form-native Slider semantics, 44px
targets, axe, themes, RTL, responsive layout, reduced motion, registry copying,
and isolated TypeScript compilation.
