"use client";

import { Drawer } from "@base-ui/react/drawer";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const GummyDrawer = Drawer.Root;
export const GummyDrawerPortal = Drawer.Portal;

export const GummyDrawerTrigger = React.forwardRef<
  HTMLButtonElement,
  Drawer.Trigger.Props
>(function GummyDrawerTrigger({ className, ...props }, ref) {
  return <Drawer.Trigger {...props} ref={ref} className={joinClassNames("gummy-overlay-trigger", className as string)} />;
});

export const GummyDrawerBackdrop = React.forwardRef<
  HTMLDivElement,
  Drawer.Backdrop.Props
>(function GummyDrawerBackdrop({ className, ...props }, ref) {
  return <Drawer.Backdrop {...props} ref={ref} className={joinClassNames("gummy-overlay-backdrop", className as string)} />;
});

export const GummyDrawerViewport = React.forwardRef<
  HTMLDivElement,
  Drawer.Viewport.Props
>(function GummyDrawerViewport({ className, ...props }, ref) {
  return <Drawer.Viewport {...props} ref={ref} className={joinClassNames("gummy-drawer__viewport", className as string)} />;
});

export const GummyDrawerPopup = React.forwardRef<
  HTMLDivElement,
  Drawer.Popup.Props
>(function GummyDrawerPopup({ className, children, ...props }, ref) {
  return (
    <Drawer.Popup {...props} ref={ref} className={joinClassNames("gummy-drawer__popup", className as string)}>
      <div className="gummy-drawer__handle" aria-hidden="true" />
      {children}
    </Drawer.Popup>
  );
});

export const GummyDrawerTitle = React.forwardRef<
  HTMLHeadingElement,
  Drawer.Title.Props
>(function GummyDrawerTitle({ className, ...props }, ref) {
  return <Drawer.Title {...props} ref={ref} className={joinClassNames("gummy-overlay-popup__title", className as string)} />;
});

export const GummyDrawerDescription = React.forwardRef<
  HTMLParagraphElement,
  Drawer.Description.Props
>(function GummyDrawerDescription({ className, ...props }, ref) {
  return <Drawer.Description {...props} ref={ref} className={joinClassNames("gummy-overlay-popup__description", className as string)} />;
});

export const GummyDrawerClose = Drawer.Close;

GummyDrawerTrigger.displayName = "GummyDrawerTrigger";
GummyDrawerBackdrop.displayName = "GummyDrawerBackdrop";
GummyDrawerViewport.displayName = "GummyDrawerViewport";
GummyDrawerPopup.displayName = "GummyDrawerPopup";
GummyDrawerTitle.displayName = "GummyDrawerTitle";
GummyDrawerDescription.displayName = "GummyDrawerDescription";
