"use client";

import { Combobox } from "@base-ui/react/combobox";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const GummyCombobox = Combobox.Root;

export const GummyComboboxLabel = React.forwardRef<HTMLDivElement, Combobox.Label.Props>(
  function GummyComboboxLabel({ className, ...props }, ref) {
    return <Combobox.Label {...props} ref={ref} className={joinClassNames("gummy-combobox__label", className as string)} />;
  },
);
export const GummyComboboxInputGroup = React.forwardRef<HTMLDivElement, Combobox.InputGroup.Props>(
  function GummyComboboxInputGroup({ className, ...props }, ref) {
    return <Combobox.InputGroup {...props} ref={ref} className={joinClassNames("gummy-combobox__input-group", className as string)} />;
  },
);
export const GummyComboboxInput = React.forwardRef<HTMLInputElement, Combobox.Input.Props>(
  function GummyComboboxInput({ className, ...props }, ref) {
    const generatedId = React.useId().replace(/:/g, "");
    return <Combobox.Input {...props} id={props.id ?? `gummy-combobox-input-${generatedId}`} ref={ref} className={joinClassNames("gummy-combobox__input", className as string)} />;
  },
);
export const GummyComboboxTrigger = React.forwardRef<HTMLButtonElement, Combobox.Trigger.Props>(
  function GummyComboboxTrigger({ className, children, ...props }, ref) {
    const generatedId = React.useId().replace(/:/g, "");
    return <Combobox.Trigger {...props} id={props.id ?? `gummy-combobox-trigger-${generatedId}`} ref={ref} className={joinClassNames("gummy-combobox__trigger", className as string)} aria-label={props["aria-label"] ?? "Show options"}>{children ?? <span aria-hidden="true">⌄</span>}</Combobox.Trigger>;
  },
);
export const GummyComboboxPortal = Combobox.Portal;
export const GummyComboboxPositioner = React.forwardRef<HTMLDivElement, Combobox.Positioner.Props>(
  function GummyComboboxPositioner({ className, sideOffset = 8, ...props }, ref) {
    return <Combobox.Positioner {...props} ref={ref} sideOffset={sideOffset} className={joinClassNames("gummy-menu-positioner", className as string)} />;
  },
);
export const GummyComboboxPopup = React.forwardRef<HTMLDivElement, Combobox.Popup.Props>(
  function GummyComboboxPopup({ className, ...props }, ref) {
    return <Combobox.Popup {...props} ref={ref} className={joinClassNames("gummy-combobox__popup", className as string)} />;
  },
);
export const GummyComboboxList = Combobox.List;
export const GummyComboboxEmpty = React.forwardRef<HTMLDivElement, Combobox.Empty.Props>(
  function GummyComboboxEmpty({ className, ...props }, ref) {
    return <Combobox.Empty {...props} ref={ref} className={joinClassNames("gummy-combobox__empty", className as string)} />;
  },
);
export const GummyComboboxItem = React.forwardRef<HTMLDivElement, Combobox.Item.Props>(
  function GummyComboboxItem({ className, children, ...props }, ref) {
    return <Combobox.Item {...props} ref={ref} className={joinClassNames("gummy-combobox__item", className as string)}><Combobox.ItemIndicator className="gummy-combobox__indicator">✓</Combobox.ItemIndicator>{children}</Combobox.Item>;
  },
);

GummyComboboxLabel.displayName = "GummyComboboxLabel";
GummyComboboxInputGroup.displayName = "GummyComboboxInputGroup";
GummyComboboxInput.displayName = "GummyComboboxInput";
GummyComboboxTrigger.displayName = "GummyComboboxTrigger";
GummyComboboxPositioner.displayName = "GummyComboboxPositioner";
GummyComboboxPopup.displayName = "GummyComboboxPopup";
GummyComboboxEmpty.displayName = "GummyComboboxEmpty";
GummyComboboxItem.displayName = "GummyComboboxItem";
