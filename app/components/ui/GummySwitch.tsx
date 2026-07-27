"use client";

import { Switch } from "@base-ui/react/switch";
import * as React from "react";

export type GummySwitchProps = Omit<
  Switch.Root.Props,
  "children" | "nativeButton" | "render"
> & {
  /** Visible control label. */
  label: React.ReactNode;
  /** Optional supporting copy associated with the switch. */
  description?: React.ReactNode;
  /** Keeps forced states in the Lab visually inspectable without changing semantics. */
  previewFocus?: boolean;
  className?: string;
};

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const GummySwitch = React.forwardRef<HTMLElement, GummySwitchProps>(
  function GummySwitch(
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
          nativeButton
          render={<button type="button" />}
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
  },
);

GummySwitch.displayName = "GummySwitch";
