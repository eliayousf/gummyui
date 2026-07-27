# Stage 3 data and utility systems

Carousel, Data Table, Direction, Resizable, Scroll Area, Table, and Sonner form
the ninth and final Stage 3 dependency group. Together with the approved
benchmarks and earlier groups, they complete all 57 launch component
categories.

## Installation

```sh
npx shadcn@latest add \
  https://gummyui.dev/r/gummy-carousel.json \
  https://gummyui.dev/r/gummy-data-table.json \
  https://gummyui.dev/r/gummy-direction.json \
  https://gummyui.dev/r/gummy-resizable.json \
  https://gummyui.dev/r/gummy-scroll-area.json \
  https://gummyui.dev/r/gummy-table.json \
  https://gummyui.dev/r/gummy-sonner.json
```

Data Table declares Table as a registry dependency. Direction, Scroll Area,
and Sonner install Base UI.

## Carousel

Carousel supports controlled and uncontrolled indices, finite or looping
movement, horizontal or vertical orientation, and scoped direction. The root
is a labelled carousel region; each item is a labelled slide. Previous, next,
and indicator buttons remain native controls. The focusable viewport supports
logical arrow keys plus Home and End. Inactive slides are inert and hidden
from the accessibility tree rather than exposing unreachable controls.

`itemCount` and every item `index` must describe the same zero-based sequence.
Do not auto-advance content unless users can pause it and the motion is
justified by the product task.

## Table and Data Table

Table is a thin native-semantic layer: caption, header, body, footer, row,
column header, and data cell. A responsive wrapper supplies horizontal
overflow without changing the table accessibility tree.

Data Table adds generic typed columns and rows, a visible filter, stable
sorting, page controls, optional row selection, a live result count, controlled
selection, and empty state. Sort state is communicated with `aria-sort`; every
selection checkbox receives a row-specific name. Column cell renderers stay
presentational while `sortValue` and `filterValue` provide stable data
behaviour.

For virtualized or server-paginated datasets, keep the same public column and
selection contracts but move filtering, sorting, and pagination to the data
source.

## Direction and Resizable

Direction supplies both a native `dir` boundary and Base UI Direction Provider.
This keeps browser layout, component geometry, and keyboard meaning aligned.
Prefer one document-level direction and use scoped Direction only for genuine
mixed-direction examples or embedded products.

Resizable exposes a two-panel group, first and second panels, and a focusable
separator. Pointer movement updates the split percentage. Arrow keys move by
the configured step, Shift moves by five steps, and Home or End use the minimum
or maximum. Horizontal arrow meaning follows RTL. Controlled and uncontrolled
sizes are clamped to explicit bounds.

## Scroll Area

Scroll Area keeps the Base UI native viewport and adds styled vertical or
horizontal scrollbars only when overflow exists. The viewport is keyboard
focusable and should receive an accessible name when its surrounding heading
does not already identify the content. Touch and wheel scrolling stay native.

## Sonner

Sonner is the Gummy toast interface built on Base UI Toast. The provider
supports timeout and stack limits; `useGummyToast` exposes add, close, update,
and promise workflows; Toaster supports four corners. Base UI supplies polite
or urgent announcement priority, focus interaction, timeout pausing, action
buttons, and swipe dismissal.

Use toasts for confirmation and peripheral status. Validation and blocking
errors must remain next to the affected control or inside the relevant modal
workflow.

## Verification

Coverage includes Carousel controls and keyboard movement, typed Data Table
filtering/sorting/pagination/selection, native Table relationships, scoped
direction, Resizable separator values and RTL keys, focusable Scroll Area,
Sonner creation and dismissal, axe, logical CSS, reduced motion, registry
dependency copying, public ref forwarding, and isolated TypeScript
compilation.
