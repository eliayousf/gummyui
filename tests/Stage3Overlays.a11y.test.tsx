import { cleanup, render } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import {
  GummyAlertDialog,
  GummyAlertDialogBackdrop,
  GummyAlertDialogClose,
  GummyAlertDialogDescription,
  GummyAlertDialogPopup,
  GummyAlertDialogPortal,
  GummyAlertDialogTitle,
  GummyAlertDialogTrigger,
  GummyAlertDialogViewport,
} from "../app/components/ui/GummyAlertDialog";
import {
  GummyPopover,
  GummyPopoverClose,
  GummyPopoverDescription,
  GummyPopoverPopup,
  GummyPopoverPortal,
  GummyPopoverPositioner,
  GummyPopoverTitle,
  GummyPopoverTrigger,
} from "../app/components/ui/GummyPopover";
import {
  GummyTooltip,
  GummyTooltipPopup,
  GummyTooltipPortal,
  GummyTooltipPositioner,
  GummyTooltipProvider,
  GummyTooltipTrigger,
} from "../app/components/ui/GummyTooltip";

afterEach(cleanup);

describe("Stage 3 overlays accessibility", () => {
  it("has no automated violations in representative open states", async () => {
    const { container } = render(
      <main>
        <h1>Overlays</h1>
        <GummyAlertDialog defaultOpen>
          <GummyAlertDialogTrigger>Delete release</GummyAlertDialogTrigger>
          <GummyAlertDialogPortal keepMounted>
            <GummyAlertDialogBackdrop />
            <GummyAlertDialogViewport>
              <GummyAlertDialogPopup>
                <GummyAlertDialogTitle>Delete release?</GummyAlertDialogTitle>
                <GummyAlertDialogDescription>This cannot be undone.</GummyAlertDialogDescription>
                <GummyAlertDialogClose>Cancel</GummyAlertDialogClose>
              </GummyAlertDialogPopup>
            </GummyAlertDialogViewport>
          </GummyAlertDialogPortal>
        </GummyAlertDialog>
        <GummyPopover defaultOpen>
          <GummyPopoverTrigger>Workspace details</GummyPopoverTrigger>
          <GummyPopoverPortal keepMounted>
            <GummyPopoverPositioner>
              <GummyPopoverPopup>
                <GummyPopoverTitle>Workspace</GummyPopoverTitle>
                <GummyPopoverDescription>Three active projects.</GummyPopoverDescription>
                <GummyPopoverClose>Close</GummyPopoverClose>
              </GummyPopoverPopup>
            </GummyPopoverPositioner>
          </GummyPopoverPortal>
        </GummyPopover>
        <GummyTooltipProvider delay={0}>
          <GummyTooltip defaultOpen>
            <GummyTooltipTrigger render={<button type="button" />}>Archive</GummyTooltipTrigger>
            <GummyTooltipPortal keepMounted>
              <GummyTooltipPositioner><GummyTooltipPopup>Archive project</GummyTooltipPopup></GummyTooltipPositioner>
            </GummyTooltipPortal>
          </GummyTooltip>
        </GummyTooltipProvider>
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
