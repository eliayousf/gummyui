import {
  catalogueGroups,
  componentCount,
  components,
  getComponent,
  type ComponentDefinition,
} from "./catalogue";
import { getComponentApi } from "./component-api";

export const markdownDocumentationBaseUrl = "https://gummyui.dev/docs/markdown";

export const markdownGuideSlugs = [
  "introduction",
  "installation",
  "nextjs",
  "vite",
  "theming",
  "accessibility",
  "rtl",
  "localisation",
  "editor-setup",
  "mcp",
  "troubleshooting",
] as const;

export type MarkdownGuideSlug = (typeof markdownGuideSlugs)[number];

const publicSourceBoundary = [
  "## Licence and source boundary",
  "",
  "Gummy UI's public component source and documentation are MIT licensed.",
  "This Markdown namespace exposes only public catalogue facts, public source",
  "locations, and public registry URLs. Separate paid assets are not included",
  "and cannot be inferred from these documents.",
].join("\n");

function documentFooter(canonicalUrl: string) {
  return [
    "",
    publicSourceBoundary,
    "",
    `Canonical Markdown: ${canonicalUrl}`,
    "",
  ].join("\n");
}

function componentMarkdownUrl(slug: string) {
  return `${markdownDocumentationBaseUrl}/components/${slug}.md`;
}

function guideMarkdownUrl(slug: MarkdownGuideSlug) {
  return `${markdownDocumentationBaseUrl}/guides/${slug}.md`;
}

function dependencyList(component: ComponentDefinition) {
  if (component.dependencies.length === 0) {
    return [
      "No component-specific dependency is declared in the catalogue.",
      "The registry resolves shared Gummy style payloads automatically.",
    ];
  }
  return [
    ...component.dependencies.map((dependency) => `- \`${dependency}\``),
    "",
    "The registry resolves shared Gummy style payloads automatically.",
  ];
}

export function renderComponentMarkdown(component: ComponentDefinition) {
  const group = catalogueGroups.find(({ id }) => id === component.group);
  const api = getComponentApi(component.slug);
  const sourceViewerUrl = `https://gummyui.dev/components/${component.slug}#source-title`;
  return [
    `# Gummy ${component.name}`,
    "",
    `> ${component.description}`,
    "",
    `- Status: ${component.status}`,
    `- Licence: ${component.license}`,
    `- Catalogue group: ${group?.label ?? component.group}`,
    "",
    "## Installation",
    "",
    "```sh",
    component.installCommand,
    "```",
    "",
    "The shadcn-compatible registry copies editable React, TypeScript, and CSS",
    "into the consuming application; it is not a black-box component runtime.",
    "",
    "## Semantics",
    "",
    component.semantics,
    "",
    "## Keyboard behavior",
    "",
    component.keyboard,
    "",
    "## Dependencies",
    "",
    ...dependencyList(component),
    "",
    "## Anatomy and API",
    "",
    ...(api
      ? [
          "Exported React parts:",
          "",
          ...api.components.map((part) => `- \`${part}\``),
          ...api.hooks.map((hook) => `- \`${hook}\` hook`),
          "",
          ...(api.types.length
            ? api.types.flatMap((type) => [
                `### \`${type.name}\``,
                "",
                ...(type.extends.length
                  ? type.extends.map((base) => `Composes \`${base}\`.`)
                  : ["Declares its public properties directly."]),
                ...(type.props.length
                  ? [
                      "",
                      ...type.props.map(
                        (property) =>
                          `- \`${property.name}${property.optional ? "?" : ""}\`: \`${property.type}\``,
                      ),
                    ]
                  : []),
                "",
              ])
            : [
                "Each exported part accepts its underlying native or Base UI",
                "prop contract. Inspect the canonical source for exact generics.",
                "",
              ]),
        ]
      : ["Inspect the canonical source for exported parts and exact types.", ""]),
    "## Themes, RTL, and reduced motion",
    "",
    "- Light and dark modes use the shared semantic and fruit tokens. Set",
    '  `data-theme="dark"` on the root to activate the included dark environment.',
    "- Use the nearest genuine `dir` boundary. Layout uses logical properties;",
    "  any directional key behavior is part of the keyboard contract above.",
    "- Gummy motion styles honor `prefers-reduced-motion: reduce`; preserve visible",
    "  focus, selection, loading, and validation information when motion is reduced.",
    "",
    "## Public source and registry",
    "",
    `- [Source viewer](${sourceViewerUrl})`,
    `- Public source path: \`${component.source}\``,
    `- [Registry payload](${component.registryUrl})`,
    `- [HTML documentation](https://gummyui.dev/components/${component.slug})`,
    documentFooter(componentMarkdownUrl(component.slug)),
  ].join("\n");
}

