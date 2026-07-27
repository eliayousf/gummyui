"use client";

import { Popover } from "@base-ui/react/popover";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const GummyPopover = Popover.Root;
export const GummyPopoverPortal = Popover.Portal;

export const GummyPopoverTrigger = React.forwardRef<
  HTMLButtonElement,
  Popover.Trigger.Props
>(function GummyPopoverTrigger({ className, ...props }, ref) {
  return <Popover.Trigger {...props} ref={ref} className={joinClassNames("gummy-overlay-trigger", className as string)} />;
});

export const GummyPopoverPositioner = React.forwardRef<
  HTMLDivElement,
  Popover.Positioner.Props
>(function GummyPopoverPositioner({ className, sideOffset = 10, ...props }, ref) {
  return <Popover.Positioner {...props} ref={ref} sideOffset={sideOffset} className={joinClassNames("gummy-floating-positioner", className as string)} />;
});

export const GummyPopoverPopup = React.forwardRef<
  HTMLDivElement,
  Popover.Popup.Props
>(function GummyPopoverPopup({ className, children, ...props }, ref) {
  return (
    <Popover.Popup {...props} ref={ref} className={joinClassNames("gummy-floating-popup", className as string)}>
      <Popover.Arrow className="gummy-floating-popup__arrow" />
      {children}
    </Popover.Popup>
  );
});

export const GummyPopoverTitle = React.forwardRef<
  HTMLHeadingElement,
  Popover.Title.Props
>(function GummyPopoverTitle({ className, ...props }, ref) {
  return <Popover.Title {...props} ref={ref} className={joinClassNames("gummy-floating-popup__title", className as string)} />;
});

export const GummyPopoverDescription = React.forwardRef<
  HTMLParagraphElement,
  Popover.Description.Props
>(function GummyPopoverDescription({ className, ...props }, ref) {
  return <Popover.Description {...props} ref={ref} className={joinClassNames("gummy-floating-popup__description", className as string)} />;
});

export const GummyPopoverClose = Popover.Close;

GummyPopoverTrigger.displayName = "GummyPopoverTrigger";
GummyPopoverPositioner.displayName = "GummyPopoverPositioner";
GummyPopoverPopup.displayName = "GummyPopoverPopup";
GummyPopoverTitle.displayName = "GummyPopoverTitle";
GummyPopoverDescription.displayName = "GummyPopoverDescription";
