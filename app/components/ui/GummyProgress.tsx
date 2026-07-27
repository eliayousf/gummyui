import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type GummyProgressProps = Omit<
  React.ProgressHTMLAttributes<HTMLProgressElement>,
  "children"
> & {
  label: React.ReactNode;
  valueLabel?: React.ReactNode;
  tone?: "raspberry" | "grape" | "lime" | "aqua";
  showValue?: boolean;
};

export const GummyProgress = React.forwardRef<
  HTMLProgressElement,
  GummyProgressProps
>(function GummyProgress(
  {
    label,
    valueLabel,
    tone = "raspberry",
    showValue = true,
    value,
    max = 100,
    className,
    id: providedId,
    ...progressProps
  },
  ref,
) {
  const generatedId = React.useId().replace(/:/g, "");
  const id = providedId ?? `gummy-progress-${generatedId}`;
  const numericValue = typeof value === "number" ? value : undefined;
  const numericMax = typeof max === "number" && max > 0 ? max : 100;
  const percentage =
    numericValue === undefined
      ? undefined
      : Math.round(Math.max(0, Math.min(1, numericValue / numericMax)) * 100);
  return (
    <div
      className={joinClassNames("gummy-progress", className)}
      data-tone={tone}
      data-indeterminate={numericValue === undefined || undefined}
    >
      <div className="gummy-progress__header">
        <label htmlFor={id}>{label}</label>
        {showValue ? (
          <span>
            {valueLabel ?? (percentage === undefined ? "In progress" : `${percentage}%`)}
          </span>
        ) : null}
      </div>
      <div className="gummy-progress__shell">
        <progress
          {...progressProps}
          ref={ref}
          id={id}
          value={numericValue}
          max={numericMax}
        />
        <span className="gummy-progress__pool" aria-hidden="true" />
      </div>
    </div>
  );
});

GummyProgress.displayName = "GummyProgress";
