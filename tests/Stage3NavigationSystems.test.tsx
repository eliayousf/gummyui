import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import {
  GummyContextMenu,
  GummyContextMenuItem,
  GummyContextMenuPopup,
  GummyContextMenuPortal,
  GummyContextMenuPositioner,
  GummyContextMenuTrigger,
} from "../app/components/ui/GummyContextMenu";
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
  GummyNavigationMenu,
  GummyNavigationMenuContent,
  GummyNavigationMenuItem,
  GummyNavigationMenuLink,
  GummyNavigationMenuList,
  GummyNavigationMenuPopup,
  GummyNavigationMenuPortal,
  GummyNavigationMenuPositioner,
  GummyNavigationMenuTrigger,
  GummyNavigationMenuViewport,
} from "../app/components/ui/GummyNavigationMenu";
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

describe("Stage 3 navigation systems", () => {
  it("opens a Context Menu from secondary click and activates an item", async () => {
    const user = userEvent.setup();
    render(
      <GummyContextMenu>
        <GummyContextMenuTrigger tabIndex={0}>Project canvas</GummyContextMenuTrigger>
        <GummyContextMenuPortal>
          <GummyContextMenuPositioner>
            <GummyContextMenuPopup>
              <GummyContextMenuItem>Duplicate</GummyContextMenuItem>
              <GummyContextMenuItem>Archive</GummyContextMenuItem>
            </GummyContextMenuPopup>
          </GummyContextMenuPositioner>
        </GummyContextMenuPortal>
      </GummyContextMenu>,
    );
    await user.pointer({ target: screen.getByText("Project canvas"), keys: "[MouseRight]" });
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Duplicate" })).toHaveFocus();
  });

  it("coordinates Menubar triggers with arrow focus", async () => {
    const user = userEvent.setup();
    render(
      <GummyMenubar>
        <GummyMenubarMenu>
          <GummyMenubarTrigger>File</GummyMenubarTrigger>
          <GummyMenubarPortal><GummyMenubarPositioner><GummyMenubarPopup><GummyMenubarItem>New</GummyMenubarItem></GummyMenubarPopup></GummyMenubarPositioner></GummyMenubarPortal>
        </GummyMenubarMenu>
        <GummyMenubarMenu>
          <GummyMenubarTrigger>Edit</GummyMenubarTrigger>
          <GummyMenubarPortal><GummyMenubarPositioner><GummyMenubarPopup><GummyMenubarItem>Undo</GummyMenubarItem></GummyMenubarPopup></GummyMenubarPositioner></GummyMenubarPortal>
        </GummyMenubarMenu>
      </GummyMenubar>,
    );
    const file = screen.getByRole("menuitem", { name: "File" });
    file.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus();
  });

  it("opens Navigation Menu content and exposes real links", async () => {
    const user = userEvent.setup();
    render(
      <GummyNavigationMenu label="Product">
        <GummyNavigationMenuList>
          <GummyNavigationMenuItem value="components">
            <GummyNavigationMenuTrigger>Components</GummyNavigationMenuTrigger>
            <GummyNavigationMenuContent>
              <GummyNavigationMenuLink href="/components">Browse components</GummyNavigationMenuLink>
            </GummyNavigationMenuContent>
          </GummyNavigationMenuItem>
        </GummyNavigationMenuList>
        <GummyNavigationMenuPortal>
          <GummyNavigationMenuPositioner><GummyNavigationMenuPopup><GummyNavigationMenuViewport /></GummyNavigationMenuPopup></GummyNavigationMenuPositioner>
        </GummyNavigationMenuPortal>
      </GummyNavigationMenu>,
    );
    await user.click(screen.getByRole("button", { name: /Components/ }));
    expect(screen.getByRole("link", { name: "Browse components" })).toHaveAttribute("href", "/components");
  });

  it("collapses Sidebar state while preserving current-page navigation", async () => {
    const user = userEvent.setup();
    render(
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
        <GummySidebarInset>Project content</GummySidebarInset>
      </GummySidebar>,
    );
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute("aria-current", "page");
    const trigger = screen.getByRole("button", { name: "Collapse sidebar" });
    await user.click(trigger);
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toHaveAttribute("aria-expanded", "false");
  });
});
