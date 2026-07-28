import { articles } from "../data/articles";
import { components } from "../data/catalogue";

export function GET() {
  const lines = [
    "# Gummy UI",
    "",
    "> Open-source React and TypeScript component source with tactile Gel Pop material, native, Base UI, and Radix UI behavior, RTL, dark mode, and reduced motion.",
    "",
    "## Canonical public resources",
    "",
    "- Documentation: https://gummyui.dev/docs",
    "- Next.js guide: https://gummyui.dev/docs/nextjs",
    "- Vite guide: https://gummyui.dev/docs/vite",
    "- Editor and agent setup: https://gummyui.dev/docs/editor-setup",
    "- Troubleshooting: https://gummyui.dev/docs/troubleshooting",
    "- Component catalogue: https://gummyui.dev/components",
    "- Markdown catalogue: https://gummyui.dev/docs/markdown/catalogue.md",
    "- Markdown component contracts: https://gummyui.dev/docs/markdown/components/{component-slug}.md",
    "- Markdown guides: https://gummyui.dev/docs/markdown/guides/{guide-slug}.md",
    "- Machine-readable catalogue: https://gummyui.dev/api/catalogue",
    "- Registry index: https://gummyui.dev/registry",
    "- Registry payloads: https://gummyui.dev/r/{registry-name}.json",
    "- MCP and agent guidance: https://gummyui.dev/mcp",
    "- Language publication status: https://gummyui.dev/locales",
    "- Localisation review guide: https://gummyui.dev/docs/markdown/guides/localisation.md",
    "- Original articles: https://gummyui.dev/blog",
    "- Article RSS: https://gummyui.dev/rss.xml",
    "- Public changelog RSS: https://gummyui.dev/changelog.xml",
    "- Licence: https://gummyui.dev/license",
    "",
    `## Components (${components.length})`,
    "",
    ...components.map((component) =>
      `- [${component.name}](https://gummyui.dev/docs/markdown/components/${component.slug}.md): ${component.description} HTML: https://gummyui.dev/components/${component.slug} Base registry: ${component.registryUrl}${component.radixRegistryUrl ? ` Radix registry: ${component.radixRegistryUrl}` : ""}`,
    ),
    "",
    `## Original articles (${articles.length})`,
    "",
    ...articles.map(
      (article) =>
        `- [${article.title}](https://gummyui.dev/blog/${article.slug}): ${article.description}`,
    ),
    "",
    "## Source boundary",
    "",
    "The public catalogue is MIT licensed. Paid Pro block, template, design-kit, release, and entitlement source is not exposed by public routes or registry payloads.",
  ];
  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=3600",
      "x-content-type-options": "nosniff",
    },
  });
}
