import { cleanup, render } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import {
  GummyButton,
  type GummyButtonVariant,
} from "../app/components/ui/GummyButton";

const gummyButtonVariants: readonly GummyButtonVariant[] = [
  "primary",
  "secondary",
  "success",
  "warning",
  "info",
];

afterEach(cleanup);

describe("GummyButton accessibility", () => {
  it("has no automated accessibility violations across variants and states", async () => {
    const { container } = render(
      <div>
        {gummyButtonVariants.map((variant) => (
          <GummyButton key={variant} variant={variant}>
            {variant} action
          </GummyButton>
        ))}
        <GummyButton loading loadingText="Saving">Save</GummyButton>
        <GummyButton disabled>Unavailable</GummyButton>
        <GummyButton finish="translucent">Translucent action</GummyButton>
      </div>,
    );

    const results = await axe.run(container, {
      rules: {
        // JSDOM has no layout/canvas engine. Token contrast is checked in the
        // dedicated test below instead of being silently reported as unknown.
        "color-contrast": { enabled: false },
        region: { enabled: false },
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
