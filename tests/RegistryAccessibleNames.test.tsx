import { cleanup, render, screen } from "@testing-library/react";
import { readFile } from "node:fs/promises";
import { afterEach, describe, expect, it } from "vitest";
import RegistryPage from "../app/registry/page";

afterEach(cleanup);

describe("registry link accessible names", () => {
  it("distinguishes repeated Base and Radix links by component", () => {
    render(<RegistryPage />);

    expect(
      screen.getByRole("link", { name: "Accordion Base registry" }),
    ).toHaveAttribute("href", "/r/gummy-accordion.json");
    expect(
      screen.getByRole("link", { name: "Accordion Radix registry" }),
    ).toHaveAttribute("href", "/r/gummy-radix-accordion.json");

    const registryLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href")?.startsWith("/r/"));
    const accessibleNames = registryLinks.map((link) =>
      link.textContent?.trim(),
    );

    expect(registryLinks.length).toBeGreaterThan(50);
    expect(new Set(accessibleNames).size).toBe(registryLinks.length);
  });
});

describe("Component Lab accessible names", () => {
  it("keeps the Select accessible name aligned with its visible value", async () => {
    const source = await readFile("app/components/ComponentLab.tsx", "utf8");

    expect(source).toContain(
      '<GummySelectTrigger aria-label="Grape, accent fruit" />',
    );
  });
});
