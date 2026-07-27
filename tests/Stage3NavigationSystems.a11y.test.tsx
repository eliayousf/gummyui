import { cleanup, render } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import {
  GummyMenubar,
  GummyMenubarItem,
  GummyMenubarMenu,
  GummyMenubarPopup,
  GummyMenubarPortal,
  GummyMenubarPositioner,
  GummyMenubarTrigger,
} from "../app/components/ui/GummyMenubar";
import {
  GummySidebar,
  GummySidebarContent,
  GummySidebarGroup,
  GummySidebarGroupLabel,
  GummySidebarInset,
  GummySidebarMenu,
  GummySidebarMenuItem,
  GummySidebarMenuLink,
  GummySidebarPanel,
  GummySidebarTrigger,
} from "../app/components/ui/GummySidebar";

afterEach(cleanup);

describe("Stage 3 navigation systems accessibility", () => {
  it("has no automated violations in representative navigation", async () => {
    const { container } = render(
      <div>
        <h1>Navigation systems</h1>
        <GummyMenubar>
          <GummyMenubarMenu>
            <GummyMenubarTrigger>File</GummyMenubarTrigger>
            <GummyMenubarPortal><GummyMenubarPositioner><GummyMenubarPopup><GummyMenubarItem>New</GummyMenubarItem></GummyMenubarPopup></GummyMenubarPositioner></GummyMenubarPortal>
          </GummyMenubarMenu>
        </GummyMenubar>
        <h2>Workspace application</h2>
        <GummySidebar>
          <GummySidebarPanel>
            <GummySidebarTrigger />
            <GummySidebarContent>
              <GummySidebarGroup>
                <GummySidebarGroupLabel>Workspace</GummySidebarGroupLabel>
                <GummySidebarMenu>
                  <GummySidebarMenuItem><GummySidebarMenuLink href="/projects" current>Projects</GummySidebarMenuLink></GummySidebarMenuItem>
                </GummySidebarMenu>
              </GummySidebarGroup>
            </GummySidebarContent>
          </GummySidebarPanel>
          <GummySidebarInset><h2>Projects</h2></GummySidebarInset>
        </GummySidebar>
      </div>,
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