export function renderCatalogueMarkdown() {
  const lines = [
    "# Gummy UI public component catalogue",
    "",
    `> ${componentCount} stable, MIT-licensed React and TypeScript component categories.`,
    "",
    "Each entry links to a Markdown behavior contract and its public registry",
    "payload. All entries derive from the same catalogue used by the website and",
    "machine-readable JSON API.",
    "",
    "## Install the theme foundation",
    "",
    "```sh",
    "npx shadcn@latest add https://gummyui.dev/r/gummy-base.json",
    "```",
    "",
    "## Core guides",
    "",
    ...markdownGuideSlugs.map((slug) =>
      `- [${slug[0].toUpperCase()}${slug.slice(1)}](${guideMarkdownUrl(slug)})`),
    "",
  ];

  for (const group of catalogueGroups) {
    const groupComponents = components.filter((component) => component.group === group.id);
    lines.push(`## ${group.label}`, "", group.description, "");
    for (const component of groupComponents) {
      lines.push(
        `- [${component.name}](${componentMarkdownUrl(component.slug)}): ${component.description}`,
        `  Registry: ${component.registryUrl}`,
      );
    }
    lines.push("");
  }

  lines.push(
    "## Machine-readable resources",
    "",
    "- Catalogue JSON: https://gummyui.dev/api/catalogue",
    "- Registry index: https://gummyui.dev/registry",
    "- Registry payload pattern: https://gummyui.dev/r/{registry-name}.json",
    "- Agent index: https://gummyui.dev/llms.txt",
    documentFooter(`${markdownDocumentationBaseUrl}/catalogue.md`),
  );
  return lines.join("\n");
}

