import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import AccessibilityPage from "../app/accessibility/page";
import ContactPage from "../app/contact/page";
import EditorSetupPage from "../app/docs/editor-setup/page";
import NextJsGuidePage from "../app/docs/nextjs/page";
import TroubleshootingPage from "../app/docs/troubleshooting/page";
import ViteGuidePage from "../app/docs/vite/page";
import { serviceProviders } from "../app/data/subprocessors";
import RegistryPage from "../app/registry/page";
import sitemap from "../app/sitemap";
import SubprocessorsPage, {
  metadata as subprocessorsMetadata,
} from "../app/subprocessors/page";
import SupportPage from "../app/support/page";

afterEach(cleanup);

function mainWordCount(Page: () => React.JSX.Element) {
  const { container } = render(<Page />);
  const text = container.querySelector("main")?.textContent ?? "";
  cleanup();
  return text.trim().split(/\s+/u).filter(Boolean).length;
}

describe("substantive public guidance", () => {
  it.each([
    ["accessibility", AccessibilityPage],
    ["support", SupportPage],
    ["contact", ContactPage],
    ["Next.js guide", NextJsGuidePage],
    ["Vite guide", ViteGuidePage],
    ["editor setup", EditorSetupPage],
    ["troubleshooting", TroubleshootingPage],
    ["registry", RegistryPage],
    ["subprocessors", SubprocessorsPage],
  ])("keeps %s above the thin-content floor", (_name, Page) => {
    expect(mainWordCount(Page)).toBeGreaterThanOrEqual(300);
  });
});

describe("subprocessor discovery contract", () => {
  it("publishes a unique, bounded directory without credentials", () => {
    expect(serviceProviders).toHaveLength(7);
    expect(new Set(serviceProviders.map(({ name }) => name)).size).toBe(7);

    const { container } = render(<SubprocessorsPage />);
    const content = container.querySelector("main")?.textContent ?? "";
    expect(content).toMatch(/service-provider and subprocessor directory/iu);
    for (const provider of serviceProviders) {
      expect(content).toContain(provider.name);
      expect(provider.dataContext.length).toBeGreaterThanOrEqual(40);
      expect(provider.role.length).toBeGreaterThanOrEqual(40);
    }
    expect(content).not.toMatch(
      /\b(?:api[_-]?key|client[_-]?secret|password|recovery code)\s*[:=]/iu,
    );
  });

  it("is indexable, canonical and present in the sitemap", () => {
    expect(subprocessorsMetadata.robots).toMatchObject({
      index: true,
      follow: true,
    });
    expect(subprocessorsMetadata.alternates).toEqual({
      canonical: "/subprocessors",
    });
    expect(String(subprocessorsMetadata.title).length).toBeGreaterThanOrEqual(30);
    expect(String(subprocessorsMetadata.title).length).toBeLessThanOrEqual(60);
    expect(String(subprocessorsMetadata.description).length).toBeGreaterThanOrEqual(120);
    expect(String(subprocessorsMetadata.description).length).toBeLessThanOrEqual(160);
    const subprocessorSitemapEntry = sitemap().find(
      ({ url }) => new URL(url).pathname === "/subprocessors",
    );
    expect(subprocessorSitemapEntry).toMatchObject({
      url: "https://gummyui.dev/subprocessors",
      lastModified: new Date("2026-07-29"),
    });
  });
});
