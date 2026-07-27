import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  GummySheet,
  GummySheetBackdrop,
  GummySheetClose,
  GummySheetDescription,
  GummySheetPopup,
  GummySheetPortal,
  GummySheetTitle,
  GummySheetTrigger,
  GummySheetViewport,
} from "../app/components/ui/GummySheet";
import {
  GummyTooltip,
  GummyTooltipPopup,
  GummyTooltipPortal,
  GummyTooltipPositioner,
  GummyTooltipProvider,
  GummyTooltipTrigger,
} from "../app/components/ui/GummyTooltip";

afterEach(cleanup);

describe("Stage 3 overlays", () => {
  it("contains focus in an Alert Dialog and restores it after cancellation", async () => {
    const user = userEvent.setup();
    render(
      <GummyAlertDialog>
        <GummyAlertDialogTrigger>Delete release</GummyAlertDialogTrigger>
        <GummyAlertDialogPortal>
          <GummyAlertDialogBackdrop />
          <GummyAlertDialogViewport>
            <GummyAlertDialogPopup>
              <GummyAlertDialogTitle>Delete release?</GummyAlertDialogTitle>
              <GummyAlertDialogDescription>This cannot be undone.</GummyAlertDialogDescription>
              <GummyAlertDialogClose>Cancel</GummyAlertDialogClose>
              <button type="button">Delete</button>
            </GummyAlertDialogPopup>
          </GummyAlertDialogViewport>
        </GummyAlertDialogPortal>
      </GummyAlertDialog>,
    );
    const trigger = screen.getByRole("button", { name: "Delete release" });
    await user.click(trigger);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("opens a non-modal Popover, closes with Escape, and restores focus", async () => {
    const user = userEvent.setup();
    render(
      <GummyPopover>
        <GummyPopoverTrigger>Workspace details</GummyPopoverTrigger>
        <GummyPopoverPortal>
          <GummyPopoverPositioner>
            <GummyPopoverPopup>
              <GummyPopoverTitle>Workspace</GummyPopoverTitle>
              <GummyPopoverDescription>Three active projects.</GummyPopoverDescription>
              <GummyPopoverClose>Close</GummyPopoverClose>
            </GummyPopoverPopup>
          </GummyPopoverPositioner>
        </GummyPopoverPortal>
      </GummyPopover>,
    );
    const trigger = screen.getByRole("button", { name: "Workspace details" });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Workspace" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Workspace" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("keeps Sheet side state while using Dialog semantics", async () => {
    const user = userEvent.setup();
    render(
      <GummySheet>
        <GummySheetTrigger>Open filters</GummySheetTrigger>
        <GummySheetPortal>
          <GummySheetBackdrop />
          <GummySheetViewport>
            <GummySheetPopup side="left">
              <GummySheetTitle>Filters</GummySheetTitle>
              <GummySheetDescription>Narrow project results.</GummySheetDescription>
              <GummySheetClose>Done</GummySheetClose>
            </GummySheetPopup>
          </GummySheetViewport>
        </GummySheetPortal>
      </GummySheet>,
    );
    await user.click(screen.getByRole("button", { name: "Open filters" }));
    expect(screen.getByRole("dialog", { name: "Filters" })).toHaveAttribute("data-side", "left");
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog", { name: "Filters" })).not.toBeInTheDocument();
  });

  it("shows a descriptive Tooltip from keyboard focus and dismisses with Escape", async () => {
    const user = userEvent.setup();
    render(
      <GummyTooltipProvider delay={0}>
        <GummyTooltip>
          <GummyTooltipTrigger render={<button type="button" />}>Archive</GummyTooltipTrigger>
          <GummyTooltipPortal>
            <GummyTooltipPositioner>
              <GummyTooltipPopup>Moves this project to the archive</GummyTooltipPopup>
            </GummyTooltipPositioner>
          </GummyTooltipPortal>
        </GummyTooltip>
      </GummyTooltipProvider>,
    );
    await user.tab();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Moves this project");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
