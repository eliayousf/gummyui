import { cleanup, render } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { GummyButton } from "../app/components/ui/GummyButton";
import { GummyButtonGroup } from "../app/components/ui/GummyButtonGroup";
import {
  GummySlider,
  GummySliderControl,
  GummySliderLabel,
  GummySliderThumb,
  GummySliderValue,
} from "../app/components/ui/GummySlider";
import { GummyToggle } from "../app/components/ui/GummyToggle";
import {
  GummyToggleGroup,
  GummyToggleGroupItem,
} from "../app/components/ui/GummyToggleGroup";

afterEach(cleanup);

describe("Stage 3 selection controls accessibility", () => {
  it("has no automated violations across representative states", async () => {
    const { container } = render(
      <main>
        <h1>Selection controls</h1>
        <GummyButtonGroup label="Document actions">
          <GummyButton>Save</GummyButton>
          <GummyButton variant="secondary">Share</GummyButton>
        </GummyButtonGroup>
        <GummySlider defaultValue={55}>
          <GummySliderLabel>Opacity</GummySliderLabel>
          <GummySliderValue />
          <GummySliderControl><GummySliderThumb /></GummySliderControl>
        </GummySlider>
        <GummySlider defaultValue={[20, 80]}>
          <GummySliderLabel>Price range</GummySliderLabel>
          <GummySliderValue />
          <GummySliderControl>
            <GummySliderThumb aria-label="Minimum price" />
            <GummySliderThumb aria-label="Maximum price" />
          </GummySliderControl>
        </GummySlider>
        <GummyToggle aria-label="Pin project">Pin</GummyToggle>
        <GummyToggle disabled>Unavailable</GummyToggle>
        <GummyToggleGroup label="Text alignment" defaultValue={["left"]}>
          <GummyToggleGroupItem value="left">Left</GummyToggleGroupItem>
          <GummyToggleGroupItem value="center">Center</GummyToggleGroupItem>
          <GummyToggleGroupItem value="right">Right</GummyToggleGroupItem>
        </GummyToggleGroup>
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
});
