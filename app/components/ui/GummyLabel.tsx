"use client";

import * as React from "react";

export type GummyLabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  /** Shows a visible, non-colour-only required cue. */
  required?: boolean;
  /** Shows an optional cue when the field is not required. */
  optional?: boolean;
  /** Mirrors the state of the associated control. */
  disabled?: boolean;
  /** Mirrors the state of an associated read-only control. */
  readOnly?: boolean;
  /** Replaces the generated Required, Optional, or Read only cue. */
  meta?: React.ReactNode;
};

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const GummyLabel = React.forwardRef<HTMLLabelElement, GummyLabelProps>(
  function GummyLabel(
    {
      required = false,
      optional = false,
      disabled = false,
      readOnly = false,
      meta,
      className,
      children,
      ...labelProps
    },
    ref,
  ) {
    const generatedMeta = readOnly
      ? "Read only"
      : required
        ? "Required"
        : optional
          ? "Optional"
          : null;

    return (
      <label
        {...labelProps}
        ref={ref}
        className={joinClassNames("gummy-label", className)}
        data-disabled={disabled || undefined}
        data-read-only={readOnly || undefined}
        data-required={required || undefined}
      >
        <span className="gummy-label__copy">{children}</span>
        {meta ?? generatedMeta ? (
          <span className="gummy-label__meta" aria-hidden="true">
            {meta ?? generatedMeta}
          </span>
        ) : null}
      </label>
    );
  },
);

GummyLabel.displayName = "GummyLabel";
