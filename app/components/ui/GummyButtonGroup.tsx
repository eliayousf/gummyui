import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type GummyButtonGroupProps = React.HTMLAttributes<HTMLDivElement> & {
  label: string;
  orientation?: "horizontal" | "vertical";
  attached?: boolean;
};

export const GummyButtonGroup = React.forwardRef<
  HTMLDivElement,
  GummyButtonGroupProps
>(function GummyButtonGroup(
  {
    label,
    orientation = "horizontal",
    attached = true,
    className,
    ...props
  },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={joinClassNames("gummy-button-group", className)}
      role="group"
      aria-label={label}
      data-orientation={orientation}
      data-attached={attached || undefined}
    />
  );
});

GummyButtonGroup.displayName = "GummyButtonGroup";

export function GummyButtonGroupSeparator() {
  return <span className="gummy-button-group__separator" aria-hidden="true" />;
}

export type GummyButtonGroupTextProps = React.HTMLAttributes<HTMLSpanElement>;

export const GummyButtonGroupText = React.forwardRef<
  HTMLSpanElement,
  GummyButtonGroupTextProps
>(function GummyButtonGroupText({ className, ...props }, ref) {
  return (
    <span
      {...props}
      ref={ref}
      className={joinClassNames("gummy-button-group__text", className)}
    />
  );
});

GummyButtonGroupText.displayName = "GummyButtonGroupText";
