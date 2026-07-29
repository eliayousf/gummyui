import { cleanup, render } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import LocalesPage from "../app/locales/page";
import NotFoundPage from "../app/not-found";
import RegistryPage from "../app/registry/page";

afterEach(cleanup);

describe("audit-facing public pages", () => {
  it.each([
    ["language status", LocalesPage],
    ["not found", NotFoundPage],
    ["registry", RegistryPage],
  ])("has no automated accessibility violations on the %s page", async (
    _name,
    Page,
  ) => {
    const { container } = render(<Page />);
    const results = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: false },
      },
    });

    expect(
      results.violations.map(({ id, help, nodes }) => ({
        id,
        help,
        targets: nodes.flatMap((node) => node.target),
      })),
    ).toEqual([]);
  });
});
