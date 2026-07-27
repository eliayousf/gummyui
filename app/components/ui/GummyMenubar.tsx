"use client";

import { Menu } from "@base-ui/react/menu";
import { Menubar } from "@base-ui/react/menubar";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const GummyMenubar = React.forwardRef<
  HTMLDivElement,
  Menubar.Props
>(function GummyMenubar({ className, ...props }, ref) {
  return <Menubar {...props} ref={ref} className={joinClassNames("gummy-menubar", className as string)} />;
});

export const GummyMenubarMenu = Menu.Root;
export const GummyMenubarPortal = Menu.Portal;

export const GummyMenubarTrigger = React.forwardRef<
  HTMLButtonElement,
  Menu.Trigger.Props
>(function GummyMenubarTrigger({ className, ...props }, ref) {
  return <Menu.Trigger {...props} ref={ref} className={joinClassNames("gummy-menubar__trigger", className as string)} />;
});

export const GummyMenubarPositioner = React.forwardRef<
  HTMLDivElement,
  Menu.Positioner.Props
>(function GummyMenubarPositioner({ className, sideOffset = 8, ...props }, ref) {
  return <Menu.Positioner {...props} ref={ref} sideOffset={sideOffset} className={joinClassNames("gummy-menu-positioner", className as string)} />;
});

export const GummyMenubarPopup = React.forwardRef<
  HTMLDivElement,
  Menu.Popup.Props
>(function GummyMenubarPopup({ className, ...props }, ref) {
  return <Menu.Popup {...props} ref={ref} className={joinClassNames("gummy-compact-menu", className as string)} />;
});

export const GummyMenubarItem = React.forwardRef<
  HTMLDivElement,
  Menu.Item.Props
>(function GummyMenubarItem({ className, ...props }, ref) {
  return <Menu.Item {...props} ref={ref} className={joinClassNames("gummy-compact-menu__item", className as string)} />;
});

GummyMenubar.displayName = "GummyMenubar";
GummyMenubarTrigger.displayName = "GummyMenubarTrigger";
GummyMenubarPositioner.displayName = "GummyMenubarPositioner";
GummyMenubarPopup.displayName = "GummyMenubarPopup";
GummyMenubarItem.displayName = "GummyMenubarItem";
