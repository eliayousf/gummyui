# Stage 3 navigation systems

Context Menu, Menubar, Navigation Menu, and Sidebar are the seventh Stage 3
dependency group.

## Installation

```sh
npx shadcn@latest add \
  https://gummyui.dev/r/gummy-context-menu.json \
  https://gummyui.dev/r/gummy-menubar.json \
  https://gummyui.dev/r/gummy-navigation-menu.json \
  https://gummyui.dev/r/gummy-sidebar.json
```

## Context Menu

Context Menu uses Base UI for secondary click, keyboard opening, touch
long-press, roving focus, typeahead, disabled items, Escape, and focus
restoration. The trigger must remain keyboard focusable when the same commands
are not available elsewhere. Critical actions should not exist only in a
context menu.

## Menubar

Menubar coordinates Base UI Menu roots into an application-command surface.
Triggers are menuitems with arrow focus. Open menus support typeahead, Home/End,
submenus, checkbox/radio items, Escape, and focus restoration. Use it for
editor-like commands, not ordinary website navigation.

## Navigation Menu

Navigation Menu uses real links inside Base UI content moved into a shared
viewport. It opens with pointer or keyboard, handles collision and focus, and
keeps link destinations crawlable. Use simple links when a popup adds no useful
hierarchy.

## Sidebar

Sidebar is a controlled or uncontrolled workspace layout:

- labelled `aside` panel;
- explicit expand/collapse trigger;
- header, scrollable content, footer, group and group-label slots;
- native list and link menu with current-page state; and
- a primary `main` inset.

At narrow widths the panel becomes an overlaid surface while the inset retains
layout priority. Applications should provide an always-visible trigger in the
inset header on mobile.

## Verification

Coverage includes Context Menu secondary click and focus entry, Menubar arrow
focus, Navigation Menu content/link transfer, Sidebar controlled-quality state
and current-page semantics, axe, focus-visible styles, 44px targets, RTL
logical edges, responsive panel behaviour, reduced motion, registry copying,
and isolated TypeScript compilation.
