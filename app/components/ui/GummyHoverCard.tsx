"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type GummyHoverCardProps = Tooltip.Root.Props;

export function GummyHoverCard(props: GummyHoverCardProps) {
  return <Tooltip.Root {...props} disableHoverablePopup={false} />;
}

export const GummyHoverCardTrigger = React.forwardRef<
  HTMLButtonElement,
  Tooltip.Trigger.Props
>(function GummyHoverCardTrigger({ className, ...props }, ref) {
  return <Tooltip.Trigger {...props} ref={ref} className={joinClassNames("gummy-hover-card__trigger", className as string)} />;
});

export const GummyHoverCardPortal = Tooltip.Portal;

export const GummyHoverCardPositioner = React.forwardRef<
  HTMLDivElement,
  Tooltip.Positioner.Props
>(function GummyHoverCardPositioner({ className, sideOffset = 10, ...props }, ref) {
  return <Tooltip.Positioner {...props} ref={ref} sideOffset={sideOffset} className={joinClassNames("gummy-floating-positioner", className as string)} />;
});

export const GummyHoverCardPopup = React.forwardRef<
  HTMLDivElement,
  Tooltip.Popup.Props
>(function GummyHoverCardPopup({ className, children, ...props }, ref) {
  return (
    <Tooltip.Popup {...props} ref={ref} role="tooltip" className={joinClassNames("gummy-floating-popup gummy-hover-card__popup", className as string)}>
      <Tooltip.Arrow className="gummy-floating-popup__arrow" />
      {children}
    </Tooltip.Popup>
  );
});

GummyHoverCardTrigger.displayName = "GummyHoverCardTrigger";
GummyHoverCardPositioner.displayName = "GummyHoverCardPositioner";
GummyHoverCardPopup.displayName = "GummyHoverCardPopup";
