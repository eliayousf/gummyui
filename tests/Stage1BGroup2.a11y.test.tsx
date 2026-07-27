import { cleanup, render } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { GummySwitch } from "../app/components/ui/GummySwitch";
import { GummyTab, GummyTabPanel, GummyTabs, GummyTabsList } from "../app/components/ui/GummyTabs";
import {
  GummyDropdownMenu,
  GummyDropdownMenuItem,
  GummyDropdownMenuPopup,
  GummyDropdownMenuPortal,
  GummyDropdownMenuPositioner,
  GummyDropdownMenuTrigger,
} from "../app/components/ui/GummyDropdownMenu";
import {
  GummyDialog,
  GummyDialogClose,
  GummyDialogDescription,
  GummyDialogPopup,
  GummyDialogPortal,
  GummyDialogTitle,
  GummyDialogTrigger,
  GummyDialogViewport,
} from "../app/components/ui/GummyDialog";

afterEach(cleanup);

const axeOptions = {
  rules: {
    "color-contrast": { enabled: false },
    region: { enabled: false },
  },
};

function violations(results: axe.AxeResults) {
  return results.violations.map(({ id, help, nodes }) => ({
    id,
    help,
    targets: nodes.flatMap((node) => node.target),
  }));
}

describe("Stage 1B Group 2 accessibility", () => {
  it("has no automated violations in Switch and Tabs states", async () => {
    const { container } = render(
      <main>
        <h1>Interaction checks</h1>
        <GummySwitch label="Digest" description="Sent weekly." />
        <GummySwitch label="Disabled digest" disabled />
        <GummyTabs defaultValue="overview">
          <GummyTabsList aria-label="Project sections">
            <GummyTab value="overview">Overview</GummyTab>
            <GummyTab value="activity">Activity</GummyTab>
          </GummyTabsList>
          <GummyTabPanel value="overview">Overview content</GummyTabPanel>
          <GummyTabPanel value="activity">Activity content</GummyTabPanel>
        </GummyTabs>
      </main>,
    );

    expect(violations(await axe.run(container, axeOptions))).toEqual([]);
  });

  it("has no automated violations in an open Dropdown Menu", async () => {
    render(
      <GummyDropdownMenu defaultOpen>
        <GummyDropdownMenuTrigger>Sort projects</GummyDropdownMenuTrigger>
        <GummyDropdownMenuPortal>
          <GummyDropdownMenuPositioner>
            <GummyDropdownMenuPopup aria-label="Sort projects">
              <GummyDropdownMenuItem>Newest</GummyDropdownMenuItem>
              <GummyDropdownMenuItem>Oldest</GummyDropdownMenuItem>
            </GummyDropdownMenuPopup>
          </GummyDropdownMenuPositioner>
        </GummyDropdownMenuPortal>
      </GummyDropdownMenu>,
    );

    expect(violations(await axe.run(document.body, axeOptions))).toEqual([]);
  });

  it("has no automated violations in an open labelled Dialog", async () => {
    render(
      <GummyDialog defaultOpen>
        <GummyDialogTrigger>Archive project</GummyDialogTrigger>
        <GummyDialogPortal>
          <GummyDialogViewport>
            <GummyDialogPopup>
              <GummyDialogTitle>Archive project?</GummyDialogTitle>
              <GummyDialogDescription>You can restore it later.</GummyDialogDescription>
              <GummyDialogClose>Keep project</GummyDialogClose>
            </GummyDialogPopup>
          </GummyDialogViewport>
        </GummyDialogPortal>
      </GummyDialog>,
    );

    expect(violations(await axe.run(document.body, axeOptions))).toEqual([]);
  });
});
