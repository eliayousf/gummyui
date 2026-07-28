import { cleanup, render } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import {
  componentPreviewRenderers,
  componentPreviewSlugs,
} from "../app/components/ComponentInspectorRuntime";

afterEach(cleanup);

describe("complete component-catalogue accessibility", () => {
  it.each(componentPreviewSlugs)(
    "%s has no serious or critical automated violations in its canonical preview",
    async (slug) => {
      const renderPreview = componentPreviewRenderers[slug];
      const { container } = render(
        <main>
          <h1>{slug} canonical preview</h1>
          {renderPreview()}
        </main>,
      );
      const results = await axe.run(container, {
        resultTypes: ["violations"],
        rules: {
          // JSDOM has no layout/canvas engine. Token contrast is covered by
          // dedicated source-token tests and must still be reviewed rendered.
          "color-contrast": { enabled: false },
          region: { enabled: false },
        },
      });
      const blocking = results.violations.filter(
        ({ impact }) => impact === "critical" || impact === "serious",
      );

      expect(
        blocking.map(({ id, help, impact, nodes }) => ({
          id,
          help,
          impact,
          targets: nodes.flatMap((node) => node.target),
        })),
      ).toEqual([]);
    },
    15_000,
  );
});
