import { readFile } from "node:fs/promises";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { CompositionShowcase } from "../app/components/CompositionShowcase";
import { metadata as componentLabMetadata } from "../app/components/lab/page";
import { proTemplates } from "../app/data/pro-catalogue";
import SignInPage, { metadata as signInMetadata } from "../app/sign-in/page";
import { generateMetadata as generatePreviewMetadata } from "../app/templates/[slug]/preview/page";
import ThemesPage from "../app/themes/page";
import { StandaloneSwitchSpecimen } from "../lib/presentation/StandaloneSwitchSpecimen";

afterEach(cleanup);

function expectBoundedDescription(metadata: {
  description?: unknown;
}) {
  expect(metadata.description).toBeTypeOf("string");
  expect(String(metadata.description).length).toBeGreaterThanOrEqual(120);
  expect(String(metadata.description).length).toBeLessThanOrEqual(160);
}

function renderedMainWordCount(): number {
  const words = document.querySelector("main")?.textContent?.match(/\b[\p{L}\p{N}’'-]+\b/gu);
  return words?.length ?? 0;
}

describe("audit-facing route metadata", () => {
  it("keeps noindex utility pages canonical with substantive descriptions", () => {
    expectBoundedDescription(componentLabMetadata);
    expect(componentLabMetadata.alternates).toEqual({
      canonical: "/components/lab",
    });
    expectBoundedDescription(signInMetadata);
    expect(signInMetadata.alternates).toEqual({ canonical: "/sign-in" });
  });

  it("does not invite crawlers or prefetching into the external authentication chain", () => {
    render(<SignInPage />);

    expect(
      screen.getByRole("link", { name: "Continue to secure sign-in" }),
    ).toHaveAttribute("rel", "nofollow");
  });

  it("keeps every protected template preview canonical, noindex, and substantive", async () => {
    for (const template of proTemplates) {
      const metadata = await generatePreviewMetadata({
        params: Promise.resolve({ slug: template.slug }),
      });
      expectBoundedDescription(metadata);
      expect(metadata.alternates).toEqual({
        canonical: `/templates/${template.slug}/preview`,
      });
      expect(metadata.robots).toMatchObject({
        index: false,
        follow: false,
        noarchive: true,
      });
    }
  });
});

describe("crawlable component specimens", () => {
  it("gives homepage and Theme Builder visitors substantive decision guidance", () => {
    render(<CompositionShowcase />);
    expect(renderedMainWordCount()).toBeGreaterThan(325);

    cleanup();
    render(<ThemesPage />);
    expect(renderedMainWordCount()).toBeGreaterThan(325);
  });

  it("keeps standalone switch semantics and keyboard behavior without a hidden form proxy", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <main>
        <h1>Component specimen</h1>
        <StandaloneSwitchSpecimen label="Weekly digest" defaultChecked />
      </main>,
    );
    const control = screen.getByRole("switch", { name: "Weekly digest" });

    expect(control).toHaveAttribute("aria-checked", "true");
    expect(container.querySelector("input")).toBeNull();
    await user.click(control);
    expect(control).toHaveAttribute("aria-checked", "false");
    control.focus();
    await user.keyboard(" ");
    expect(control).toHaveAttribute("aria-checked", "true");

    const results = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: false },
        region: { enabled: false },
      },
    });
    expect(results.violations.map(({ id }) => id)).toEqual([]);
  });

  it("keeps Lab visible text as the accessible name and decorative previews noninteractive", async () => {
    const source = await readFile("app/components/ComponentLab.tsx", "utf8");

    expect(source).toContain(
      '<GummySliderThumb aria-label="Frame padding" />',
    );
    expect(source).not.toMatch(
      /aria-label="(?:Gummy UI Component Lab home|Open Project pulse details|Selected Project pulse card|Select Project pulse)"/,
    );
    expect(source).not.toContain(
      "aria-label={`Sort projects, currently ${sort}`}",
    );

    const preview = source.slice(
      source.indexOf("function DialogPreviewContents"),
      source.indexOf("function DialogDemo"),
    );
    expect(preview).not.toMatch(/<GummyButton|<button/);
  });
});
