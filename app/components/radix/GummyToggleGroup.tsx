"use client";

import * as ToggleGroup from "@radix-ui/react-toggle-group";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type RadixToggleGroupProps =
  React.ComponentPropsWithoutRef<typeof ToggleGroup.Root>;

export type GummyToggleGroupProps = Omit<
  RadixToggleGroupProps,
  "type" | "value" | "defaultValue" | "onValueChange"
> & {
  label: string;
  multiple?: boolean;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
};

export const GummyToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroup.Root>,
  GummyToggleGroupProps
>(function GummyToggleGroup(
  {
    label,
    multiple = false,
    className,
    value,
    defaultValue,
    onValueChange,
    ...props
  },
  ref,
) {
  const rootProps = multiple
    ? {
        ...props,
        type: "multiple" as const,
        value,
        defaultValue,
        onValueChange,
      }
    : {
        ...props,
        type: "single" as const,
        value: value?.[0],
        defaultValue: defaultValue?.[0],
        onValueChange: (nextValue: string) =>
          onValueChange?.(nextValue ? [nextValue] : []),
      };
  return (
    <ToggleGroup.Root
      {...rootProps}
      ref={ref}
      className={joinClassNames("gummy-toggle-group", className)}
      aria-label={label}
    />
  );
});

GummyToggleGroup.displayName = "GummyToggleGroup";

export type GummyToggleGroupItemProps =
  React.ComponentPropsWithoutRef<typeof ToggleGroup.Item> & {
    variant?: "quiet" | "fruit";
  };

export const GummyToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroup.Item>,
  GummyToggleGroupItemProps
>(function GummyToggleGroupItem(
  { variant = "quiet", className, children, ...props },
  ref,
) {
  return (
    <ToggleGroup.Item
      {...props}
      ref={ref}
      className={joinClassNames(
        "gummy-toggle gummy-toggle-group__item",
        className,
      )}
      data-variant={variant}
    >
      <span className="gummy-toggle__pool" aria-hidden="true" />
      <span className="gummy-toggle__content">{children}</span>
    </ToggleGroup.Item>
  );
});

GummyToggleGroupItem.displayName = "GummyToggleGroupItem";
