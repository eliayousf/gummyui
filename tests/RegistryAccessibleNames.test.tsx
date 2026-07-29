import { cleanup, render, screen } from "@testing-library/react";
import { readFile } from "node:fs/promises";
import { afterEach, describe, expect, it } from "vitest";
import RegistryPage from "../app/registry/page";

afterEach(cleanup);

describe("registry link accessible names", () => {
  it("gives every Base payload a unique name without excessive page links", () => {
    render(<RegistryPage />);

    expect(
      screen.getByRole("link", { name: "Accordion Base registry" }),
    ).toHaveAttribute("href", "/r/gummy-accordion.json");
    expect(
      screen.queryByRole("link", { name: "Accordion Radix registry" }),
    ).not.toBeInTheDocument();

    const allLinks = screen.getAllByRole("link");
    const registryLinks = allLinks
      .filter((link) => link.getAttribute("href")?.startsWith("/r/"));
    const accessibleNames = registryLinks.map((link) =>
      link.textContent?.trim(),
    );

    expect(registryLinks).toHaveLength(57);
    expect(new Set(accessibleNames).size).toBe(registryLinks.length);
    expect(allLinks.length).toBeLessThanOrEqual(100);
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
