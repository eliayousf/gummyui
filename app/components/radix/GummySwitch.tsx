"use client";

import * as Switch from "@radix-ui/react-switch";
import * as React from "react";

export type GummySwitchProps = Omit<
  React.ComponentPropsWithoutRef<typeof Switch.Root>,
  "children"
> & {
  label: React.ReactNode;
  description?: React.ReactNode;
  previewFocus?: boolean;
  className?: string;
};

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const GummySwitch = React.forwardRef<
  React.ElementRef<typeof Switch.Root>,
  GummySwitchProps
>(function GummySwitch(
  {
    label,
    description,
    id: providedId,
    className,
    previewFocus = false,
    disabled,
    ...rootProps
  },
  ref,
) {
  const generatedId = React.useId();
  const id = providedId ?? `gummy-switch-${generatedId}`;
  const labelId = `${id}-label`;
  const descriptionId = description ? `${id}-description` : undefined;
  return (
    <div
      className={joinClassNames("gummy-switch-field", className)}
      data-disabled={disabled || undefined}
    >
      <Switch.Root
        {...rootProps}
        ref={ref}
        id={id}
        disabled={disabled}
        className="gummy-switch"
        aria-label={
          rootProps["aria-label"] ??
          (typeof label === "string" ? label : undefined)
        }
        aria-labelledby={
          rootProps["aria-label"] || typeof label === "string"
            ? undefined
            : labelId
        }
        aria-describedby={descriptionId}
        data-preview-focus={previewFocus || undefined}
      >
        <span className="gummy-switch__pool" aria-hidden="true" />
        <Switch.Thumb className="gummy-switch__thumb">
          <span aria-hidden="true" />
        </Switch.Thumb>
      </Switch.Root>
      <div className="gummy-switch-field__copy">
        <label id={labelId} htmlFor={id}>{label}</label>
        {description ? <p id={descriptionId}>{description}</p> : null}
      </div>
    </div>
  );
});

GummySwitch.displayName = "GummySwitch";
