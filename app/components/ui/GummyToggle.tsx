"use client";

import { Toggle } from "@base-ui/react/toggle";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type GummyToggleProps = Toggle.Props & {
  variant?: "quiet" | "fruit";
};

export const GummyToggle = React.forwardRef<
  HTMLButtonElement,
  GummyToggleProps
>(function GummyToggle(
  { variant = "quiet", className, children, ...props },
  ref,
) {
  return (
    <Toggle
      {...props}
      ref={ref}
      className={joinClassNames("gummy-toggle", className as string)}
      data-variant={variant}
    >
      <span className="gummy-toggle__pool" aria-hidden="true" />
      <span className="gummy-toggle__content">{children}</span>
    </Toggle>
  );
});

GummyToggle.displayName = "GummyToggle";
