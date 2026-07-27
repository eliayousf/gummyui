import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFile } from "node:fs/promises";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";
import {
  ComponentInspector,
  componentPreviewRenderers,
  componentPreviewSlugs,
} from "../app/components/ComponentInspector";
import { components } from "../app/data/catalogue";

afterEach(() => {
  cleanup();
  delete document.documentElement.dataset.theme;
});

describe("component detail inspector", () => {
  it("is mounted by the shared detail route with its standalone stylesheet", async () => {
    const [detailRoute, layout, rootLayout] = await Promise.all([
      readFile("app/components/[slug]/page.tsx", "utf8"),
      readFile("app/components/layout.tsx", "utf8"),
      readFile("app/layout.tsx", "utf8"),
    ]);

    expect(detailRoute).toMatch(/<ComponentInspector slug=\{component\.slug\} componentName=\{component\.name\} \/>/);
    expect(layout).toContain('href="/styles/component-inspector.css"');
    expect(rootLayout).not.toContain("component-inspector.css");
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
});
