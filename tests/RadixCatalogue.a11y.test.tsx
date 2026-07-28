import { cleanup, render } from "@testing-library/react";
import axe from "axe-core";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { RadixComponentInspector } from "../app/components/RadixComponentInspectorRuntime";

afterEach(cleanup);

const originalResizeObserver = globalThis.ResizeObserver;

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterAll(() => {
  globalThis.ResizeObserver = originalResizeObserver;
});

const radixComponents = [
  ["accordion", "Accordion"],
  ["alert-dialog", "Alert Dialog"],
  ["collapsible", "Collapsible"],
  ["context-menu", "Context Menu"],
  ["dialog", "Dialog"],
  ["direction", "Direction"],
  ["drawer", "Drawer"],
  ["dropdown-menu", "Dropdown Menu"],
  ["hover-card", "Hover Card"],
  ["menubar", "Menubar"],
  ["navigation-menu", "Navigation Menu"],
  ["popover", "Popover"],
  ["scroll-area", "Scroll Area"],
  ["select", "Select"],
  ["sheet", "Sheet"],
  ["slider", "Slider"],
  ["sonner", "Sonner"],
  ["switch", "Switch"],
  ["tabs", "Tabs"],
  ["toggle", "Toggle"],
  ["toggle-group", "Toggle Group"],
  ["tooltip", "Tooltip"],
] as const;

describe("Radix counterpart catalogue accessibility", () => {
  for (const [slug, name] of radixComponents) {
    it(`${name} has no automated violations in its documented resting state`, async () => {
      const { container } = render(
        <main>
          <h1>{name}</h1>
          <RadixComponentInspector slug={slug} componentName={name} />
        </main>,
      );
      const results = await axe.run(container, {
        rules: {
          "color-contrast": { enabled: false },
          region: { enabled: false },
        },
      });
      expect(results.violations.map(({ id }) => id)).toEqual([]);
    });
  }
});
