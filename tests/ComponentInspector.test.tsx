import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFile } from "node:fs/promises";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";
import {
  ComponentInspector,
  componentPreviewRenderers,
  componentPreviewSlugs,
} from "../app/components/ComponentInspectorRuntime";
import {
  ComponentInspector as DeferredComponentInspector,
} from "../app/components/ComponentInspector";
import {
  RadixComponentInspector as DeferredRadixComponentInspector,
} from "../app/components/RadixComponentInspector";
import { components } from "../app/data/catalogue";
import { getComponentPreviewStylesheet } from "../app/data/component-preview-styles";

afterEach(() => {
  cleanup();
  delete document.documentElement.dataset.theme;
});

async function resolveStylesheetResources(hrefs: readonly string[]) {
  for (const href of hrefs) {
    const preload = await waitFor(() => {
      const resource = document.querySelector<HTMLLinkElement>(
        `link[rel="preload"][href="${href}"]`,
      );
      expect(resource).toBeInTheDocument();
      return resource!;
    });
    preload.dispatchEvent(new Event("load"));
  }

  for (const href of hrefs) {
    const stylesheet = await waitFor(() => {
      const resource = document.querySelector<HTMLLinkElement>(
        `link[rel="stylesheet"][href="${href}"]`,
      );
      expect(resource).toBeInTheDocument();
      return resource!;
    });
    stylesheet.dispatchEvent(new Event("load"));
  }
}

