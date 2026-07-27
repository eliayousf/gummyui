"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const GummyTooltipProvider = Tooltip.Provider;
export const GummyTooltip = Tooltip.Root;
export const GummyTooltipPortal = Tooltip.Portal;

export const GummyTooltipTrigger = React.forwardRef<
  HTMLButtonElement,
  Tooltip.Trigger.Props
>(function GummyTooltipTrigger({ className, ...props }, ref) {
  return <Tooltip.Trigger {...props} ref={ref} className={joinClassNames("gummy-tooltip__trigger", className as string)} />;
});

export const GummyTooltipPositioner = React.forwardRef<
  HTMLDivElement,
  Tooltip.Positioner.Props
>(function GummyTooltipPositioner({ className, sideOffset = 8, ...props }, ref) {
  return <Tooltip.Positioner {...props} ref={ref} sideOffset={sideOffset} className={joinClassNames("gummy-floating-positioner", className as string)} />;
});

export const GummyTooltipPopup = React.forwardRef<
  HTMLDivElement,
  Tooltip.Popup.Props
>(function GummyTooltipPopup({ className, children, ...props }, ref) {
  return (
    <Tooltip.Popup {...props} ref={ref} role="tooltip" className={joinClassNames("gummy-tooltip__popup", className as string)}>
      <Tooltip.Arrow className="gummy-tooltip__arrow" />
      {children}
    </Tooltip.Popup>
  );
});

GummyTooltipTrigger.displayName = "GummyTooltipTrigger";
GummyTooltipPositioner.displayName = "GummyTooltipPositioner";
GummyTooltipPopup.displayName = "GummyTooltipPopup";
