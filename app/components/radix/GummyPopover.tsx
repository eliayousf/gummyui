"use client";

import * as Popover from "@radix-ui/react-popover";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type ContentProps = React.ComponentPropsWithoutRef<typeof Popover.Content>;
type PositioningProps = Pick<
  ContentProps,
  "align" | "alignOffset" | "side" | "sideOffset" | "collisionPadding"
>;
const PositioningContext = React.createContext<PositioningProps>({});

export const GummyPopover = Popover.Root;
export const GummyPopoverPortal = Popover.Portal;

export const GummyPopoverTrigger = React.forwardRef<
  React.ElementRef<typeof Popover.Trigger>,
  React.ComponentPropsWithoutRef<typeof Popover.Trigger>
>(function GummyPopoverTrigger({ className, ...props }, ref) {
  return <Popover.Trigger {...props} ref={ref} className={joinClassNames("gummy-overlay-trigger", className)} />;
});

export type GummyPopoverPositionerProps =
  React.PropsWithChildren<PositioningProps & { className?: string }>;

export function GummyPopoverPositioner({
  className,
  children,
  sideOffset = 10,
  ...positioning
}: GummyPopoverPositionerProps) {
  return (
    <PositioningContext.Provider value={{ ...positioning, sideOffset }}>
      <div className={joinClassNames("gummy-floating-positioner", className)}>
        {children}
      </div>
    </PositioningContext.Provider>
  );
}

export const GummyPopoverPopup = React.forwardRef<
  React.ElementRef<typeof Popover.Content>,
  ContentProps
>(function GummyPopoverPopup({ className, children, ...props }, ref) {
  const positioning = React.useContext(PositioningContext);
  return (
    <Popover.Content
      {...positioning}
      {...props}
      ref={ref}
      className={joinClassNames("gummy-floating-popup", className)}
    >
      <Popover.Arrow className="gummy-floating-popup__arrow" />
      {children}
    </Popover.Content>
  );
});

export const GummyPopoverTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(function GummyPopoverTitle({ className, ...props }, ref) {
  return <h2 {...props} ref={ref} className={joinClassNames("gummy-floating-popup__title", className)} />;
});

export const GummyPopoverDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function GummyPopoverDescription({ className, ...props }, ref) {
  return <p {...props} ref={ref} className={joinClassNames("gummy-floating-popup__description", className)} />;
});

export const GummyPopoverClose = Popover.Close;

GummyPopoverTrigger.displayName = "GummyPopoverTrigger";
GummyPopoverPopup.displayName = "GummyPopoverPopup";
GummyPopoverTitle.displayName = "GummyPopoverTitle";
GummyPopoverDescription.displayName = "GummyPopoverDescription";
