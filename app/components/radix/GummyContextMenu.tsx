"use client";

import * as ContextMenu from "@radix-ui/react-context-menu";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type ContentProps = React.ComponentPropsWithoutRef<typeof ContextMenu.Content>;
type PositioningProps = Pick<ContentProps, "collisionPadding">;
const PositioningContext = React.createContext<PositioningProps>({});

export const GummyContextMenu = ContextMenu.Root;
export const GummyContextMenuPortal = ContextMenu.Portal;

export const GummyContextMenuTrigger = React.forwardRef<
  React.ElementRef<typeof ContextMenu.Trigger>,
  React.ComponentPropsWithoutRef<typeof ContextMenu.Trigger>
>(function GummyContextMenuTrigger({ className, ...props }, ref) {
  return <ContextMenu.Trigger {...props} ref={ref} className={joinClassNames("gummy-context-menu__trigger", className)} />;
});

export type GummyContextMenuPositionerProps =
  React.PropsWithChildren<PositioningProps & { className?: string }>;

export function GummyContextMenuPositioner({
  className,
  children,
  ...positioning
}: GummyContextMenuPositionerProps) {
  return (
    <PositioningContext.Provider value={positioning}>
      <div className={joinClassNames("gummy-menu-positioner", className)}>
        {children}
      </div>
    </PositioningContext.Provider>
  );
}

export const GummyContextMenuPopup = React.forwardRef<
  React.ElementRef<typeof ContextMenu.Content>,
  ContentProps
>(function GummyContextMenuPopup({ className, ...props }, ref) {
  const positioning = React.useContext(PositioningContext);
  return <ContextMenu.Content {...positioning} {...props} ref={ref} className={joinClassNames("gummy-compact-menu", className)} />;
});

export const GummyContextMenuItem = React.forwardRef<
  React.ElementRef<typeof ContextMenu.Item>,
  React.ComponentPropsWithoutRef<typeof ContextMenu.Item>
>(function GummyContextMenuItem({ className, ...props }, ref) {
  return <ContextMenu.Item {...props} ref={ref} className={joinClassNames("gummy-compact-menu__item", className)} />;
});

export const GummyContextMenuSeparator = React.forwardRef<
  React.ElementRef<typeof ContextMenu.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextMenu.Separator>
>(function GummyContextMenuSeparator({ className, ...props }, ref) {
  return <ContextMenu.Separator {...props} ref={ref} className={joinClassNames("gummy-compact-menu__separator", className)} />;
});

GummyContextMenuTrigger.displayName = "GummyContextMenuTrigger";
GummyContextMenuPopup.displayName = "GummyContextMenuPopup";
GummyContextMenuItem.displayName = "GummyContextMenuItem";
GummyContextMenuSeparator.displayName = "GummyContextMenuSeparator";
