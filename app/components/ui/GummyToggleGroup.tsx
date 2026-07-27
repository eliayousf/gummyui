"use client";

import { ToggleGroup } from "@base-ui/react/toggle-group";
import * as React from "react";
import { GummyToggle, type GummyToggleProps } from "./GummyToggle";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type GummyToggleGroupProps = ToggleGroup.Props & {
  label: string;
};

export const GummyToggleGroup = React.forwardRef<
  HTMLDivElement,
  GummyToggleGroupProps
>(function GummyToggleGroup({ label, className, ...props }, ref) {
  return (
    <ToggleGroup
      {...props}
      ref={ref}
      className={joinClassNames("gummy-toggle-group", className as string)}
      aria-label={label}
    />
  );
});

GummyToggleGroup.displayName = "GummyToggleGroup";

export type GummyToggleGroupItemProps = GummyToggleProps & {
  value: string;
};

export const GummyToggleGroupItem = React.forwardRef<
  HTMLButtonElement,
  GummyToggleGroupItemProps
>(function GummyToggleGroupItem({ className, ...props }, ref) {
  return (
    <GummyToggle
      {...props}
      ref={ref}
      className={joinClassNames("gummy-toggle-group__item", className as string)}
    />
  );
});

GummyToggleGroupItem.displayName = "GummyToggleGroupItem";
