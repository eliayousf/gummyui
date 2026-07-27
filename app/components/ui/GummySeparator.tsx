"use client";

import * as React from "react";

export type GummySeparatorProps = React.HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
  tone?: "quiet" | "fruit";
};

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const GummySeparator = React.forwardRef<
  HTMLDivElement,
  GummySeparatorProps
>(function GummySeparator(
  {
    orientation = "horizontal",
    decorative = true,
    tone = "quiet",
    className,
    ...separatorProps
  },
  ref,
) {
  return (
    <div
      {...separatorProps}
      ref={ref}
      className={joinClassNames("gummy-separator", className)}
      data-orientation={orientation}
      data-tone={tone}
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative ? undefined : orientation}
    >
      <span className="gummy-separator__pool" aria-hidden="true" />
    </div>
  );
});

GummySeparator.displayName = "GummySeparator";