const guideBodies: Record<MarkdownGuideSlug, () => string[]> = {
  introduction: () => [
    "# Introduction to Gummy UI",
    "",
    `Gummy UI is a public catalogue of ${componentCount} stable React and TypeScript`,
    "component categories. Native HTML behavior is preferred; Base UI supplies",
    "managed focus and composite interaction where those behaviors are needed.",
    "Gummy UI owns the editable Gel Pop material, semantic tokens, and restrained",
    "motion layered on top.",
    "",
    "## What is implemented",
    "",
    "- A manifest-derived component catalogue and detail page for every category.",
    "- Shadcn-compatible registry payloads containing editable source.",
    "- Light and dark tokens, logical RTL behavior, and reduced-motion styles.",
    "- Unit, accessibility, registry-copy, type, and rendered-output checks.",
    "- JSON catalogue, health, agent index, and these Markdown mirrors.",
    "",
    "Start with the [catalogue](../catalogue.md) or the",
    "[installation guide](./installation.md).",
  ],
  installation: () => [
    "# Installation",
    "",
    "Gummy UI is distributed as editable source through a shadcn-compatible",
    "registry. Start with the semantic theme and one component:",
    "",
    "```sh",
    "npx shadcn@latest add https://gummyui.dev/r/gummy-base.json https://gummyui.dev/r/gummy-button.json",
    "```",
    "",
    "Package-manager equivalents use `pnpm dlx`, `yarn dlx`, or `bunx` with the",
    "same `shadcn@latest add` arguments. Each component Markdown page contains its",
    "exact canonical command.",
    "",
    "## After installation",
    "",
    "1. Import the generated theme and component style files once from the",
    "   application's global stylesheet or root layout.",
    "2. Keep the copied source editable in the consuming application.",
    "3. Preserve native or Base UI semantics when changing visual tokens.",
    "4. Run the consuming application's type, lint, behavior, and accessibility checks.",
    "",
    "The release verifier creates independent Next.js and Vite projects, installs",
    "their own dependencies without linking this repository, runs the real shadcn",
    "command against a local HTTP registry, then type-checks and production-builds",
    "each consumer. The complete matrix has passed with npm, pnpm, Yarn, and Bun.",
  ],
  nextjs: () => [
    "# Next.js installation",
    "",
    "Install the theme foundation and Button through the public registry:",
    "",
    "```sh",
    "npx shadcn@latest add https://gummyui.dev/r/gummy-base.json https://gummyui.dev/r/gummy-button.json",
    "```",
    "",
    "The command generates `components/gummy-theme.css`,",
    "`components/gummy-button.css`, and `components/ui/gummy-button.tsx` in the",
    "consumer project. Import the generated CSS from the application's global",
    "stylesheet:",
    "",
    "```css",
    '@import "../components/gummy-theme.css";',
    '@import "../components/gummy-button.css";',
    "```",
    "",
    "Adjust the relative path if the global stylesheet lives somewhere other than",
    "`app/globals.css`. Import `GummyButton` from the generated source and keep the",
    "files editable inside the application.",
    "",
    "## Verification evidence",
    "",
    "The repository's Next.js consumer verifier copies a committed template into",
    "a new temporary directory, performs a clean dependency install, runs the real",
    "shadcn add command against a local HTTP registry, rejects a symlinked",
    "`node_modules`, checks that canonical source was generated, then runs that",
    "isolated project's TypeScript check and production `next build`.",
  ],
  vite: () => [
    "# Vite installation",
    "",
    "Install the same editable theme and component source in a React Vite project:",
    "",
    "```sh",
    "npx shadcn@latest add https://gummyui.dev/r/gummy-base.json https://gummyui.dev/r/gummy-button.json",
    "```",
    "",
    "The command generates `components/gummy-theme.css`,",
    "`components/gummy-button.css`, and `components/ui/gummy-button.tsx`. Import",
    "the generated CSS from `src/index.css` when using the committed fixture",
    "layout:",
    "",
    "```css",
    '@import "../components/gummy-theme.css";',
    '@import "../components/gummy-button.css";',
    "```",
    "",
    "If the source and components directories differ, update those relative paths",
    "rather than importing styles from the Gummy UI website repository.",
    "",
    "## Verification evidence",
    "",
    "The repository's Vite consumer verifier uses a fresh temporary project and",
    "clean dependency install, executes the real shadcn command against a local",
    "HTTP registry, checks the generated files and source boundary, then runs the",
    "isolated fixture's TypeScript check and production Vite build.",
  ],
  theming: () => [
    "# Theming",
    "",
    "The shared theme defines semantic canvas, surface, ink, line, focus, status,",
    "and fruit-family values. Components consume those roles instead of embedding",
    "page-specific colors.",
    "",
    "## Current browser-local builder",
    "",
    "The theme builder at https://gummyui.dev/themes edits light and dark colors,",
    "typography, shape, border width, shadow strength, canvas patterns, pattern",
    "opacity, and five chart roles. It previews real components, resets to local",
    "defaults, copies plain CSS, and encodes shareable configuration in the URL.",
    "It does not upload theme configuration to a server.",
    "",
    "Apply the dark environment with:",
    "",
    "```html",
    '<html data-theme="dark">',
    "```",
    "",
    "Install the base tokens with:",
    "",
    "```sh",
    "npx shadcn@latest add https://gummyui.dev/r/gummy-base.json",
    "```",
  ],
  accessibility: () => [
    "# Accessibility",
    "",
    "Gummy UI targets WCAG 2.2 AA for the public website and shipped component",
    "states. Automated checks support rather than replace keyboard, screen-reader,",
    "zoom, reflow, contrast, touch, RTL, and reduced-motion review.",
    "",
    "## Component contract",
    "",
    "- Prefer native semantics; use Base UI for managed focus and composite behavior.",
    "- Keep labels, instructions, validation, and state text explicit.",
    "- Preserve visible focus and non-color-only state cues.",
    "- Maintain keyboard, pointer, and touch-equivalent paths where applicable.",
    "- Test light/dark contrast, RTL, reflow, and reduced motion.",
    "",
    "The catalogue records each component's actual semantics and keyboard contract.",
    "Local Vitest, Testing Library, axe, contrast, and registry checks cover",
    "implemented states. Full manual assistive-technology verification remains a",
    "release gate and is not represented here as complete.",
  ],
  rtl: () => [
    "# Right-to-left behavior",
    "",
    "Set `dir=\"rtl\"` at the document root for an RTL product. Use the public",
    "Direction component only for genuine scoped mixed-direction content.",
    "",
    "## Implementation rules",
    "",
    "- Use inline/block logical CSS properties instead of left/right layout rules.",
    "- Mirror directional icons and horizontal key deltas, not neutral symbols.",
    "- Keep inherently LTR values such as verification codes in an explicit inner",
    "  LTR boundary.",
    "- Test Arabic, Persian, or Hebrew content rather than checking geometry alone.",
    "",
    "Component pages state the relevant keyboard behavior. The live RTL page at",
    "https://gummyui.dev/rtl demonstrates scoped Direction, Slider, and Pagination.",
  ],
  localisation: () => [
    "# Localisation review and publication",
    "",
    "English (`en`) is the only reviewed and published Gummy UI locale today.",
    "The locale manifest records 19 additional benchmark targets as",
    "`pending-linguistic-review`. Native language names identify those targets;",
    "they do not claim that translated interface copy exists.",
    "",
    "## Route and discovery rules",
    "",
    "- English remains on unprefixed canonical routes.",
    "- Accept-Language negotiation only considers published locales.",
    "- A pending locale cannot receive a public route or switcher link.",
    "- Hreflang and sitemap alternates contain only published equivalents.",
    "- Missing messages must fail review instead of falling back beneath a",
    "  non-English URL.",
    "",
    "## Human review gate",
    "",
    "A fluent reviewer must approve meaning, grammar, terminology, tone, plural",
    "rules, formatting, metadata, and rendered context against a recorded English",
    "source revision. Keyboard, zoom, responsive, dark-mode, screen-reader, and",
    "reduced-motion checks are required. Persian, Hebrew, and Arabic additionally",
    "require a bidirectional and logical-layout audit.",
    "",
    "Only after those checks pass may a locale be marked `published`, enabling its",
    "routes, language-switcher link, sitemap alternate, and availability claim.",
    "The current status table is at https://gummyui.dev/locales.",
  ],
  "editor-setup": () => [
    "# AI editor setup",
    "",
    "Give an editor the public, inspectable discovery surfaces rather than a",
    "private package path:",
    "",
    "- Agent index: https://gummyui.dev/llms.txt",
    `- Markdown catalogue: ${markdownDocumentationBaseUrl}/catalogue.md`,
    "- Catalogue JSON: https://gummyui.dev/api/catalogue",
    "- Registry payloads: https://gummyui.dev/r/{registry-name}.json",
    "",
    "Ask the editor to select the canonical item from the catalogue and run its",
    "exact shadcn install command. For example:",
    "",
    "```sh",
    "npx shadcn@latest add https://gummyui.dev/r/gummy-base.json https://gummyui.dev/r/gummy-button.json",
    "```",
    "",
    "The generated CSS and TypeScript belong in the consumer repository. Review",
    "the diff, preserve native or Base UI behavior, and run the application's own",
    "type, lint, behavior, accessibility, and build checks.",
    "",
    "A hosted MCP transport is not currently advertised as live. Until its",
    "authentication, rate limits, monitoring, and production deployment are",
    "verified, editors should use the public HTTP catalogue, Markdown contracts,",
    "and registry payloads without claiming MCP connectivity.",
  ],
  mcp: () => [
    "# AI and MCP discovery",
    "",
    "The public HTTP discovery surfaces are implemented:",
    "",
    "- Catalogue JSON: https://gummyui.dev/api/catalogue",
    "- Agent index: https://gummyui.dev/llms.txt",
    `- Markdown catalogue: ${markdownDocumentationBaseUrl}/catalogue.md`,
    "- Registry payloads: https://gummyui.dev/r/{registry-name}.json",
    "- Health signal: https://gummyui.dev/api/health",
    "",
    "## Transport status",
    "",
    "A hosted MCP transport is not currently advertised as live. Authentication,",
    "rate limits, monitoring, and production deployment remain release gates.",
    "Agents should use the public HTTP catalogue, Markdown contracts, and registry",
    "payloads without attempting to infer or retrieve separate paid assets.",
  ],
  troubleshooting: () => [
    "# Troubleshooting",
    "",
    "## Registry item returns 404",
    "",
    "Use the exact `registryUrl` from the catalogue or component Markdown page.",
    "Registry names use the `gummy-{slug}` form.",
    "",
    "## Component renders without Gummy material",
    "",
    "Confirm that the generated shared style files are imported once in the global",
    "stylesheet or root layout. Re-run the canonical component install command so",
    "the registry can resolve its shared style dependencies.",
    "",
    "## Base UI import cannot be resolved",
    "",
    "Install through the registry command rather than copying one TypeScript file.",
    "The registry payload declares `@base-ui/react` where it is required.",
    "",
    "## Dark or RTL behavior is missing",
    "",
    "Use `data-theme=\"dark\"` for the dark environment and set a genuine `dir`",
    "boundary. Do not simulate RTL only by reversing a flex row.",
    "",
    "## Motion remains enabled",
    "",
    "Check that the generated component style payload is imported and that no",
    "application rule overrides `prefers-reduced-motion: reduce`.",
    "",
    "## Source viewer cannot load",
    "",
    "Open the component's public registry URL directly. Its JSON payload contains",
    "the same editable files used by the source viewer.",
  ],
};

export function renderGuideMarkdown(slug: MarkdownGuideSlug) {
  return [
    ...guideBodies[slug](),
    documentFooter(guideMarkdownUrl(slug)),
  ].join("\n");
}

export function renderMarkdownDocument(pathname: string) {
  if (pathname === "catalogue.md") return renderCatalogueMarkdown();

  const componentMatch = /^components\/([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/.exec(pathname);
  if (componentMatch) {
    const component = getComponent(componentMatch[1]);
    return component ? renderComponentMarkdown(component) : undefined;
  }

  const guideMatch = /^guides\/([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/.exec(pathname);
  if (guideMatch && markdownGuideSlugs.includes(guideMatch[1] as MarkdownGuideSlug)) {
    return renderGuideMarkdown(guideMatch[1] as MarkdownGuideSlug);
  }
  return undefined;
}
