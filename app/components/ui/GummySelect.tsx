"use client";

import { Select } from "@base-ui/react/select";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const GummySelect = Select.Root;
export const GummySelectLabel = Select.Label;
export const GummySelectValue = Select.Value;

export const GummySelectTrigger = React.forwardRef<HTMLButtonElement, Select.Trigger.Props>(
  function GummySelectTrigger({ className, children, ...props }, ref) {
    return (
      <Select.Trigger {...props} ref={ref} className={joinClassNames("gummy-select__trigger", className as string)}>
        {children ?? <Select.Value />}
        <Select.Icon className="gummy-select__icon">⌄</Select.Icon>
      </Select.Trigger>
    );
  },
);
export const GummySelectPortal = Select.Portal;
export const GummySelectPositioner = React.forwardRef<HTMLDivElement, Select.Positioner.Props>(
  function GummySelectPositioner({ className, sideOffset = 8, ...props }, ref) {
    return <Select.Positioner {...props} ref={ref} sideOffset={sideOffset} className={joinClassNames("gummy-menu-positioner", className as string)} />;
  },
);
export const GummySelectPopup = React.forwardRef<HTMLDivElement, Select.Popup.Props>(
  function GummySelectPopup({ className, children, ...props }, ref) {
    return <Select.Popup {...props} ref={ref} className={joinClassNames("gummy-select__popup", className as string)}><Select.ScrollUpArrow className="gummy-select__scroll-arrow">↑</Select.ScrollUpArrow>{children}<Select.ScrollDownArrow className="gummy-select__scroll-arrow">↓</Select.ScrollDownArrow></Select.Popup>;
  },
);
export const GummySelectList = Select.List;
export const GummySelectGroup = Select.Group;
export const GummySelectGroupLabel = Select.GroupLabel;
export const GummySelectItem = React.forwardRef<HTMLElement, Select.Item.Props>(
  function GummySelectItem({ className, children, ...props }, ref) {
    return <Select.Item {...props} ref={ref} className={joinClassNames("gummy-select__item", className as string)}><Select.ItemIndicator className="gummy-select__indicator">✓</Select.ItemIndicator><Select.ItemText>{children}</Select.ItemText></Select.Item>;
  },
);

GummySelectTrigger.displayName = "GummySelectTrigger";
GummySelectPositioner.displayName = "GummySelectPositioner";
GummySelectPopup.displayName = "GummySelectPopup";
GummySelectItem.displayName = "GummySelectItem";
