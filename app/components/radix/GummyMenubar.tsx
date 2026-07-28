"use client";

import * as Menubar from "@radix-ui/react-menubar";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type ContentProps = React.ComponentPropsWithoutRef<typeof Menubar.Content>;
type PositioningProps = Pick<
  ContentProps,
  "align" | "alignOffset" | "side" | "sideOffset" | "collisionPadding"
>;
const PositioningContext = React.createContext<PositioningProps>({});

export const GummyMenubar = React.forwardRef<
  React.ElementRef<typeof Menubar.Root>,
  React.ComponentPropsWithoutRef<typeof Menubar.Root>
>(function GummyMenubar({ className, ...props }, ref) {
  return <Menubar.Root {...props} ref={ref} className={joinClassNames("gummy-menubar", className)} />;
});

export const GummyMenubarMenu = Menubar.Menu;
export const GummyMenubarPortal = Menubar.Portal;

export const GummyMenubarTrigger = React.forwardRef<
  React.ElementRef<typeof Menubar.Trigger>,
  React.ComponentPropsWithoutRef<typeof Menubar.Trigger>
>(function GummyMenubarTrigger({ className, ...props }, ref) {
  return <Menubar.Trigger {...props} ref={ref} className={joinClassNames("gummy-menubar__trigger", className)} />;
});

export type GummyMenubarPositionerProps =
  React.PropsWithChildren<PositioningProps & { className?: string }>;

export function GummyMenubarPositioner({
  className,
  children,
  sideOffset = 8,
  ...positioning
}: GummyMenubarPositionerProps) {
  return (
    <PositioningContext.Provider value={{ ...positioning, sideOffset }}>
      <div className={joinClassNames("gummy-menu-positioner", className)}>
        {children}
      </div>
    </PositioningContext.Provider>
  );
}

export const GummyMenubarPopup = React.forwardRef<
  React.ElementRef<typeof Menubar.Content>,
  ContentProps
>(function GummyMenubarPopup({ className, ...props }, ref) {
  const positioning = React.useContext(PositioningContext);
  return <Menubar.Content {...positioning} {...props} ref={ref} className={joinClassNames("gummy-compact-menu", className)} />;
});

export const GummyMenubarItem = React.forwardRef<
  React.ElementRef<typeof Menubar.Item>,
  React.ComponentPropsWithoutRef<typeof Menubar.Item>
>(function GummyMenubarItem({ className, ...props }, ref) {
  return <Menubar.Item {...props} ref={ref} className={joinClassNames("gummy-compact-menu__item", className)} />;
});

export const GummyMenubarSeparator = React.forwardRef<
  React.ElementRef<typeof Menubar.Separator>,
  React.ComponentPropsWithoutRef<typeof Menubar.Separator>
>(function GummyMenubarSeparator({ className, ...props }, ref) {
  return <Menubar.Separator {...props} ref={ref} className={joinClassNames("gummy-compact-menu__separator", className)} />;
});

GummyMenubar.displayName = "GummyMenubar";
GummyMenubarTrigger.displayName = "GummyMenubarTrigger";
GummyMenubarPopup.displayName = "GummyMenubarPopup";
GummyMenubarItem.displayName = "GummyMenubarItem";
GummyMenubarSeparator.displayName = "GummyMenubarSeparator";
