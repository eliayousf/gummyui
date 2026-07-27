# Stage 3 composite inputs

Calendar, Combobox, Command, Date Picker, Input Group, Input OTP, and Select
form the eighth Stage 3 dependency group.

## Installation

```sh
npx shadcn@latest add \
  https://gummyui.dev/r/gummy-calendar.json \
  https://gummyui.dev/r/gummy-combobox.json \
  https://gummyui.dev/r/gummy-command.json \
  https://gummyui.dev/r/gummy-date-picker.json \
  https://gummyui.dev/r/gummy-input-group.json \
  https://gummyui.dev/r/gummy-input-otp.json \
  https://gummyui.dev/r/gummy-select.json
```

Date Picker declares Calendar and Popover as registry dependencies. Combobox
and Select use Base UI and install it as a package dependency.

## Calendar and Date Picker

Calendar renders a labelled `grid` with one native button per date. Arrow keys
move by day or week, Home and End move to the week edges, Page Up and Page Down
move by month, and Shift modifies those keys to move by year. Horizontal arrow
meaning follows the nearest RTL direction. `min`, `max`, `locale`, controlled
value, and controlled month are supported.

Date Picker composes Calendar inside Gummy Popover. Selection formats the
trigger text, closes the popup, and returns focus through the underlying Base
UI focus-management contract.

## Combobox, Command, and Select

Combobox is the editable option picker: it filters as the user types and uses
Base UI listbox focus, selection, empty state, typeahead, collision positioning,
and form behaviour.

Command is an application-action surface. It exposes a labelled combobox
input, listbox, labelled groups, options, separators, and decorative shortcuts.
Filtering is text based; Arrow keys, Home, End, Enter, and Space provide the
non-pointer path. Commands must remain actions rather than navigation disguised
as options.

Select is the non-editable custom picker. It uses a combobox trigger and Base
UI listbox popup with roving focus, typeahead, option groups, scroll arrows,
controlled state, and hidden native form input. Prefer Native Select unless
custom content or behaviour materially helps the task.

## Input Group and Input OTP

Input Group visually composes native inputs, quiet addons, and explicit button
actions in one focus-responsive shell. Addons never replace a visible label or
`aria-label`.

Input OTP accepts four to eight numeric slots, distributes pasted digits,
moves focus forward, supports backward deletion, emits a controlled value, and
can provide one hidden form field. Digit order stays LTR inside RTL documents,
while its group label and surrounding layout remain logical.

## Verification

Coverage includes controlled and uncontrolled selection, Calendar grid
movement, locale-formatted names, Base UI filtering and option selection,
Command filtering and activation, Date Picker closure, native Input Group
editing, OTP paste and hidden values, axe, reduced motion, RTL, registry
dependency copying, public ref forwarding, and isolated TypeScript
compilation.
