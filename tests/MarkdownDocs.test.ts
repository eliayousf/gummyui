import { describe, expect, it } from "vitest";
import { GET } from "../app/docs/markdown/[...path]/route";
import {
  markdownGuideSlugs,
  renderMarkdownDocument,
} from "../app/data/markdown-docs";
import { componentCount, components } from "../app/data/catalogue";

const baseUrl = "https://gummyui.dev/docs/markdown";

function requestMarkdown(pathname: string) {
  return GET(new Request(`${baseUrl}/${pathname}`));
}

function expectMarkdownHeaders(response: Response, cacheControl: string) {
  expect(response.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
  expect(response.headers.get("cache-control")).toBe(cacheControl);
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
}

describe("AI-readable Markdown documentation", () => {
  it("publishes an exact manifest-derived catalogue of all 57 components", async () => {
    const response = requestMarkdown("catalogue.md");
    const markdown = await response.text();
    const documentedSlugs = [...markdown.matchAll(
      /https:\/\/gummyui\.dev\/docs\/markdown\/components\/([a-z0-9-]+)\.md/g,
    )].map((match) => match[1]);

    expect(response.status).toBe(200);
    expectMarkdownHeaders(
      response,
      "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    );
    expect(componentCount).toBe(57);
    expect(documentedSlugs).toHaveLength(57);
    expect(new Set(documentedSlugs)).toEqual(new Set(components.map(({ slug }) => slug)));
    expect(markdown).toContain("MIT-licensed");
    expect(markdown).toContain("https://gummyui.dev/api/catalogue");
  });

  it("renders a complete behavior and source contract for every component", async () => {
    for (const component of components) {
      const response = requestMarkdown(`components/${component.slug}.md`);
      const markdown = await response.text();

      expect(response.status, component.slug).toBe(200);
      expectMarkdownHeaders(
        response,
        "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      );
      expect(markdown).toContain(`# Gummy ${component.name}`);
      expect(markdown).toContain(component.installCommand);
      expect(markdown).toContain(component.semantics);
      expect(markdown).toContain(component.keyboard);
      expect(markdown).toContain("## Dependencies");
      expect(markdown).toContain("## Anatomy and API");
      expect(markdown).toMatch(/Exported React parts:[\s\S]*`Gummy/);
      for (const dependency of component.dependencies) {
        expect(markdown).toContain(`\`${dependency}\``);
      }
      expect(markdown).toContain("Light and dark modes");
      expect(markdown).toContain("RTL");
      expect(markdown).toContain("prefers-reduced-motion");
      expect(markdown).toContain(`Public source path: \`${component.source}\``);
      expect(markdown).toContain(component.registryUrl);
      expect(markdown).toContain("MIT licensed");
      expect(markdown).toContain(`Status: ${component.status}`);
    }
  });

  it("publishes the eleven implemented core guides with honest current-state guidance", async () => {
    expect(markdownGuideSlugs).toEqual([
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
    ]);

    const expectedContent = {
      introduction: "57 stable React and TypeScript",
      installation: "shadcn-compatible",
      nextjs: "production `next build`",
      vite: "production Vite build",
      theming: "browser-local builder",
      accessibility: "WCAG 2.2 AA",
      rtl: 'dir="rtl"',
      localisation: "only reviewed and published Gummy UI locale",
      "editor-setup": "hosted MCP transport is not currently advertised as live",
      mcp: "hosted MCP transport is not currently advertised as live",
      troubleshooting: "Registry item returns 404",
    } as const;

    for (const guide of markdownGuideSlugs) {
      const response = requestMarkdown(`guides/${guide}.md`);
      const markdown = await response.text();
      expect(response.status, guide).toBe(200);
      expect(markdown).toContain(expectedContent[guide]);
      expect(markdown).toContain("MIT licensed");
    }
  });

  it("rejects unknown, malformed, and non-namespaced documents as hardened Markdown", async () => {
    for (const url of [
      `${baseUrl}/components/not-real.md`,
      `${baseUrl}/guides/not-real.md`,
      `${baseUrl}/components/button`,
      "https://gummyui.dev/docs/other.md",
      `${baseUrl}/components/%5Cprivate.md`,
    ]) {
      const response = GET(new Request(url));
      expect(response.status, url).toBe(404);
      expectMarkdownHeaders(response, "no-store");
      expect(await response.text()).toContain("Documentation not found");
    }
  });

  it("does not expose paid paths, local paths, or private implementation fields", () => {
    const documents = [
      renderMarkdownDocument("catalogue.md"),
      ...components.map(({ slug }) => renderMarkdownDocument(`components/${slug}.md`)),
      ...markdownGuideSlugs.map((slug) => renderMarkdownDocument(`guides/${slug}.md`)),
    ].join("\n");

    expect(documents).not.toMatch(
      /gummyui-pro|\/Users\/|(?:^|\/)\.\.(?:\/|$)|figma\/|releases\/|entitlement|sampleContent|sourceReference/i,
    );
  });
});
