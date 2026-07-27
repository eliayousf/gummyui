import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GummyButton } from "../app/components/ui/GummyButton";
import {
  GummyButtonGroup,
  GummyButtonGroupSeparator,
  GummyButtonGroupText,
} from "../app/components/ui/GummyButtonGroup";
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

describe("Stage 3 selection controls", () => {
  it("labels a visual Button group without changing native Button behavior", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <GummyButtonGroup label="Document actions">
        <GummyButton onClick={onSave}>Save</GummyButton>
        <GummyButtonGroupSeparator />
        <GummyButton variant="secondary">Share</GummyButton>
        <GummyButtonGroupText>⌘ S</GummyButtonGroupText>
      </GummyButtonGroup>,
    );
    expect(screen.getByRole("group", { name: "Document actions" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("changes a labelled Slider with keyboard input", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <GummySlider defaultValue={40} onValueChange={onValueChange}>
        <GummySliderLabel>Opacity</GummySliderLabel>
        <GummySliderValue />
        <GummySliderControl>
          <GummySliderThumb />
        </GummySliderControl>
      </GummySlider>,
    );
    const slider = screen.getByRole("slider", { name: "Opacity" });
    expect(slider).toHaveAttribute("aria-valuenow", "40");
    slider.focus();
    await user.keyboard("{ArrowRight}");
    expect(slider).toHaveAttribute("aria-valuenow", "41");
    expect(onValueChange).toHaveBeenCalled();
  });

  it("supports controlled-quality pressed semantics on a Toggle", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(
      <GummyToggle onPressedChange={onPressedChange} aria-label="Pin project">
        Pin
      </GummyToggle>,
    );
    const toggle = screen.getByRole("button", { name: "Pin project" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(onPressedChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("supports single and multiple Toggle Group selection with arrow focus", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <GummyToggleGroup label="Text alignment" defaultValue={["left"]}>
        <GummyToggleGroupItem value="left">Left</GummyToggleGroupItem>
        <GummyToggleGroupItem value="center">Center</GummyToggleGroupItem>
        <GummyToggleGroupItem value="right">Right</GummyToggleGroupItem>
      </GummyToggleGroup>,
    );
    const left = screen.getByRole("button", { name: "Left" });
    const center = screen.getByRole("button", { name: "Center" });
    expect(left).toHaveAttribute("aria-pressed", "true");
    left.focus();
    await user.keyboard("{ArrowRight}");
    expect(center).toHaveFocus();
    await user.keyboard(" ");
    expect(center).toHaveAttribute("aria-pressed", "true");
    expect(left).toHaveAttribute("aria-pressed", "false");

    rerender(
      <GummyToggleGroup key="multiple" label="Text styles" multiple defaultValue={["bold"]}>
        <GummyToggleGroupItem value="bold">Bold</GummyToggleGroupItem>
        <GummyToggleGroupItem value="italic">Italic</GummyToggleGroupItem>
      </GummyToggleGroup>,
    );
    await user.click(screen.getByRole("button", { name: "Italic" }));
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute("aria-pressed", "true");
  });
});
