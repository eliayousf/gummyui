"use client";

import { ContextMenu } from "@base-ui/react/context-menu";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const GummyContextMenu = ContextMenu.Root;
export const GummyContextMenuPortal = ContextMenu.Portal;

export const GummyContextMenuTrigger = React.forwardRef<
  HTMLDivElement,
  ContextMenu.Trigger.Props
>(function GummyContextMenuTrigger({ className, ...props }, ref) {
  return <ContextMenu.Trigger {...props} ref={ref} className={joinClassNames("gummy-context-menu__trigger", className as string)} />;
});

export const GummyContextMenuPositioner = React.forwardRef<
  HTMLDivElement,
  ContextMenu.Positioner.Props
>(function GummyContextMenuPositioner({ className, ...props }, ref) {
  return <ContextMenu.Positioner {...props} ref={ref} className={joinClassNames("gummy-menu-positioner", className as string)} />;
});

export const GummyContextMenuPopup = React.forwardRef<
  HTMLDivElement,
  ContextMenu.Popup.Props
>(function GummyContextMenuPopup({ className, ...props }, ref) {
  return <ContextMenu.Popup {...props} ref={ref} className={joinClassNames("gummy-compact-menu", className as string)} />;
});

export const GummyContextMenuItem = React.forwardRef<
  HTMLDivElement,
  ContextMenu.Item.Props
>(function GummyContextMenuItem({ className, ...props }, ref) {
  return <ContextMenu.Item {...props} ref={ref} className={joinClassNames("gummy-compact-menu__item", className as string)} />;
});

export const GummyContextMenuSeparator = React.forwardRef<
  HTMLDivElement,
  ContextMenu.Separator.Props
>(function GummyContextMenuSeparator({ className, ...props }, ref) {
  return <ContextMenu.Separator {...props} ref={ref} className={joinClassNames("gummy-compact-menu__separator", className as string)} />;
});

GummyContextMenuTrigger.displayName = "GummyContextMenuTrigger";
GummyContextMenuPositioner.displayName = "GummyContextMenuPositioner";
GummyContextMenuPopup.displayName = "GummyContextMenuPopup";
GummyContextMenuItem.displayName = "GummyContextMenuItem";
GummyContextMenuSeparator.displayName = "GummyContextMenuSeparator";
