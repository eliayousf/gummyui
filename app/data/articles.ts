export type ArticleLink = {
  href: string;
  label: string;
};

export type ArticleSection = {
  heading: string;
  paragraphs: readonly string[];
};

export type Article = {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  author: "Gummy UI";
  publishedAt: string;
  updatedAt: string;
  sections: readonly ArticleSection[];
  links: readonly ArticleLink[];
};

export const siteUrl = "https://gummyui.dev";

const launchPublicationDate = "2026-07-26";

export const articles = [
  {
    slug: "designing-the-gel-pop-language",
    title: "Designing the Gel Pop language",
    description:
      "A practical account of how Gummy UI turns transmitted colour, attached reservoirs, stable reading planes, and restrained motion into one interface material.",
    eyebrow: "Design language",
    author: "Gummy UI",
    publishedAt: launchPublicationDate,
    updatedAt: launchPublicationDate,
    sections: [
      {
        heading: "Start with material rules, not decoration",
        paragraphs: [
          "Gel Pop is the visual language used by the public Gummy UI components. Its defining ideas are transmitted fruit colour, saturated rims, slight internal clouding, narrow highlights that follow the geometry, and chromatic depth. Those ideas are constraints rather than a licence to attach a glossy blob to every rectangle. A component should still explain its purpose before its material becomes noticeable.",
          "The implementation therefore treats material as part of a component’s anatomy. A control may have a shell, a stable content plane, and a pressure reservoir joined to an edge. The reservoir grows from the functional silhouette instead of floating beside it. This distinction is visible in the canonical source and shared styles, where decorative layers remain hidden from assistive technology and never replace the native control.",
        ],
      },
      {
        heading: "Protect the reading plane",
        paragraphs: [
          "Translucency is useful around an edge because it carries colour and depth. It is much less useful directly behind a label, value, or long paragraph. Gummy UI keeps required text on stable light or dark surfaces and lets transmitted colour live around that plane. The result preserves the material idea without asking typography to compete with highlights, gradients, or background content.",
          "This separation also makes themes easier to reason about. Canvas, surface, ink, focus, and fruit families are semantic tokens rather than colours copied into individual components. Dark mode can change the relationship between the canvas and local material while the text plane remains predictable. The theme page exposes those tokens as a browser-local tool, so experimentation does not require a customer account or remote data store.",
        ],
      },
      {
        heading: "Give motion a job",
        paragraphs: [
          "The motion vocabulary is deliberately small: press, settle, a short reservoir response, and restrained loading movement. It should confirm activation or state change, not keep the page moving after the user has finished. Shared reduced-motion rules remove travel, squash, and rotation while preserving visible focus, selection, validation, and loading status.",
          "A useful review question is whether the same component remains understandable when every decorative transition is removed. If the answer is no, animation is carrying information that belongs in semantics or static state styling. The public Component Lab makes this comparison possible alongside default, focus, disabled, dark, responsive, and RTL specimens.",
        ],
      },
      {
        heading: "Review the whole silhouette",
        paragraphs: [
          "Material continuity is easiest to judge at component boundaries. Highlights should follow the shape, shadows should remain chromatic and local, and reservoirs should not create false controls. Dense compositions need even more restraint because repeated glossy surfaces can erase hierarchy. Gummy UI uses stronger material for actions and state, then quieter surfaces for reading and grouping.",
          "The result is not a universal recipe for every product. It is the implemented direction of this component system, documented so contributors can make consistent choices. The design-direction record, theme tool, and canonical catalogue provide three different views of the same rules: intent, tokens, and working source.",
        ],
      },
    ],
    links: [
      { href: "/themes", label: "Explore the browser-local theme tool" },
      { href: "/components/lab", label: "Inspect canonical states in the Component Lab" },
      { href: "/docs", label: "Read the public documentation" },
    ],
  },
  {
    slug: "semantics-before-surface",
    title: "Semantics before surface",
    description:
      "How Gummy UI keeps native HTML or Base UI behavior in charge while adding editable React source, forwarded refs, and Gel Pop visual anatomy.",
    eyebrow: "Component architecture",
    author: "Gummy UI",
    publishedAt: launchPublicationDate,
    updatedAt: launchPublicationDate,
    sections: [
      {
        heading: "Choose the behavior owner first",
        paragraphs: [
          "A visual component begins with a behavior decision. When HTML already provides the required interaction, Gummy UI keeps the native element: buttons submit, inputs participate in forms, labels connect to controls, and links navigate. When an interaction needs coordinated focus, roving navigation, collision positioning, or modal behavior, the implementation uses the corresponding Base UI primitive instead of rebuilding that behavior in decorative markup.",
          "This decision is visible in the catalogue’s semantics and keyboard fields. A component detail page does not merely show a picture; it identifies the element or primitive that owns the interaction. That record helps reviewers distinguish a visual variant from a behavioral change and keeps styling work from quietly replacing a proven input model.",
        ],
      },
      {
        heading: "Keep public refs and native props useful",
        paragraphs: [
          "Canonical components forward their public refs to the element or primitive root that a consumer needs to focus, measure, or integrate with a form. Props are composed from the underlying React or Base UI types where practical. This preserves familiar attributes such as names, values, disabled state, event handlers, and accessible names instead of hiding them behind an unrelated configuration object.",
          "The release verifier copies committed Next.js and Vite templates into fresh temporary projects, installs independent dependencies, and runs the real shadcn command against a local HTTP registry. npm, pnpm, Yarn, and Bun paths each type-check and production-build without importing from the website repository. The source viewer still lets a reader inspect the actual component before installation rather than relying on a generated prop table alone.",
        ],
      },
      {
        heading: "Make decoration silent",
        paragraphs: [
          "Gel shells, glints, pools, and SVG frame paths do not communicate the control’s name or state. They are marked as decorative so assistive technology follows the real input, button, heading, status, or relationship. Visible validation is paired with text and accessible state; a colour change or exclamation mark is not expected to carry the message on its own.",
          "The same rule applies to composition. An article card remains an article until it is intentionally rendered as an anchor or button. A clickable-looking surface is not implemented as a generic div with keyboard behavior bolted on later. Separate passive, link, and button roots make the interaction contract explicit in both the markup and TypeScript types.",
        ],
      },
      {
        heading: "Test behavior where it lives",
        paragraphs: [
          "Testing Library exercises the public components through roles, labels, focus, keyboard input, and state changes. Representative axe checks inspect rendered states in a DOM environment, while token-level checks cover selected stable colour pairs. These automated checks support the contract, but they do not replace browser, zoom, touch, or screen-reader review.",
          "The practical outcome is a review order: confirm the element, name, relationship, keyboard model, focus path, and form behavior first; then inspect theme, motion, and material. Surface work becomes safer when the behavioral foundation has an identified owner and an executable test.",
        ],
      },
    ],
    links: [
      { href: "/components", label: "Browse component behavior contracts" },
      { href: "/accessibility", label: "Review the accessibility status" },
      { href: "/registry", label: "Inspect the editable-source registry" },
    ],
  },
  {
    slug: "reading-a-gummy-registry-item",
    title: "Reading a Gummy registry item",
    description:
      "A field guide to Gummy UI’s public registry payloads, shared style dependencies, editable component files, and current installation verification.",
    eyebrow: "Registry guide",
    author: "Gummy UI",
    publishedAt: launchPublicationDate,
    updatedAt: launchPublicationDate,
    sections: [
      {
        heading: "The registry is a source delivery format",
        paragraphs: [
          "The local public application generates shadcn-compatible JSON payloads for the /r path. A component payload contains a name, type, title, description, dependency information, and one or more editable files. It is not a minified component package or a screenshot reference. The value of the format is that a consumer can read the TypeScript and CSS that will enter a project before deciding to use it.",
          "The canonical manifest currently describes 57 component entries and four shared material payloads. The generated JSON is derived from that manifest and the public source tree. Catalogue detail pages link to the relevant payload and show an install command, while the registry index explains the shared foundation.",
        ],
      },
      {
        heading: "Follow shared dependencies",
        paragraphs: [
          "Material is split into a base theme and focused shared style files so every component does not duplicate the same tokens and responsive rules. Registry dependencies point to public Gummy URLs such as the base theme, form styles, primitive styles, or core component material. Package dependencies are declared separately for components that use Base UI.",
          "This graph matters during review. A component source file may look intentionally small because its states are expressed in a shared stylesheet. Reading only the TSX can miss theme, RTL, touch-target, or reduced-motion behavior; reading only the CSS can miss the native element or primitive that owns interaction. The payload connects those parts without exposing website-only composition styles.",
        ],
      },
      {
        heading: "Understand what verification proves",
        paragraphs: [
          "The current registry verifier checks schema identity, duplicate names and targets, required metadata, public registry dependency URLs, and the presence of every catalogue item. It copies the declared files into an isolated temporary directory and type-checks all canonical component sources. It also checks selected shared styles for RTL, reduced-motion, and separation from website selectors.",
          "That evidence proves that the manifest’s files are readable, copyable, and type-safe against the local dependency set. It does not yet prove every package-manager command in a freshly generated Next.js or Vite application. The project documentation keeps that distinction explicit so a temporary fixture is not mistaken for the complete clean-consumer launch gate.",
        ],
      },
      {
        heading: "Review before copying",
        paragraphs: [
          "Start at a component detail page, read its semantics and keyboard notes, then open the registry JSON. Check whether the payload adds a package dependency and which shared material files it resolves. After installation, keep the source editable and preserve the underlying behavior when adapting visual tokens or composition.",
          "If a component change affects public props, semantics, shared styles, or dependency relationships, its manifest, generated payload, documentation, tests, and changelog should move together. That keeps the delivery format aligned with the source rather than turning the registry into a stale export.",
        ],
      },
    ],
    links: [
      { href: "/registry", label: "Open the registry index" },
      { href: "/components", label: "Choose a component payload" },
      { href: "/docs", label: "Read installation and anatomy guidance" },
    ],
  },
  {
    slug: "one-catalogue-fifty-seven-components",
    title: "One catalogue, 57 component categories",
    description:
      "Why Gummy UI derives its public component count, routes, source links, and registry names from a single catalogue instead of maintaining parallel claims.",
    eyebrow: "Catalogue integrity",
    author: "Gummy UI",
    publishedAt: launchPublicationDate,
    updatedAt: launchPublicationDate,
    sections: [
      {
        heading: "Counts should be computed, not remembered",
        paragraphs: [
          "The public catalogue is a TypeScript data source containing 57 unique component definitions. Each entry records a slug, display name, group, description, source path, registry name, dependencies, semantics, and keyboard contract. The exported component count is calculated from that array, so the catalogue page and API do not need a separately maintained number.",
          "A manifest-derived count is a small architectural choice with a large editorial benefit. Marketing copy, navigation, tests, and machine-readable output can all point back to an inspectable list. When an entry changes, integrity tests catch duplicate slugs or registry names and confirm that the public source and registry item exist.",
        ],
      },
      {
        heading: "Dependency groups explain the system",
        paragraphs: [
          "The catalogue groups components by implementation relationship rather than alphabet alone. Foundations lead into forms, layout and feedback, display, disclosure, selection, overlays, navigation systems, composite inputs, and data utilities. This ordering makes shared behavior visible: a date picker depends on calendar and popover ideas, while a data table builds on table and utility behavior.",
          "Grouping also keeps the Component Lab legible. Reviewers can compare related controls and shared states without treating every entry as an isolated demo. A new category must fit the system’s dependency story, not simply increase the headline count.",
        ],
      },
      {
        heading: "Routes are views of the same record",
        paragraphs: [
          "The searchable catalogue page reads the manifest, and each static detail route resolves its entry by slug. The catalogue API returns the same groups and components as JSON. Sitemap component URLs are generated from the same list, and llms.txt expands it into canonical links with descriptions and registry locations.",
          "This does not eliminate every possible drift. Written prose can still overstate the status of a component, and generated registry payloads can become stale if a build step is skipped. It does give verification a precise comparison point: every public surface can be tested against the same 57 records.",
        ],
      },
      {
        heading: "Status still needs evidence",
        paragraphs: [
          "A manifest entry proves identity and intended contract, not production quality on its own. The source, meaningful states, keyboard behavior, responsive layout, theme treatment, RTL logic, reduced motion, documentation, and installation path each need evidence. Gummy UI’s launch specification separates those requirements so a catalogue count cannot substitute for verification.",
          "The same honesty applies to Pro. All 158 private blocks and six templates now have responsive source and automated implementation evidence, and the 300-definition design-kit catalogue has a versioned local materializer. The no-network Figma Starter materialization passed, but the products remain below verified and release-ready: founder review of generated browser and design evidence, Figma export and restore, protected release archives and entitlement delivery are still open. Counts are useful only when their state is as explicit as their source.",
        ],
      },
    ],
    links: [
      { href: "/components", label: "Browse all 57 component categories" },
      { href: "/api/catalogue", label: "Read the catalogue API" },
      { href: "/pro", label: "Review the explicit Pro status" },
    ],
  },
  {
    slug: "documenting-meaningful-component-states",
    title: "Documenting meaningful component states",
    description:
      "A method for reviewing default, focus, filled, validation, disabled, read-only, selected, open, and responsive states without a decorative matrix.",
    eyebrow: "State modelling",
    author: "Gummy UI",
    publishedAt: launchPublicationDate,
    updatedAt: launchPublicationDate,
    sections: [
      {
        heading: "A state exists because behavior changes",
        paragraphs: [
          "A useful state matrix begins with decisions the user or application can observe. Empty and filled controls affect labels and support text. Disabled and read-only controls look similar at a glance but have different focus, submission, and editing behavior. Open overlays introduce focus movement and dismissal. Selected items need both a visible treatment and a programmatic state.",
          "Gummy UI names these states in component source, documentation, and Lab specimens. The goal is not to render every possible prop combination. It is to expose the conditions that change meaning, input method, focus, validation, layout, or motion so reviewers can compare the contract with the implementation.",
        ],
      },
      {
        heading: "Separate live behavior from forced specimens",
        paragraphs: [
          "A Component Lab often needs a persistent hover or focus example so several states can be reviewed at once. Those forced specimens are visual references; they are not substitutes for moving focus with a keyboard or opening the actual primitive. Gummy UI keeps live examples alongside state cards so an internal class cannot be mistaken for evidence of interaction.",
          "This distinction matters when a material response spans several layers. A forced focus ring may look correct while the live reservoir, label, or popup behaves differently. Browser review should compare the persistent specimen with the real selector and event path, then update both if the reference has drifted.",
        ],
      },
      {
        heading: "Include environmental states",
        paragraphs: [
          "Theme, direction, viewport, input method, and motion preference are part of the state space. A control can pass its default desktop example and still fail when a long label wraps at 320 pixels, when RTL reverses horizontal navigation, or when reduced motion leaves an active transform stuck in a compressed position.",
          "The practical approach is to keep component states and environmental axes distinct. First verify the control’s own default, active, invalid, disabled, and open conditions. Then exercise representative combinations across light and dark, LTR and RTL, compact width, keyboard and pointer, and reduced motion. This produces useful coverage without pretending to test a combinatorial infinity.",
        ],
      },
      {
        heading: "Write the expected outcome",
        paragraphs: [
          "A label such as “keyboard focus” is more useful when its expected outcome is documented: which element receives focus, which indicator appears, which relationship is announced, and what the next key does. Similar detail helps with validation, focus restoration, roving navigation, and native form participation.",
          "Tests can then assert behavior rather than class names. Styling assertions remain appropriate for stable tokens and reduced-motion rules, but the state contract should be readable in roles, values, names, attributes, and focus. The result is a matrix that guides implementation instead of merely cataloguing screenshots.",
        ],
      },
    ],
    links: [
      { href: "/components/lab", label: "Open the component state lab" },
      { href: "/components", label: "Read per-component contracts" },
      { href: "/accessibility", label: "See the accessibility verification status" },
    ],
  },
  {
    slug: "keyboard-contracts-for-overlays",
    title: "Keyboard contracts for overlays",
    description:
      "How Gummy UI reasons about triggers, focus containment, dismissal, restoration, roving navigation, and non-modal surfaces across its Base UI overlay components.",
    eyebrow: "Keyboard interaction",
    author: "Gummy UI",
    publishedAt: launchPublicationDate,
    updatedAt: launchPublicationDate,
    sections: [
      {
        heading: "Begin at the trigger",
        paragraphs: [
          "An overlay interaction starts before the popup is visible. The trigger needs a clear accessible name, native button behavior, and an explicit relationship with the surface it controls. Opening should follow the primitive’s keyboard contract rather than a click-only event attached to a decorative wrapper.",
          "Gummy UI’s dialog, menu, popover, tooltip, sheet, drawer, and related sources compose Base UI parts so triggers, portals, positioners, viewports, popups, titles, descriptions, and close controls remain identifiable. Component detail pages state the expected keyboard behavior rather than relying on the material treatment to imply it.",
        ],
      },
      {
        heading: "Match focus behavior to modality",
        paragraphs: [
          "A modal dialog temporarily owns interaction. Focus moves inside, stays contained while the dialog is active, and returns to the trigger after dismissal. A menu uses a different model: items participate in roving focus and typeahead, while Escape closes the menu and restores the trigger. A tooltip does not become a keyboard trap or a substitute for a visible label.",
          "These differences are why one generic “popup” component would be misleading. Shared positioning and visual layers can be reused, but the primitive still owns modality, focus, selection, and dismissal. Tests should exercise the concrete surface rather than assert that every overlay follows the dialog model.",
        ],
      },
      {
        heading: "Preserve names and relationships",
        paragraphs: [
          "Dialog and alert-dialog surfaces need a title and, where used, a description connected to the popup. Menu items need roles and state appropriate to ordinary actions, checkboxes, radio choices, groups, separators, or submenus. Popover content can be non-modal but still needs a named trigger and sensible focus order.",
          "Decorative backdrops, reservoirs, bridges, and glints remain silent. The accessible tree should describe the trigger, surface, content, state, and available actions without narrating the Gel Pop material. That separation also allows reduced motion to remove transitions without changing the interaction contract.",
        ],
      },
      {
        heading: "Test the return journey",
        paragraphs: [
          "Opening an overlay is only half of the path. Verification should cover Escape, explicit close controls, outside interaction where appropriate, selection, nested surfaces, and focus restoration. It should also check that closed content is not accidentally exposed and that portal behavior does not break naming relationships.",
          "The existing automated suite covers representative overlay states and selected focus paths in a DOM environment. Full launch evidence still needs real-browser keyboard and screen-reader smoke tests. Keeping that limitation visible is preferable to treating a passing visual specimen as complete accessibility evidence.",
        ],
      },
    ],
    links: [
      { href: "/components/dialog", label: "Inspect the Dialog contract" },
      { href: "/components/dropdown-menu", label: "Inspect the Dropdown Menu contract" },
      { href: "/components/lab", label: "Exercise live overlay examples" },
    ],
  },
  {
    slug: "native-forms-with-visible-context",
    title: "Native forms with visible context",
    description:
      "A close look at labels, descriptions, validation, read-only behavior, counts, groups, and form participation in Gummy UI’s public form foundations.",
    eyebrow: "Form foundations",
    author: "Gummy UI",
    publishedAt: launchPublicationDate,
    updatedAt: launchPublicationDate,
    sections: [
      {
        heading: "Keep the control native",
        paragraphs: [
          "Gummy UI’s form foundations use native labels, inputs, textareas, checkboxes, radio inputs, fieldsets, and selects where those elements already provide the required behavior. The Gel Pop shell is layered around the control rather than replacing it with a generic element. Names, values, required state, disabled state, and browser form participation remain available to the consuming application.",
          "This architecture reduces the amount of custom keyboard behavior the design system must own. It also makes the source easier to inspect: a contributor can find the actual input and see how visual adornments, status marks, and support text are connected around it.",
        ],
      },
      {
        heading: "Give every message an address",
        paragraphs: [
          "Descriptions, errors, success messages, and character counts receive stable IDs derived from the control ID. The input’s accessible description joins the relevant IDs instead of relying on visual proximity. Invalid state and error-message relationships are exposed on the control, while visible status marks remain decorative.",
          "A message should still make sense without colour. Error text explains the problem, success text confirms the outcome, and required or optional cues appear in the label. The material can reinforce those states, but it does not become their only carrier.",
        ],
      },
      {
        heading: "Distinguish disabled from read-only",
        paragraphs: [
          "Disabled controls are unavailable and follow native disabled behavior. Read-only controls remain part of the reading flow but prevent editing through the component’s documented path. Gummy UI gives those conditions distinct data attributes and support copy so a consumer does not need to infer behavior from opacity alone.",
          "The distinction becomes especially important for checkbox, radio, and select-like interactions, where HTML support differs. Tests exercise protected values and keyboard behavior for the implemented foundations. A form composition should still explain why a value cannot change, because component state cannot provide the application’s business reason.",
        ],
      },
      {
        heading: "Review the form as a composition",
        paragraphs: [
          "Individual controls can be correct while a form remains difficult to use. Labels need a consistent scan path, descriptions should not crowd error messages, action order must survive narrow reflow, and long values need room to wrap. Field groups and radio legends should explain the relationship between choices.",
          "The Component Lab includes a realistic form composition alongside state matrices so these interactions can be reviewed together. It is still sample content, not evidence of a customer workflow. Its purpose is to expose density, focus, validation, and responsive behavior using the same canonical sources delivered by the registry.",
        ],
      },
    ],
    links: [
      { href: "/components/field", label: "Read the Field component contract" },
      { href: "/components/checkbox", label: "Read the Checkbox component contract" },
      { href: "/components/lab", label: "Inspect the composed form" },
    ],
  },
  {
    slug: "rtl-is-behavior-not-a-mirror",
    title: "RTL is behavior, not a mirror",
    description:
      "How logical CSS, native direction, Base UI context, text alignment, reservoir placement, and keyboard expectations combine in Gummy UI’s RTL work.",
    eyebrow: "Bidirectional interfaces",
    author: "Gummy UI",
    publishedAt: launchPublicationDate,
    updatedAt: launchPublicationDate,
    sections: [
      {
        heading: "Set direction at a real boundary",
        paragraphs: [
          "Right-to-left review starts with the document or component subtree’s dir value. Gummy Direction provides a native direction boundary and the Base UI direction context used by primitives that need it. This is different from applying a transform to a finished screenshot: layout, text, focus movement, and positioning logic all need the correct direction while they run.",
          "The public RTL page exposes a scoped example so direction can be inspected without changing the entire site. Component Lab specimens add representative RTL states for controls whose geometry or navigation changes. Those examples are implementation aids, not a claim that every language has received translation review.",
        ],
      },
      {
        heading: "Prefer logical geometry",
        paragraphs: [
          "Margins, padding, borders, insets, alignment, and radii should use inline and block concepts when their meaning follows reading direction. Gummy UI places attached reservoirs and support content with logical properties where possible, so the material moves with the functional edge instead of remaining pinned to an arbitrary physical side.",
          "Some artwork still needs explicit RTL selectors because an asymmetric highlight or SVG path has visual direction. Those exceptions should remain local and documented. A blanket scaleX transform would reverse text and icons as well as geometry, creating a visual mirror rather than a usable RTL interface.",
        ],
      },
      {
        heading: "Keyboard order needs a contract",
        paragraphs: [
          "Horizontal controls can change arrow-key expectations under RTL. Tabs, radio groups, menus, and other composites should follow the primitive or documented native model rather than an assumption that Arrow Right always means the next DOM item. Focus and selection need to move together where the component contract requires it.",
          "Automated tests cover selected direction-sensitive paths, but code-level direction is not the whole launch check. Arabic, Persian, and Hebrew content introduce different word lengths, punctuation, numerals, and mixed-direction strings. Reviewed translations and full locale navigation remain separate work from the current RTL architecture.",
        ],
      },
      {
        heading: "Test content, not just chrome",
        paragraphs: [
          "A reservoir moving to inline start is useful evidence, but long labels, validation messages, tables, dates, breadcrumbs, and input values also need review. Mixed LTR fragments such as URLs or code should remain readable inside an RTL context. Reflow and overflow checks should use realistic strings rather than repeated placeholder glyphs.",
          "The durable rule is to treat direction as an environmental axis across semantics, behavior, and material. Gummy UI’s logical CSS and direction component establish that foundation. They do not replace native-speaker review or justify publishing untranslated locale claims.",
        ],
      },
    ],
    links: [
      { href: "/rtl", label: "Open the scoped RTL example" },
      { href: "/components/direction", label: "Read the Direction component contract" },
      { href: "/components/tabs", label: "Inspect a direction-aware composite" },
    ],
  },
  {
    slug: "reduced-motion-without-lost-state",
    title: "Reduced motion without lost state",
    description:
      "A component-level approach to removing travel, rotation, squash, and animated settling while preserving focus, selection, loading, and validation information.",
    eyebrow: "Motion accessibility",
    author: "Gummy UI",
    publishedAt: launchPublicationDate,
    updatedAt: launchPublicationDate,
    sections: [
      {
        heading: "Identify what motion is doing",
        paragraphs: [
          "Motion in Gummy UI can indicate a press, a state transition, a loading process, or a short material response. Before reducing it, the implementation needs to identify whether the animation carries information. A button squash is feedback layered on top of native activation; a spinner rotation accompanies a named status; a focus ring communicates state even when its transition disappears.",
          "This inventory prevents a common mistake: disabling the entire component or hiding an indicator when the user requests less motion. The preference should remove unnecessary travel and temporal effects while the control, message, and current state remain available.",
        ],
      },
      {
        heading: "Neutralise transforms as well as durations",
        paragraphs: [
          "Setting transition-duration to zero is not always enough. An active selector may still apply a scale, translation, or rotation for the instant it matches, leaving a control visibly compressed during interaction. Gummy UI’s reduced-motion rules explicitly neutralise relevant transforms and animations for presses, indicators, loading tides, and rotating marks.",
          "The static replacement still needs contrast and shape. A selected checkbox keeps its check, a radio keeps its dot, validation keeps its text and status treatment, and a spinner remains a named status even when it no longer rotates. Reduced movement is not reduced meaning.",
        ],
      },
      {
        heading: "Keep focus immediate",
        paragraphs: [
          "Focus visibility should not depend on a slow glow arriving after the keyboard user has moved. Under reduced motion, the final focus treatment appears without an animated journey. Overlays still move focus according to their primitive contract even if their entrance and exit transitions are removed.",
          "This distinction separates motion preference from interaction behavior. Focus containment, restoration, roving focus, and dismissal are not decorative animations. They remain necessary for the component to operate, while visual movement around those changes can be simplified.",
        ],
      },
      {
        heading: "Verify the preference in context",
        paragraphs: [
          "A stylesheet search can confirm that a reduced-motion media query exists, but it cannot prove every active component looks correct. Review should enable the operating-system or browser preference, exercise real controls, and inspect loading, focus, open, selected, and validation states at representative widths.",
          "The current registry verifier checks that shared material payloads include reduced-motion rules, and component tests inspect selected contracts. A complete release record still needs browser evidence. The accessibility page deliberately describes this layered model rather than turning the presence of one media query into a universal compatibility claim.",
        ],
      },
    ],
    links: [
      { href: "/accessibility", label: "Read the accessibility approach" },
      { href: "/components/progress", label: "Inspect a status component" },
      { href: "/components/lab", label: "Review canonical motion states" },
    ],
  },
  {
    slug: "building-light-and-dark-from-semantic-tokens",
    title: "Building light and dark from semantic tokens",
    description:
      "How Gummy UI separates canvas, surface, ink, focus, fruit families, and component-local material so themes can change without rewriting behavior.",
    eyebrow: "Theme architecture",
    author: "Gummy UI",
    publishedAt: launchPublicationDate,
    updatedAt: launchPublicationDate,
    sections: [
      {
        heading: "Name purpose before colour",
        paragraphs: [
          "The Gummy base theme defines semantic canvas, surface, ink, line, focus, and fruit-family values. Components consume those roles or derive local material variables from them. A raspberry action does not need to repeat a raw colour throughout every selector, and body copy does not need to know which dark canvas happens to be active.",
          "This vocabulary lets design review discuss relationships: ink against a stable plane, focus against the surrounding shell, or a fruit rim against its core. The values use OKLCH notation, which makes lightness and chroma easier to compare, but the token’s purpose remains more important than its numeric format.",
        ],
      },
      {
        heading: "Treat dark mode as its own optical system",
        paragraphs: [
          "Dark mode is not produced by inverting the finished light interface. The canvas becomes a chromatic dark field, stable reading surfaces gain enough separation, and local gel can become brighter without placing luminous colour behind text. Shadows, lines, muted ink, and focus all need relationships appropriate to the darker environment.",
          "Component-local overrides are sometimes necessary because translucency blends with its surroundings. Those overrides still derive from shared families and remain scoped to the component’s anatomy. This avoids a global dark-mode patch that fixes one surface while flattening every other material.",
        ],
      },
      {
        heading: "Keep theme choice in the browser",
        paragraphs: [
          "The public site reads and writes the selected light or dark theme in local storage. An inline bootstrap applies the stored choice or system preference before the page is painted. The theme builder also operates in the browser and produces a portable CSS override; it does not upload a configuration or create an account record.",
          "That local behavior is reflected in the current privacy page. If future account sync or analytics changes the data flow, the implementation and notice will need to change together. For the present public baseline, theme experimentation stays on the device.",
        ],
      },
      {
        heading: "Review states in both themes",
        paragraphs: [
          "A theme is not complete because the resting button looks attractive. Focus, disabled, selected, validation, overlay, loading, and dense content states can expose contrast or blending problems that the default misses. Stable text pairs receive token-level checks, while representative components are inspected in light and dark Lab contexts.",
          "The browser-local builder is best used as an exploration and export tool, not as proof that every arbitrary combination is accessible. A copied theme should be reviewed with the actual content and states it will support. The component catalogue provides the source and behavior contract needed for that review.",
        ],
      },
    ],
    links: [
      { href: "/themes", label: "Open the theme builder" },
      { href: "/components/lab", label: "Compare light and dark states" },
      { href: "/privacy", label: "Read the local-data status" },
    ],
  },
  {
    slug: "responsive-components-start-with-content",
    title: "Responsive components start with content",
    description:
      "A practical approach to 320-pixel reflow, long labels, touch targets, logical stacking, bounded decoration, and container-driven component layouts.",
    eyebrow: "Responsive design",
    author: "Gummy UI",
    publishedAt: launchPublicationDate,
    updatedAt: launchPublicationDate,
    sections: [
      {
        heading: "Let content find the breakpoint",
        paragraphs: [
          "A responsive component should not wait for a page-wide mobile breakpoint before handling its own content. Labels wrap, support text grows, action groups stack, and tables need an explicit overflow or reflow strategy. Gummy UI uses flexible tracks, minmax sizing, container-driven widths, and focused media rules so the functional content absorbs space before decorative material stretches.",
          "The design system’s launch contract includes narrow reflow down to 320 CSS pixels. That number is a review boundary, not a reason to set every component to a fixed minimum width. Components should remain governed by their container and avoid creating document-level horizontal scrolling.",
        ],
      },
      {
        heading: "Keep targets large without forcing rows",
        paragraphs: [
          "Interactive targets use a 44-pixel minimum where the component contract calls for a touch-sized control. On a narrow screen, preserving that height may require labels, secondary text, or adjacent actions to wrap or stack. Compressing several controls into one rigid row can satisfy a screenshot while making each target harder to reach.",
          "Touch review also includes spacing between adjacent actions and scroll behavior around carousels, resizable regions, and overflow containers. CSS touch-action rules can support direct manipulation, but they should not block native page scrolling or replace keyboard operation.",
        ],
      },
      {
        heading: "Bound the material",
        paragraphs: [
          "Gel reservoirs and SVG frames need explicit rules at small sizes. A decorative edge that looks balanced on a wide card can collide with a title or occupy most of a compact control. Gummy UI keeps pools at bounded dimensions and lets the content plane take the flexible space, with narrower layouts reducing or repositioning non-essential visual intensity.",
          "This is another reason to keep decoration separate from semantics. Hiding or simplifying a glint at a compact breakpoint should not remove the control’s label, status, or focus indicator. The DOM remains stable while the material adapts around it.",
        ],
      },
      {
        heading: "Use realistic strings",
        paragraphs: [
          "Responsive evidence is stronger when examples include long labels, descriptions, validation messages, code, dates, and dense table values. Repeating short placeholder words can conceal overflow until production content arrives. RTL review adds another dimension because inline start, punctuation, and mixed-direction strings affect available space.",
          "The Component Lab and public compositions provide representative content for local review, and recorded audits describe selected viewport checks. Full launch verification still needs repeatable desktop and mobile browser journeys. Source-level media queries are a foundation, not a substitute for rendered measurement.",
        ],
      },
    ],
    links: [
      { href: "/components/lab", label: "Inspect responsive specimens" },
      { href: "/rtl", label: "Compare a direction-aware layout" },
      { href: "/accessibility", label: "Review reflow and touch requirements" },
    ],
  },
  {
    slug: "using-the-component-lab-as-evidence",
    title: "Using the Component Lab as evidence",
    description:
      "What Gummy UI’s Component Lab reveals, what automated tests add, and why a specimen page cannot replace browser and assistive-technology verification.",
    eyebrow: "Verification practice",
    author: "Gummy UI",
    publishedAt: launchPublicationDate,
    updatedAt: launchPublicationDate,
    sections: [
      {
        heading: "Keep canonical source in the specimen",
        paragraphs: [
          "The Component Lab imports the same component files used by the catalogue and registry. It does not maintain a second visual-only implementation for screenshots. This makes state review useful: a focus, validation, overlay, or responsive finding can be traced back to the source that a consumer would receive.",
          "The Lab groups related components and shows live compositions beside persistent state specimens. Forced focus or hover classes help compare several visuals at once, while live controls remain necessary for keyboard, pointer, value, and focus checks. The two modes answer different questions.",
        ],
      },
      {
        heading: "Inspect environmental axes",
        paragraphs: [
          "Theme, direction, motion preference, and viewport size can change both visual material and behavior. The Lab exposes dark and RTL contexts and includes responsive content designed to wrap. Shared styles include reduced-motion rules that can be reviewed with the browser preference enabled.",
          "A useful audit records the viewport, theme, direction, input path, state, finding, fix, and re-inspection. Without those details, “checked responsive behavior” is difficult to repeat. Gummy UI’s existing audit notes are local evidence, while a production launch still requires a fuller recorded browser matrix.",
        ],
      },
      {
        heading: "Pair visuals with executable checks",
        paragraphs: [
          "Vitest and Testing Library cover roles, labels, state, keyboard paths, and form behavior for the current public sources. Axe inspects representative rendered states in jsdom, and selected token-level tests calculate stable colour contrast. Registry verification copies and type-checks the declared files.",
          "Each layer has limits. jsdom is not a browser layout engine, token checks cannot see every blended pixel, and a type-check does not invoke a package-manager installation journey. The Lab provides human-readable context around those checks but does not erase their boundaries.",
        ],
      },
      {
        heading: "Turn findings into source changes",
        paragraphs: [
          "A visual audit is complete only when a finding leads to a fix and a second inspection. If a narrow header leaves an empty status shell, the responsive layout changes. If a forced focus specimen differs from live focus, both the reference and actual selector are reconciled. Notes should describe the outcome rather than declare taste-based approval.",
          "The most useful role of a Lab is therefore diagnostic. It concentrates meaningful states, exposes shared regressions, and gives contributors a repeatable place to compare behavior and material. Release evidence still expands outward to clean consumers, real devices, assistive technology, performance, and deployed security.",
        ],
      },
    ],
    links: [
      { href: "/components/lab", label: "Open the Component Lab" },
      { href: "/components", label: "Trace specimens to canonical source" },
      { href: "/accessibility", label: "Read the verification boundaries" },
    ],
  },
  {
    slug: "testing-accessibility-in-layers",
    title: "Testing accessibility in layers",
    description:
      "How semantic assertions, keyboard tests, axe, contrast, responsive review, reduced motion, RTL, and manual smoke tests fit without overstating coverage.",
    eyebrow: "Accessibility testing",
    author: "Gummy UI",
    publishedAt: launchPublicationDate,
    updatedAt: launchPublicationDate,
    sections: [
      {
        heading: "Test the semantic contract",
        paragraphs: [
          "The first layer asks whether the rendered control has the right element, role, name, value, relationship, and state. Testing Library queries encourage the suite to interact through those public signals. A label test is stronger when it finds the input by name; a dialog test is stronger when it observes the named surface and focus path.",
          "These assertions are close to the component’s source contract and run quickly across many changes. They can still miss browser layout, platform accessibility mappings, or an interaction that depends on real rendering. Passing unit tests are necessary evidence, not a complete accessibility claim.",
        ],
      },
      {
        heading: "Use axe for representative trees",
        paragraphs: [
          "Axe examines representative rendered states for detectable rule violations. Gummy UI uses it on groups of canonical components, including open overlays and composed forms. The test environment disables colour contrast because jsdom does not provide the rendered pixels needed for that rule; selected stable token pairs are checked separately.",
          "That separation should remain visible in reports. “No axe violations in this fixture” is precise. “The component is accessible everywhere” is not. Different states, consumer composition, browser behavior, language, and assistive technology can introduce issues beyond the fixture.",
        ],
      },
      {
        heading: "Exercise input and environment",
        paragraphs: [
          "Keyboard tests cover activation, arrow navigation, Home and End behavior, Escape dismissal, and focus restoration where those contracts apply. Pointer and native change paths matter as well, especially for forms and direct-manipulation components. Touch target size and mobile reflow need rendered measurement rather than a DOM-only assertion.",
          "Theme, zoom, RTL, and reduced motion add environmental coverage. Logical CSS can be inspected in source, but mixed-direction content still needs a browser. A reduced-motion rule can be present while an active transform remains. Layered testing is designed to catch these different failure modes.",
        ],
      },
      {
        heading: "Record manual evidence honestly",
        paragraphs: [
          "Screen-reader smoke tests should identify the platform, browser, assistive technology, component state, commands, and observed output. Zoom and reflow records should include viewport and scale. Findings, fixes, and re-tests belong beside the result so a later change can be compared with the same path.",
          "The current public application includes automated behavior, axe, contrast, registry, and selected browser audit records. The master specification still keeps full release accessibility evidence open. That status makes the remaining work actionable and avoids turning a partial automated suite into a promise it cannot support.",
        ],
      },
    ],
    links: [
      { href: "/accessibility", label: "Read the current accessibility status" },
      { href: "/components", label: "Inspect documented component contracts" },
      { href: "/components/lab", label: "Exercise representative states" },
    ],
  },
  {
    slug: "composing-data-interfaces-from-primitives",
    title: "Composing data interfaces from primitives",
    description:
      "How Table, Data Table, Pagination, Empty, Progress, Skeleton, Resizable, and Scroll Area divide semantic and visual responsibilities in dense interfaces.",
    eyebrow: "Data interfaces",
    author: "Gummy UI",
    publishedAt: launchPublicationDate,
    updatedAt: launchPublicationDate,
    sections: [
      {
        heading: "Keep the data structure visible",
        paragraphs: [
          "Gummy Table provides native table anatomy for captions, headers, bodies, rows, and cells. That structure lets browsers and assistive technology preserve row and column relationships. A dense visual treatment should not replace it with a grid of generic containers simply because the cells need custom material or responsive styling.",
          "Data Table composes table structure with application-level sorting and selection controls. Those behaviors need named buttons, announced state, and a clear relationship with the data. The component can provide UI foundations, while the consuming application remains responsible for the actual dataset, query, permissions, and server behavior.",
        ],
      },
      {
        heading: "Make every system state explicit",
        paragraphs: [
          "A data view is more than its populated rows. Loading can use a named busy status with decorative skeleton shapes. Empty state needs a useful heading, explanation, and appropriate next action. Progress needs a label and current value when determinate. Errors and retry behavior belong to the application composition even when shared components provide the visual pieces.",
          "Pagination exposes navigation links and current-page state rather than a row of unlabeled numbers. Selection should remain visible and programmatic, while disabled actions explain their availability through the surrounding product context. These states should be designed together because users move between them during one task.",
        ],
      },
      {
        heading: "Choose an overflow strategy",
        paragraphs: [
          "Wide data can scroll, reflow, hide lower-priority columns, or change into a different summary. Gummy Scroll Area and Resizable provide controlled primitives, but they do not choose the information architecture. A scroll viewport needs a keyboard and focus strategy, and a resizable boundary needs usable handles and preserved content access.",
          "At narrow widths, the surrounding page must avoid a second accidental horizontal scrollbar. Headers, filters, pagination, and bulk actions need their own wrapping rules. Testing only an empty or short table will not reveal the pressure created by realistic labels and values.",
        ],
      },
      {
        heading: "Separate demonstration from backend claims",
        paragraphs: [
          "The Component Lab uses local sample rows and state to exercise these public sources. It does not imply a hosted data service, customer dashboard, analytics product, or supported backend integration. The public baseline’s database example is separate from the component catalogue and no account system is active.",
          "This boundary keeps the component documentation useful. It can explain semantic tables, selection, loading, pagination, scrolling, and resizing without inventing operational capabilities. Consumers can then connect those pieces to the real data and authorization model of their application.",
        ],
      },
    ],
    links: [
      { href: "/components/table", label: "Inspect the Table source" },
      { href: "/components/data-table", label: "Inspect the Data Table source" },
      { href: "/components/lab", label: "Review the data-utility specimens" },
    ],
  },
  {
    slug: "interactive-cards-need-real-elements",
    title: "Interactive cards need real elements",
    description:
      "Why Gummy UI separates passive article cards, anchor cards, and button cards instead of attaching click and keyboard handlers to generic containers.",
    eyebrow: "Interaction design",
    author: "Gummy UI",
    publishedAt: launchPublicationDate,
    updatedAt: launchPublicationDate,
    sections: [
      {
        heading: "Decide what the card does",
        paragraphs: [
          "A card can group information, navigate to another location, or trigger an in-place action. Those purposes have different HTML elements and expectations. Gummy Card exposes a passive article root, a link root, and a button root so the source communicates its intent before styling is considered.",
          "This is clearer than making every card a focusable div and attempting to recreate Enter, Space, link destinations, button type, disabled behavior, and browser conventions. Native elements also give testing and assistive technology a reliable way to identify the interaction.",
        ],
      },
      {
        heading: "Avoid nested interaction traps",
        paragraphs: [
          "A whole-card link cannot safely contain another button or link as though each were independent. A button card should not wrap unrelated form controls. When a composition needs several actions, a passive card with explicit links and buttons inside is often the better structure, even if the visual design makes the entire surface feel connected.",
          "The component API’s separate roots encourage that decision. Shared header, title, description, content, footer, and icon slots can be composed under the appropriate root without changing the material frame. Structure remains an application choice rather than a CSS side effect.",
        ],
      },
      {
        heading: "Keep focus attached to the action",
        paragraphs: [
          "Interactive card roots receive visible focus and native activation. The SVG frame and reservoir are decorative, so focus remains on the anchor or button rather than moving into a graphic. Selected visual state is separate from keyboard focus; one describes application state and the other identifies the current input target.",
          "Responsive content can change the card’s height and frame geometry. The source measures its decorative SVG without changing the semantic root. If ResizeObserver is unavailable, the frame has a stable initial geometry while the card content remains readable and interactive.",
        ],
      },
      {
        heading: "Test each root as itself",
        paragraphs: [
          "Passive card tests should confirm article semantics and the absence of synthetic interaction. Link tests should use navigation attributes and link queries. Button tests should cover native button behavior, type, focus, and activation. A shared visual snapshot cannot prove all three contracts.",
          "The component detail page and source viewer expose these roots together because they share anatomy. That does not make them interchangeable. Choosing the correct root is the central accessibility and product decision; the Gel Pop frame is the common surface that follows it.",
        ],
      },
    ],
    links: [
      { href: "/components/card", label: "Read the Card component contract" },
      { href: "/components/lab", label: "Compare passive and interactive cards" },
      { href: "/docs", label: "Read component anatomy guidance" },
    ],
  },
  {
    slug: "designing-ai-readable-component-docs",
    title: "Designing AI-readable component docs",
    description:
      "How catalogue JSON, llms.txt, registry payloads, canonical pages, and explicit status language help agents discover Gummy UI without exposing private source.",
    eyebrow: "Machine discovery",
    author: "Gummy UI",
    publishedAt: launchPublicationDate,
    updatedAt: launchPublicationDate,
    sections: [
      {
        heading: "Offer stable public contracts",
        paragraphs: [
          "An agent needs more than a marketing homepage to use a component system responsibly. Gummy UI exposes a catalogue API with groups, descriptions, source identities, semantics, keyboard notes, dependencies, and registry URLs. Individual registry payloads contain the editable public files, while canonical component pages provide human-readable context.",
          "These surfaces derive from the same catalogue so names and URLs can be compared. A health endpoint reports only public service identity and catalogue size. It intentionally avoids private diagnostics, credentials, customer records, or claims about systems that are not active.",
        ],
      },
      {
        heading: "Use llms.txt as a map",
        paragraphs: [
          "The llms.txt route lists canonical documentation, catalogue, registry, MCP guidance, licence, and component links in plain text. It is a discovery aid, not a new source of product truth. Descriptions and registry URLs still point back to the public manifest and payloads.",
          "This blog is included in the same map so design and implementation reasoning can be found without scraping navigation. RSS provides another standards-based list of article updates. Neither route includes paid source paths, release locations, entitlement details, or invented support channels.",
        ],
      },
      {
        heading: "State unavailable capabilities clearly",
        paragraphs: [
          "The public HTTP catalogue and registry contracts are implemented locally. A hosted MCP transport is not advertised as active because authentication, rate limits, monitoring, and deployment remain release decisions. The Pro catalogue now describes implemented blocks, templates, and design-kit definitions without misrepresenting local implementation evidence as verified, protected, downloadable product.",
          "Explicit status language helps both people and agents avoid unsafe inference. “Specified,” “implemented,” “tested,” “deployed,” and “production-verified” are different states. Machine-readable metadata should preserve those distinctions instead of flattening every listed item into availability.",
        ],
      },
      {
        heading: "Protect the repository boundary",
        paragraphs: [
          "Public discovery may include safe names, descriptions, counts, and preview references. It must not include editable paid blocks, templates, design source, protected release URLs, or entitlement logic. The public registry is generated only from the MIT component source intended for distribution.",
          "Discovery tests should therefore check presence and absence together: every canonical public article or component should be listed, while account internals, checkout routes, private previews, and paid source remain excluded from indexes. Useful machine access depends on a narrow, reviewable boundary.",
        ],
      },
    ],
    links: [
      { href: "/llms.txt", label: "Read the LLM discovery map" },
      { href: "/api/catalogue", label: "Inspect the catalogue API" },
      { href: "/mcp", label: "Review MCP transport status" },
    ],
  },
  {
    slug: "keeping-public-and-pro-source-separate",
    title: "Keeping public and Pro source separate",
    description:
      "The reasoning behind Gummy UI’s two-repository boundary and the practical rules for metadata, previews, registry payloads, releases, and credentials.",
    eyebrow: "Source governance",
    author: "Gummy UI",
    publishedAt: launchPublicationDate,
    updatedAt: launchPublicationDate,
    sections: [
      {
        heading: "Git history is part of publication",
        paragraphs: [
          "Deleting a paid file from a public working tree does not guarantee that the file has left Git history. Gummy UI therefore uses separate repositories: the public repository for MIT components, registry, website, documentation, and safe metadata; the private repository for paid editable source, templates, design source, releases, and internal QA.",
          "The rule is stronger than placing a private-looking folder inside the public project. Paid source must never enter the public repository, even temporarily. Credentials, customer data, signing material, and protected download locations belong in neither source tree.",
        ],
      },
      {
        heading: "Define safe public outputs",
        paragraphs: [
          "The public site may describe catalogue names, categories, counts, purposes, and honest status. It may eventually receive reviewed source-free raster screenshots, but never compiled or minified Pro JavaScript, HTML, CSS, source maps, or design data. Minification does not make paid source public-safe, and those image outputs remain distinct from block TSX, template projects, design-library source, and protected archives.",
          "The current Pro exporter writes boundary-safe metadata inside the private release workspace, and an explicit checked sync copies only that allowlisted contract into the local public surface. Deployment remains a separate founder-approved action. This two-step model prevents a generation command from silently publishing its output.",
        ],
      },
      {
        heading: "Keep status with the metadata",
        paragraphs: [
          "The private manifest currently marks all 158 blocks, six templates, and the 300-definition design kit as implemented. That means the documented local source and automated implementation contracts exist; it does not mean manual review, protected releases, entitlement delivery, deployment, or production verification has happened. Public metadata preserves those lower statuses so a catalogue count cannot be read as product availability.",
          "Promotion requires evidence beyond file presence: responsive source, meaningful states, tests, previews, clean consumer checks, release archives, checksums, restore evidence, and entitlement delivery. No script should infer release-ready status from a directory count.",
        ],
      },
      {
        heading: "Verify both repositories and artifacts",
        paragraphs: [
          "Boundary checks should inspect current files, Git history, generated registry JSON, client and server bundles, source maps, public metadata, preview artifacts, and release archives. A public manifest path should be constrained to the public source root so an accidental parent-directory reference cannot copy private material.",
          "Secret scanning and ignore rules are supporting controls, not permission to stage sensitive files. The public and private repositories were published only after boundary and secret scans, with paid source kept in the private repository. Deployment still needs a separate inventory of what is reachable from production URLs.",
        ],
      },
    ],
    links: [
      { href: "/security", label: "Read the public security boundary" },
      { href: "/pro", label: "Review the Pro specification status" },
      { href: "/license", label: "Read the public MIT licence status" },
    ],
  },
  {
    slug: "honest-product-status-by-design",
    title: "Honest product status by design",
    description:
      "Why Gummy UI separates specified, implemented, tested, deployed, and production-verified status across components, Pro, commerce, support, and legal pages.",
    eyebrow: "Product operations",
    author: "Gummy UI",
    publishedAt: launchPublicationDate,
    updatedAt: launchPublicationDate,
    sections: [
      {
        heading: "Use verbs with evidence",
        paragraphs: [
          "A product can exist in a manifest before its source exists, and source can exist before a clean consumer can install it. Tests can pass locally before a deployment has monitoring, support, backups, or a verified rollback. Gummy UI’s master specification uses separate states so each claim can point to the evidence it requires.",
          "This vocabulary prevents “launch-ready” from becoming a substitute for unfinished operational work. A component count comes from the public catalogue. Pro counts and statuses come from its boundary-safe manifest: the current deliverables are implemented, but they remain below verified and release-ready. Production URLs, customer journeys, and service levels cannot be claimed while the required systems remain unselected or inactive.",
        ],
      },
      {
        heading: "Keep commercial facts behind approval",
        paragraphs: [
          "The founder has now approved Individual, Team and Organization monthly, yearly and lifetime prices, named-seat rules, subscription and lifetime update access, commercial rights, a 14-day unopened-file goodwill refund, a two-business-day support target, Stripe Managed Payments and the selling entity. The pricing and terms pages record those facts, while checkout and entitlement routes remain closed until the real provider-backed system passes.",
          "The same discipline applies to social proof. Sample names and rows used in component demonstrations are fictional interface content, not customers or testimonials. Editorial material should explain implemented design and engineering choices without manufacturing adoption, time savings, performance scores, or compatibility claims.",
        ],
      },
      {
        heading: "Publish privacy and security as current state",
        paragraphs: [
          "The privacy notice now names KREYD LABS LTD, the approved providers, purposes, lawful bases, retention periods, rights and the founder-controlled contact address. It still says that provider use must be rechecked against the real production configuration before publication.",
          "The security page similarly distinguishes tested local, provider-neutral contracts from active production controls and now routes private reports to the confirmed monitored address. Production controls and test evidence must exist before the implementation status can change.",
        ],
      },
      {
        heading: "Make remaining work visible",
        paragraphs: [
          "An honest status page is not an excuse to stop. It turns missing work into a concrete gate: package-manager fixtures, full browser accessibility, localisation, performance budgets, dependency and artifact scans, monitoring, backup and restore evidence, commerce journeys, and protected Pro delivery.",
          "When those gates close, the documentation should be updated with the implementation rather than after launch. Public claims, manifests, tests, deployment evidence, and operating procedures need to describe the same product. Until then, precise pre-launch language is a feature of the system’s trust model.",
        ],
      },
    ],
    links: [
      { href: "/pricing", label: "Read approved Pro pricing" },
      { href: "/privacy", label: "Read the privacy notice" },
      { href: "/security", label: "Read the current security status" },
    ],
  },
] as const satisfies readonly Article[];

if (articles.length !== 18) {
  throw new Error(`Expected exactly 18 launch articles; received ${articles.length}.`);
}

export function getArticle(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug);
}

export function articleUrl(article: Pick<Article, "slug">): string {
  return `${siteUrl}/blog/${article.slug}`;
}

export function formatArticleDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
