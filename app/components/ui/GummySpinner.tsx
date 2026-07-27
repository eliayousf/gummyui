import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type GummySpinnerProps = React.HTMLAttributes<HTMLSpanElement> & {
  label?: string;
  size?: "small" | "medium" | "large";
  tone?: "raspberry" | "grape" | "aqua" | "current";
};

export const GummySpinner = React.forwardRef<
  HTMLSpanElement,
  GummySpinnerProps
>(function GummySpinner(
  {
    label = "Loading",
    size = "medium",
    tone = "raspberry",
    className,
    ...spinnerProps
  },
  ref,
) {
  return (
    <span
      {...spinnerProps}
      ref={ref}
      className={joinClassNames("gummy-spinner", className)}
      data-size={size}
      data-tone={tone}
      role="status"
      aria-label={label}
    >
      <span className="gummy-spinner__track" aria-hidden="true">
        <span className="gummy-spinner__drop" />
      </span>
    </span>
  );
});

GummySpinner.displayName = "GummySpinner";
