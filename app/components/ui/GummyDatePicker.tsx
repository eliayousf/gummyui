"use client";

import * as React from "react";
import { GummyCalendar } from "./GummyCalendar";
import {
  GummyPopover,
  GummyPopoverClose,
  GummyPopoverPopup,
  GummyPopoverPortal,
  GummyPopoverPositioner,
  GummyPopoverTrigger,
} from "./GummyPopover";

export type GummyDatePickerProps = {
  label: string;
  value?: Date;
  defaultValue?: Date;
  onValueChange?: (date: Date) => void;
  min?: Date;
  max?: Date;
  locale?: string;
  disabled?: boolean;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange">;

export const GummyDatePicker = React.forwardRef<HTMLDivElement, GummyDatePickerProps>(
  function GummyDatePicker(
    {
      label,
      value,
      defaultValue,
      onValueChange,
      min,
      max,
      locale = "en-US",
      disabled,
      className,
      ...props
    },
    ref,
  ) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  const selected = value ?? internalValue;
  const formatted = selected
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(selected)
    : "Choose date";
  return (
    <div {...props} ref={ref} className={["gummy-date-picker", className].filter(Boolean).join(" ")}>
      <span className="gummy-date-picker__label">{label}</span>
      <GummyPopover open={open} onOpenChange={setOpen}>
        <GummyPopoverTrigger disabled={disabled} aria-label={`${label}: ${formatted}`}>
          <span>{formatted}</span><span aria-hidden="true">▦</span>
        </GummyPopoverTrigger>
        <GummyPopoverPortal>
          <GummyPopoverPositioner>
            <GummyPopoverPopup aria-label={label}>
              <GummyCalendar
                value={selected}
                onValueChange={(date) => {
                  if (value === undefined) setInternalValue(date);
                  onValueChange?.(date);
                  setOpen(false);
                }}
                min={min}
                max={max}
                locale={locale}
                label={label}
              />
              <GummyPopoverClose className="gummy-date-picker__close">Close calendar</GummyPopoverClose>
            </GummyPopoverPopup>
          </GummyPopoverPositioner>
        </GummyPopoverPortal>
      </GummyPopover>
    </div>
  );
  },
);

GummyDatePicker.displayName = "GummyDatePicker";
