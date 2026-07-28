"use client";

import * as Select from "@radix-ui/react-select";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type ContentProps = React.ComponentPropsWithoutRef<typeof Select.Content>;
type PositioningProps = Pick<
  ContentProps,
  "align" | "side" | "sideOffset" | "collisionPadding" | "position"
>;
const PositioningContext = React.createContext<PositioningProps>({});

export const GummySelect = Select.Root;
export const GummySelectLabel = Select.Label;
export const GummySelectValue = Select.Value;

export const GummySelectTrigger = React.forwardRef<
  React.ElementRef<typeof Select.Trigger>,
  React.ComponentPropsWithoutRef<typeof Select.Trigger>
>(function GummySelectTrigger({ className, children, ...props }, ref) {
  return (
    <Select.Trigger
      {...props}
      ref={ref}
      className={joinClassNames("gummy-select__trigger", className)}
    >
      {children ?? <Select.Value />}
      <Select.Icon className="gummy-select__icon">⌄</Select.Icon>
    </Select.Trigger>
  );
});

export const GummySelectPortal = Select.Portal;

export type GummySelectPositionerProps =
  React.PropsWithChildren<PositioningProps & { className?: string }>;

export function GummySelectPositioner({
  className,
  children,
  sideOffset = 8,
  position = "popper",
  ...positioning
}: GummySelectPositionerProps) {
  return (
    <PositioningContext.Provider value={{ ...positioning, sideOffset, position }}>
      <div className={joinClassNames("gummy-menu-positioner", className)}>
        {children}
      </div>
    </PositioningContext.Provider>
  );
}

export const GummySelectPopup = React.forwardRef<
  React.ElementRef<typeof Select.Content>,
  ContentProps
>(function GummySelectPopup({ className, children, ...props }, ref) {
  const positioning = React.useContext(PositioningContext);
  return (
    <Select.Content
      {...positioning}
      {...props}
      ref={ref}
      className={joinClassNames("gummy-select__popup", className)}
    >
      <Select.ScrollUpButton className="gummy-select__scroll-arrow">↑</Select.ScrollUpButton>
      {children}
      <Select.ScrollDownButton className="gummy-select__scroll-arrow">↓</Select.ScrollDownButton>
    </Select.Content>
  );
});

export const GummySelectList = Select.Viewport;
export const GummySelectGroup = Select.Group;
export const GummySelectGroupLabel = Select.Label;

export const GummySelectItem = React.forwardRef<
  React.ElementRef<typeof Select.Item>,
  React.ComponentPropsWithoutRef<typeof Select.Item>
>(function GummySelectItem({ className, children, ...props }, ref) {
  return (
    <Select.Item
      {...props}
      ref={ref}
      className={joinClassNames("gummy-select__item", className)}
    >
      <Select.ItemIndicator className="gummy-select__indicator">✓</Select.ItemIndicator>
      <Select.ItemText>{children}</Select.ItemText>
    </Select.Item>
  );
});

GummySelectTrigger.displayName = "GummySelectTrigger";
GummySelectPopup.displayName = "GummySelectPopup";
GummySelectItem.displayName = "GummySelectItem";
