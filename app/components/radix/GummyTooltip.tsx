"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type ContentProps = React.ComponentPropsWithoutRef<typeof Tooltip.Content>;
type PositioningProps = Pick<
  ContentProps,
  "align" | "alignOffset" | "side" | "sideOffset" | "collisionPadding"
>;
const PositioningContext = React.createContext<PositioningProps>({});

export type GummyTooltipProviderProps =
  React.ComponentPropsWithoutRef<typeof Tooltip.Provider> & { delay?: number };

export function GummyTooltipProvider({
  delay,
  delayDuration,
  ...props
}: GummyTooltipProviderProps) {
  return <Tooltip.Provider {...props} delayDuration={delayDuration ?? delay} />;
}

export const GummyTooltip = Tooltip.Root;
export const GummyTooltipPortal = Tooltip.Portal;

export const GummyTooltipTrigger = React.forwardRef<
  React.ElementRef<typeof Tooltip.Trigger>,
  React.ComponentPropsWithoutRef<typeof Tooltip.Trigger>
>(function GummyTooltipTrigger({ className, ...props }, ref) {
  return <Tooltip.Trigger {...props} ref={ref} className={joinClassNames("gummy-tooltip__trigger", className)} />;
});

export type GummyTooltipPositionerProps =
  React.PropsWithChildren<PositioningProps & { className?: string }>;

export function GummyTooltipPositioner({
  className,
  children,
  sideOffset = 8,
  ...positioning
}: GummyTooltipPositionerProps) {
  return (
    <PositioningContext.Provider value={{ ...positioning, sideOffset }}>
      <div className={joinClassNames("gummy-floating-positioner", className)}>
        {children}
      </div>
    </PositioningContext.Provider>
  );
}

export const GummyTooltipPopup = React.forwardRef<
  React.ElementRef<typeof Tooltip.Content>,
  ContentProps
>(function GummyTooltipPopup({ className, children, ...props }, ref) {
  const positioning = React.useContext(PositioningContext);
  return (
    <Tooltip.Content
      {...positioning}
      {...props}
      ref={ref}
      className={joinClassNames("gummy-tooltip__popup", className)}
    >
      <Tooltip.Arrow className="gummy-tooltip__arrow" />
      {children}
    </Tooltip.Content>
  );
});

GummyTooltipTrigger.displayName = "GummyTooltipTrigger";
GummyTooltipPopup.displayName = "GummyTooltipPopup";