describe("component detail inspector", () => {
  it("is mounted by the shared detail route with its standalone stylesheet", async () => {
    const [detailRoute, componentsLayout, detailLayout, rootLayout] = await Promise.all([
      readFile("app/components/[slug]/page.tsx", "utf8"),
      readFile("app/components/layout.tsx", "utf8"),
      readFile("app/components/[slug]/layout.tsx", "utf8"),
      readFile("app/layout.tsx", "utf8"),
    ]);

    expect(detailRoute).toContain("previewStylesheet={previewStylesheet}");
    expect(componentsLayout).not.toContain("component-docs.css");
    expect(detailLayout).toContain('href="/styles/component-inspector.css"');
    expect(rootLayout).not.toContain("component-inspector.css");
  });

  it("defers the all-family preview runtime until the reader asks for it", async () => {
    const user = userEvent.setup();
    render(
      <DeferredComponentInspector
        slug="card"
        componentName="Card"
        previewStylesheet="/styles/gummy-core-components.css"
      />,
    );

    expect(
      screen.getByRole("button", { name: "Load interactive preview" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Preview width" })).toBeNull();
    expect(
      document.querySelector(
        'link[rel="stylesheet"][href="/styles/gummy-core-components.css"]',
      ),
    ).toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Load interactive preview" }),
    );
    await resolveStylesheetResources([
      "/styles/gummy-core-components.css",
    ]);
    expect(
      await screen.findByRole("group", { name: "Preview width" }),
    ).toBeInTheDocument();
    expect(
      document.querySelector(
        'link[rel="stylesheet"][href="/styles/gummy-core-components.css"]',
      ),
    ).toBeInTheDocument();
  });

  it("defers the all-family Radix runtime until the reader asks for it", async () => {
    const user = userEvent.setup();
    render(
      <DeferredRadixComponentInspector
        slug="toggle"
        componentName="Toggle"
        previewStylesheet="/styles/gummy-primitives.css"
      />,
    );

    expect(
      screen.getByRole("button", { name: "Load Radix preview" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pin release" })).toBeNull();
    expect(
      document.querySelector(
        'link[rel="stylesheet"][href="/styles/gummy-radix-compat.css"]',
      ),
    ).toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Load Radix preview" }),
    );
    await resolveStylesheetResources([
      "/styles/gummy-primitives.css",
      "/styles/gummy-radix-compat.css",
    ]);
    expect(
      await screen.findByRole("button", { name: "Pin release" }),
    ).toBeInTheDocument();
    expect(
      document.querySelector(
        'link[rel="stylesheet"][href="/styles/gummy-primitives.css"]',
      ),
    ).toBeInTheDocument();
    expect(
      document.querySelector(
        'link[rel="stylesheet"][href="/styles/gummy-radix-compat.css"]',
      ),
    ).toBeInTheDocument();
  });

  it("maps every catalogue preview to its public registry style family", async () => {
    const registry = JSON.parse(
      await readFile("registry.json", "utf8"),
    ) as {
      items: Array<{
        name: string;
        registryDependencies?: string[];
      }>;
    };

    for (const component of components) {
      const item = registry.items.find(({ name }) => name === component.registryName);
      expect(item, component.registryName).toBeDefined();
      const styleDependency = item?.registryDependencies?.find((dependency) =>
        /gummy-(?:core|form|primitives)-styles\.json$/.test(dependency),
      );
      const expectedStylesheet = styleDependency
        ?.replace("https://gummyui.dev/r/gummy-core-styles.json", "/styles/gummy-core-components.css")
        .replace("https://gummyui.dev/r/gummy-form-styles.json", "/styles/gummy-form-controls.css")
        .replace("https://gummyui.dev/r/gummy-primitives-styles.json", "/styles/gummy-primitives.css")
        ?? null;

      expect(getComponentPreviewStylesheet(component.slug)).toBe(
        expectedStylesheet,
      );
    }
  });

  it("provides a real canonical preview renderer for every catalogue slug", () => {
    const catalogueSlugs = components.map(({ slug }) => slug).sort();

    expect([...componentPreviewSlugs].sort()).toEqual(catalogueSlugs);
    expect(componentPreviewSlugs).toHaveLength(57);

    for (const slug of catalogueSlugs) {
      const renderPreview = componentPreviewRenderers[slug];
      expect(renderPreview, `${slug} preview renderer`).toBeTypeOf("function");
      expect(React.isValidElement(renderPreview()), `${slug} preview element`).toBe(true);
    }
  });

  it("keeps width, theme, and direction controls keyboard-accessible and locally scoped", async () => {
    const user = userEvent.setup();
    document.documentElement.dataset.theme = "light";

    render(<ComponentInspector slug="button" componentName="Button" />);

    expect(screen.getByRole("group", { name: "Preview width" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Preview theme" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Preview direction" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fluid" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Light" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "LTR" })).toHaveAttribute("aria-pressed", "true");

    const compact = screen.getByRole("button", { name: "320px" });
    compact.focus();
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("button", { name: "Dark" }));
    await user.click(screen.getByRole("button", { name: "RTL" }));

    expect(compact).toHaveAttribute("aria-pressed", "true");
    const viewport = document.querySelector<HTMLElement>(".component-inspector__viewport");
    expect(viewport).toHaveAttribute("data-preview-viewport", "compact");
    expect(viewport).toHaveAttribute("data-preview-theme", "dark");
    expect(viewport).toHaveAttribute("data-preview-direction", "rtl");
    expect(viewport).toHaveAttribute("dir", "rtl");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(document.querySelector('[data-component-preview="button"]')).toBeInTheDocument();
  });

  it("keeps the Select accessible name aligned with its visible value", () => {
    render(<ComponentInspector slug="select" componentName="Select" />);

    expect(
      screen.getByRole("combobox", { name: "Grape, accent fruit" }),
    ).toHaveTextContent("Grape");
  });

  it("keeps the pagination specimen out of the crawlable query namespace", () => {
    render(<ComponentInspector slug="pagination" componentName="Pagination" />);

    const previewLinks = Array.from(
      document.querySelectorAll<HTMLAnchorElement>(
        '[data-component-preview="pagination"] a',
      ),
    );
    expect(previewLinks).toHaveLength(4);
    for (const link of previewLinks) {
      expect(link.getAttribute("href")).toMatch(/^#component-preview-page-/);
      expect(link.getAttribute("href")).not.toContain("?");
    }
  });
});
