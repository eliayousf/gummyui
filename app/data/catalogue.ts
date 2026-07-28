export const catalogueGroups = [
  { id: "foundation", label: "Foundations", description: "Type, direction, separation, loading, and media primitives." },
  { id: "form", label: "Forms and selection", description: "Native and custom controls with stable labels, values, and validation." },
  { id: "display", label: "Display and feedback", description: "Status, identity, progress, empty states, and composed content." },
  { id: "navigation", label: "Navigation and disclosure", description: "Hierarchy, paging, menus, sidebars, and collapsible structure." },
  { id: "overlay", label: "Overlays", description: "Focus-managed modal and non-modal surfaces." },
  { id: "composite", label: "Composite inputs", description: "Dense pickers, filtering, commands, dates, and one-time codes." },
  { id: "data", label: "Data and utilities", description: "Tables, carousels, resizing, scrolling, and notifications." },
] as const;

export type CatalogueGroupId = (typeof catalogueGroups)[number]["id"];

export type ComponentDefinition = {
  name: string;
  slug: string;
  group: CatalogueGroupId;
  description: string;
  source: string;
  registryName: string;
  registryUrl: string;
  installCommand: string;
  radixRegistryName?: string;
  radixRegistryUrl?: string;
  radixInstallCommand?: string;
  radixDependency?: string;
  semantics: string;
  keyboard: string;
  dependencies: readonly string[];
  status: "stable";
  license: "MIT";
};

const radixDependencyBySlug: Readonly<Record<string, string>> = {
  accordion: "@radix-ui/react-accordion",
  "alert-dialog": "@radix-ui/react-alert-dialog",
  collapsible: "@radix-ui/react-collapsible",
  "context-menu": "@radix-ui/react-context-menu",
  dialog: "@radix-ui/react-dialog",
  direction: "@radix-ui/react-direction",
  drawer: "@radix-ui/react-dialog",
  "dropdown-menu": "@radix-ui/react-dropdown-menu",
  "hover-card": "@radix-ui/react-hover-card",
  menubar: "@radix-ui/react-menubar",
  "navigation-menu": "@radix-ui/react-navigation-menu",
  popover: "@radix-ui/react-popover",
  "scroll-area": "@radix-ui/react-scroll-area",
  select: "@radix-ui/react-select",
  sheet: "@radix-ui/react-dialog",
  slider: "@radix-ui/react-slider",
  sonner: "@radix-ui/react-toast",
  switch: "@radix-ui/react-switch",
  tabs: "@radix-ui/react-tabs",
  toggle: "@radix-ui/react-toggle",
  "toggle-group": "@radix-ui/react-toggle-group",
  tooltip: "@radix-ui/react-tooltip",
};

function component(
  name: string,
  slug: string,
  source: string,
  group: CatalogueGroupId,
  description: string,
  semantics: string,
  keyboard: string,
  dependencies: readonly string[] = [],
): ComponentDefinition {
  const registryName = `gummy-${slug}`;
  const registryUrl = `https://gummyui.dev/r/${registryName}.json`;
  const radixDependency = radixDependencyBySlug[slug];
  const radixRegistryName = radixDependency
    ? `gummy-radix-${slug}`
    : undefined;
  const radixRegistryUrl = radixRegistryName
    ? `https://gummyui.dev/r/${radixRegistryName}.json`
    : undefined;
  return {
    name,
    slug,
    group,
    description,
    source: `app/components/ui/${source}.tsx`,
    registryName,
    registryUrl,
    installCommand: `npx shadcn@latest add ${registryUrl}`,
    ...(radixRegistryName && radixRegistryUrl
      ? {
          radixRegistryName,
          radixRegistryUrl,
          radixInstallCommand: `npx shadcn@latest add ${radixRegistryUrl}`,
          radixDependency,
        }
      : {}),
    semantics,
    keyboard,
    dependencies,
    status: "stable",
    license: "MIT",
  };
}

