import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { access } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  GummyAccordion,
  GummyAccordionHeader,
  GummyAccordionItem,
  GummyAccordionPanel,
  GummyAccordionTrigger,
} from "../app/components/radix/GummyAccordion";
import {
  GummyDialog,
  GummyDialogBackdrop,
  GummyDialogClose,
  GummyDialogDescription,
  GummyDialogPopup,
  GummyDialogPortal,
  GummyDialogTitle,
  GummyDialogTrigger,
  GummyDialogViewport,
} from "../app/components/radix/GummyDialog";
import { GummySwitch } from "../app/components/radix/GummySwitch";
import {
  GummyTab,
  GummyTabPanel,
  GummyTabs,
  GummyTabsList,
} from "../app/components/radix/GummyTabs";
import {
  GummyToggleGroup,
  GummyToggleGroupItem,
} from "../app/components/radix/GummyToggleGroup";

afterEach(cleanup);

const radixFiles = [
  "GummyAccordion.tsx",
  "GummyAlertDialog.tsx",
  "GummyCollapsible.tsx",
  "GummyContextMenu.tsx",
  "GummyDialog.tsx",
  "GummyDirection.tsx",
  "GummyDrawer.tsx",
  "GummyDropdownMenu.tsx",
  "GummyHoverCard.tsx",
  "GummyMenubar.tsx",
  "GummyNavigationMenu.tsx",
  "GummyPopover.tsx",
  "GummyScrollArea.tsx",
  "GummySelect.tsx",
  "GummySheet.tsx",
  "GummySlider.tsx",
  "GummySonner.tsx",
  "GummySwitch.tsx",
  "GummyTabs.tsx",
  "GummyToggle.tsx",
  "GummyToggleGroup.tsx",
  "GummyTooltip.tsx",
] as const;

describe("Radix UI counterparts", () => {
  it("ships every declared counterpart as editable React source", async () => {
    expect(radixFiles).toHaveLength(22);
    for (const file of radixFiles) {
      await expect(
        access(path.join(process.cwd(), "app", "components", "radix", file)),
      ).resolves.toBeUndefined();
    }
  });

  it("preserves disclosure, switch, tabs, and toggle behavior", async () => {
    const user = userEvent.setup();
    render(
      <main>
        <GummyAccordion defaultValue={["shipping"]}>
          <GummyAccordionItem value="shipping">
            <GummyAccordionHeader>
              <GummyAccordionTrigger>Shipping</GummyAccordionTrigger>
            </GummyAccordionHeader>
            <GummyAccordionPanel>Worldwide delivery</GummyAccordionPanel>
          </GummyAccordionItem>
        </GummyAccordion>
        <GummySwitch label="Release notifications" />
        <GummyTabs defaultValue="details">
          <GummyTabsList aria-label="Product sections">
            <GummyTab value="details">Details</GummyTab>
            <GummyTab value="license">License</GummyTab>
          </GummyTabsList>
          <GummyTabPanel value="details">Product details</GummyTabPanel>
          <GummyTabPanel value="license">License terms</GummyTabPanel>
        </GummyTabs>
        <GummyToggleGroup label="Alignment" defaultValue={["left"]}>
          <GummyToggleGroupItem value="left">Left</GummyToggleGroupItem>
          <GummyToggleGroupItem value="right">Right</GummyToggleGroupItem>
        </GummyToggleGroup>
      </main>,
    );

    expect(screen.getByText("Worldwide delivery")).toBeVisible();
    const switchControl = screen.getByRole("switch", {
      name: "Release notifications",
    });
    expect(switchControl).toHaveAttribute("aria-checked", "false");
    await user.click(switchControl);
    expect(switchControl).toHaveAttribute("aria-checked", "true");

    await user.click(screen.getByRole("tab", { name: "License" }));
    expect(screen.getByRole("tabpanel", { name: "License" })).toHaveTextContent(
      "License terms",
    );

    const right = screen.getByRole("radio", { name: "Right" });
    await user.click(right);
    expect(right).toHaveAttribute("data-state", "on");
  });

  it("opens a labelled modal, contains focus, and restores the trigger", async () => {
    const user = userEvent.setup();
    render(
      <GummyDialog>
        <GummyDialogTrigger>Archive project</GummyDialogTrigger>
        <GummyDialogPortal>
          <GummyDialogBackdrop />
          <GummyDialogViewport>
            <GummyDialogPopup>
              <GummyDialogTitle>Archive project?</GummyDialogTitle>
              <GummyDialogDescription>
                You can restore it later.
              </GummyDialogDescription>
              <GummyDialogClose>Keep project</GummyDialogClose>
            </GummyDialogPopup>
          </GummyDialogViewport>
        </GummyDialogPortal>
      </GummyDialog>,
    );

    const trigger = screen.getByRole("button", { name: "Archive project" });
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", {
      name: "Archive project?",
    });
    expect(dialog).toHaveAccessibleDescription("You can restore it later.");
    expect(screen.getByRole("button", { name: "Keep project" })).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
  });

  it("has no automated accessibility violations in representative states", async () => {
    const { container } = render(
      <main>
        <h1>Radix counterparts</h1>
        <GummySwitch label="Dark mode" description="Changes the preview." />
        <GummyTabs defaultValue="one">
          <GummyTabsList aria-label="Preview panels">
            <GummyTab value="one">One</GummyTab>
            <GummyTab value="two">Two</GummyTab>
          </GummyTabsList>
          <GummyTabPanel value="one">First panel</GummyTabPanel>
          <GummyTabPanel value="two">Second panel</GummyTabPanel>
        </GummyTabs>
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
