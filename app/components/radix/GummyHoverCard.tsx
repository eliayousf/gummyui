"use client";

import * as HoverCard from "@radix-ui/react-hover-card";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type ContentProps = React.ComponentPropsWithoutRef<typeof HoverCard.Content>;
type PositioningProps = Pick<
  ContentProps,
  "align" | "alignOffset" | "side" | "sideOffset" | "collisionPadding"
>;
const PositioningContext = React.createContext<PositioningProps>({});

export type GummyHoverCardProps =
  React.ComponentPropsWithoutRef<typeof HoverCard.Root>;
export const GummyHoverCard = HoverCard.Root;
export const GummyHoverCardPortal = HoverCard.Portal;

export const GummyHoverCardTrigger = React.forwardRef<
  React.ElementRef<typeof HoverCard.Trigger>,
  React.ComponentPropsWithoutRef<typeof HoverCard.Trigger>
>(function GummyHoverCardTrigger({ className, ...props }, ref) {
  return <HoverCard.Trigger {...props} ref={ref} className={joinClassNames("gummy-hover-card__trigger", className)} />;
});

export type GummyHoverCardPositionerProps =
  React.PropsWithChildren<PositioningProps & { className?: string }>;

export function GummyHoverCardPositioner({
  className,
  children,
  sideOffset = 10,
  ...positioning
}: GummyHoverCardPositionerProps) {
  return (
    <PositioningContext.Provider value={{ ...positioning, sideOffset }}>
      <div className={joinClassNames("gummy-floating-positioner", className)}>
        {children}
      </div>
    </PositioningContext.Provider>
  );
}

export const GummyHoverCardPopup = React.forwardRef<
  React.ElementRef<typeof HoverCard.Content>,
  ContentProps
>(function GummyHoverCardPopup({ className, children, ...props }, ref) {
  const positioning = React.useContext(PositioningContext);
  return (
    <HoverCard.Content
      {...positioning}
      {...props}
      ref={ref}
      className={joinClassNames(
        "gummy-floating-popup gummy-hover-card__popup",
        className,
      )}
    >
      <HoverCard.Arrow className="gummy-floating-popup__arrow" />
      {children}
    </HoverCard.Content>
  );
});

GummyHoverCardTrigger.displayName = "GummyHoverCardTrigger";
GummyHoverCardPopup.displayName = "GummyHoverCardPopup";