export const components: readonly ComponentDefinition[] = [
  component("Accordion", "accordion", "GummyAccordion", "navigation", "Vertically stacked disclosure sections with coordinated open state.", "Base UI headings, buttons, regions, and explicit relationships.", "Tab reaches every trigger; Enter or Space toggles a section.", ["@base-ui/react"]),
  component("Alert", "alert", "GummyAlert", "display", "Static or live feedback with a restrained status reservoir.", "Passive content by default; optional status or alert live-region behavior.", "No component-specific keys."),
  component("Alert Dialog", "alert-dialog", "GummyAlertDialog", "overlay", "A modal confirmation surface for consequential decisions.", "Base UI alertdialog with title, description, containment, and restoration.", "Tab is contained; Escape closes when the workflow permits.", ["@base-ui/react"]),
  component("Aspect Ratio", "aspect-ratio", "GummyAspectRatio", "foundation", "A predictable media frame that preserves a numeric ratio.", "A styled div with intrinsic aspect-ratio behavior.", "No component-specific keys."),
  component("Avatar", "avatar", "GummyAvatar", "display", "Image, fallback, group, and named presence status.", "Images retain alt text; fallbacks and status names remain explicit.", "No component-specific keys."),
  component("Badge", "badge", "GummyBadge", "display", "A non-interactive semantic label in solid or translucent fruit material.", "A span; decorative dots and icons are hidden from assistive technology.", "No component-specific keys."),
  component("Breadcrumb", "breadcrumb", "GummyBreadcrumb", "navigation", "Hierarchy navigation with current-page and collapsed-path parts.", "A labelled nav containing an ordered list and aria-current page.", "Native link behavior."),
  component("Button", "button", "GummyButton", "form", "The approved fruit-gel action with chewy press physics.", "A native button with variant, size, finish, loading, and disabled states.", "Enter and Space activate the native button."),
  component("Button Group", "button-group", "GummyButtonGroup", "form", "Related native buttons joined by quiet shared material.", "A labelled group with real buttons and optional separators or text.", "Tab reaches each enabled button."),
  component("Calendar", "calendar", "GummyCalendar", "composite", "A locale-aware single-date grid with month navigation and constraints.", "Labelled grid, rows, column headers, and gridcell buttons.", "Arrows move by day or week; Home/End use week edges; Page keys move month or year."),
  component("Card", "card", "GummyCard", "display", "Passive, link, and button surfaces held in one continuous gel-pocket frame.", "Separate article, anchor, and button roots prevent false interactivity.", "Native link or button behavior on interactive roots."),
  component("Carousel", "carousel", "GummyCarousel", "data", "Controlled or uncontrolled labelled slides with finite or looping movement.", "A labelled carousel region containing inert inactive slide groups.", "Logical arrows move; Home and End jump to the first or last slide."),
  component("Checkbox", "checkbox", "GummyCheckbox", "form", "A native checkbox with mixed, validation, disabled, and read-only states.", "A real checkbox inside a labelled 44px target.", "Space toggles; read-only remains focusable without changing."),
  component("Collapsible", "collapsible", "GummyCollapsible", "navigation", "One trigger and panel for optional supporting content.", "Base UI button and region with expanded-state relationships.", "Enter or Space toggles the panel.", ["@base-ui/react"]),
  component("Combobox", "combobox", "GummyCombobox", "composite", "An editable option picker with filtering and collision-aware popup.", "Base UI combobox, listbox, options, empty state, and form value.", "Typing filters; arrows move options; Enter selects; Escape closes.", ["@base-ui/react"]),
  component("Command", "command", "GummyCommand", "composite", "A filterable grouped action surface with decorative shortcuts.", "A labelled combobox controls a grouped listbox of action options.", "Arrows, Home, and End move focus; Enter or Space activates."),
  component("Context Menu", "context-menu", "GummyContextMenu", "navigation", "Secondary commands opened by context click, keyboard, or long press.", "Base UI menu semantics with roving focus and restoration.", "Context-menu key or Shift+F10 opens; arrows and typeahead navigate.", ["@base-ui/react"]),
  component("Data Table", "data-table", "GummyDataTable", "data", "A generic typed table with filtering, sorting, paging, and selection.", "Native table relationships, aria-sort, named checkboxes, and live result count.", "Tab reaches filter, sortable headers, selection, and page controls."),
  component("Date Picker", "date-picker", "GummyDatePicker", "composite", "A formatted trigger composing Gummy Popover and Calendar.", "A labelled trigger opens a focus-managed calendar surface.", "Popover and Calendar keyboard contracts compose.", ["gummy-calendar", "gummy-popover"]),
  component("Dialog", "dialog", "GummyDialog", "overlay", "A modal reading plane with responsive focus containment.", "Base UI dialog with title, description, backdrop, viewport, and restoration.", "Tab is contained; Escape dismisses.", ["@base-ui/react"]),
  component("Direction", "direction", "GummyDirection", "foundation", "A scoped native direction boundary aligned with Base UI behavior.", "A div dir attribute wraps Base UI Direction Provider.", "Horizontal component keys follow the scoped reading direction.", ["@base-ui/react"]),
  component("Drawer", "drawer", "GummyDrawer", "overlay", "A mobile-first bottom task surface built on modal dialog behavior.", "Base UI dialog semantics in a bottom-edge layout.", "Tab is contained; Escape closes and restores focus.", ["@base-ui/react"]),
  component("Dropdown Menu", "dropdown-menu", "GummyDropdownMenu", "navigation", "Compact commands with typeahead, submenus, and selection items.", "Base UI menu, menuitem, checkbox, radio, separator, and group semantics.", "Arrows and typeahead navigate; Enter selects; Escape closes.", ["@base-ui/react"]),
  component("Empty", "empty", "GummyEmpty", "display", "A structured zero-state with media, title, description, and actions.", "Passive content structure; actions remain explicit native controls.", "Only nested actions are focusable."),
  component("Field", "field", "GummyField", "form", "One labelled control with descriptions, validation, and layout state.", "Generated IDs associate label, description, and alert feedback.", "Follows the composed control."),
  component("Hover Card", "hover-card", "GummyHoverCard", "overlay", "A supporting preview for a focused or hovered link.", "A Base UI tooltip-derived non-modal popup with hoverable content.", "Focus opens; Escape closes without trapping.", ["@base-ui/react"]),
  component("Input", "input", "GummyInput", "form", "A native single-line field with descriptions, adornments, and feedback.", "Visible label and generated described-by/error relationships.", "Native input editing and selection."),
  component("Input Group", "input-group", "GummyInputGroup", "composite", "Native input, addons, and real button actions in one shell.", "Addons stay presentational; inputs and buttons keep native semantics.", "Native control and button behavior."),
  component("Input OTP", "input-otp", "GummyInputOTP", "composite", "Four to eight numeric slots with paste distribution and form value.", "A labelled group of named digit inputs plus optional hidden form field.", "Digits advance; Backspace moves back; arrows move between slots."),
  component("Item", "item", "GummyItem", "display", "A dense passive, link, or button row with media, copy, and actions.", "Distinct div, anchor, and button roots preserve honest semantics.", "Native link or button behavior on interactive roots."),
  component("Kbd", "kbd", "GummyKbd", "foundation", "Keyboard notation for shortcuts and key sequences.", "Native kbd elements with an optional labelled group.", "No component-specific keys."),
  component("Label", "label", "GummyLabel", "form", "A native label with required, optional, disabled, and read-only cues.", "A real label targets one form control.", "Click moves focus through native label behavior."),
  component("Menubar", "menubar", "GummyMenubar", "navigation", "Coordinated application command menus with compact scanning.", "Base UI menubar and menuitem relationships.", "Horizontal arrows move menus; vertical arrows and typeahead navigate commands.", ["@base-ui/react"]),
  component("Native Select", "native-select", "GummyNativeSelect", "form", "The platform single-select picker with Gummy shell and read-only extension.", "A labelled native select with described-by and validation relationships.", "Native platform select behavior."),
  component("Navigation Menu", "navigation-menu", "GummyNavigationMenu", "navigation", "Site discovery links arranged in a shared responsive popup viewport.", "Base UI navigation menu with crawlable anchors.", "Tab and arrows reach triggers and links; Escape closes.", ["@base-ui/react"]),
  component("Pagination", "pagination", "GummyPagination", "navigation", "Current-page navigation with previous, next, and ellipsis parts.", "A labelled nav with list links and aria-current.", "Native link behavior."),
  component("Popover", "popover", "GummyPopover", "overlay", "A non-modal contextual surface with title, description, and close parts.", "Base UI popover positioning, dismissal, and focus restoration.", "Tab enters content; Escape closes.", ["@base-ui/react"]),
  component("Progress", "progress", "GummyProgress", "display", "Determinate or indeterminate task progress with a visible label.", "A native progress element and explicit label/value copy.", "No component-specific keys."),
  component("Radio Group", "radio-group", "GummyRadioGroup", "form", "A native fieldset of same-name radios with controlled state and RTL.", "Fieldset, legend, native radio inputs, and validation relationships.", "Arrows move selection; Home/End jump; Space selects."),
  component("Resizable", "resizable", "GummyResizable", "data", "A bounded two-panel split with pointer and keyboard control.", "A focusable separator exposes orientation and current/min/max values.", "Arrows resize; Shift accelerates; Home/End use the bounds."),
  component("Scroll Area", "scroll-area", "GummyScrollArea", "data", "A native scroll viewport with custom overflow-only scrollbars.", "Base UI native viewport, content, scrollbar, thumb, and corner.", "Tab focuses the viewport; browser scrolling remains native.", ["@base-ui/react"]),
  component("Select", "select", "GummySelect", "composite", "A non-editable custom picker for richer option content.", "Base UI combobox trigger, listbox options, and hidden form input.", "Arrows and typeahead move; Enter selects; Escape closes.", ["@base-ui/react"]),
  component("Separator", "separator", "GummySeparator", "foundation", "A quiet horizontal or vertical divider with decorative or semantic mode.", "A div with optional separator role and orientation.", "No component-specific keys."),
  component("Sheet", "sheet", "GummySheet", "overlay", "A modal side workflow with configurable logical edge.", "Base UI dialog semantics in a side-edge layout.", "Tab is contained; Escape closes and restores focus.", ["@base-ui/react"]),
  component("Sidebar", "sidebar", "GummySidebar", "navigation", "A controlled workspace shell with responsive navigation panel and inset.", "Aside, labelled nav lists, current-page links, and primary inset.", "Tab follows native controls and links; trigger toggles the panel."),
  component("Skeleton", "skeleton", "GummySkeleton", "foundation", "A decorative loading placeholder with reduced-motion fallback.", "Hidden from assistive technology; real loading state belongs on the region.", "No component-specific keys."),
  component("Slider", "slider", "GummySlider", "form", "Single or range numeric selection on a touch-safe track.", "Base UI slider values, thumbs, label, and form integration.", "Arrows adjust; Page keys step faster; Home/End use bounds.", ["@base-ui/react"]),
  component("Sonner", "sonner", "GummySonner", "data", "Polite or urgent toast workflows with actions, promises, and swipe dismissal.", "Base UI notification region and non-modal toast dialogs.", "Focus interaction pauses timeout; action and close remain native buttons.", ["@base-ui/react"]),
  component("Spinner", "spinner", "GummySpinner", "foundation", "A compact named loading indicator with reduced-motion state.", "Status semantics are opt-in through the visible or accessible label.", "No component-specific keys."),
  component("Switch", "switch", "GummySwitch", "form", "A binary Base UI control with one connected track and gel thumb.", "A labelled switch with optional description and native form state.", "Space toggles.", ["@base-ui/react"]),
  component("Table", "table", "GummyTable", "data", "Composable native table sections, captions, rows, headers, and cells.", "Unmodified table accessibility relationships and scoped headers.", "Native table navigation follows the browser and assistive technology."),
  component("Tabs", "tabs", "GummyTabs", "navigation", "One shared selection rail coordinating labelled tab panels.", "Base UI tablist, tabs, panels, and selected relationships.", "Arrows move; Home/End jump; activation may be automatic or manual.", ["@base-ui/react"]),
  component("Textarea", "textarea", "GummyTextarea", "form", "A native multiline field with validation, resizing, and live count.", "Visible label, native textarea, described-by, alerts, and optional status.", "Native multiline editing."),
  component("Toggle", "toggle", "GummyToggle", "form", "A pressed-state button for one independent option.", "Base UI toggle renders a button with aria-pressed.", "Enter or Space toggles.", ["@base-ui/react"]),
  component("Toggle Group", "toggle-group", "GummyToggleGroup", "form", "Single or multiple pressed choices coordinated as a labelled group.", "Base UI group of toggle buttons with orientation.", "Tab reaches items; arrows move within the group.", ["@base-ui/react"]),
  component("Tooltip", "tooltip", "GummyTooltip", "overlay", "A short descriptive popup with shared delay and collision handling.", "Base UI tooltip semantics and described-by relationship.", "Focus opens; Escape closes.", ["@base-ui/react"]),
  component("Typography", "typography", "GummyTypography", "foundation", "Headings, text, eyebrow, blockquote, and inline-code foundations.", "Native text elements preserve the requested document hierarchy.", "No component-specific keys."),
] as const;

const slugs = new Set(components.map(({ slug }) => slug));
if (components.length !== 57 || slugs.size !== components.length) {
  throw new Error("The public component catalogue must contain exactly 57 unique entries.");
}

export const componentCount = components.length;

export function getComponent(slug: string) {
  return components.find((entry) => entry.slug === slug);
}

export function getComponentsByGroup(group: CatalogueGroupId) {
  return components.filter((entry) => entry.group === group);
}
