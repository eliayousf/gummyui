"use client";

import * as Toggle from "@radix-ui/react-toggle";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type GummyToggleProps = React.ComponentPropsWithoutRef<typeof Toggle.Root> & {
  variant?: "quiet" | "fruit";
};

export const GummyToggle = React.forwardRef<
  React.ElementRef<typeof Toggle.Root>,
  GummyToggleProps
>(function GummyToggle(
  { variant = "quiet", className, children, ...props },
  ref,
) {
  return (
    <Toggle.Root
      {...props}
      ref={ref}
      className={joinClassNames("gummy-toggle", className)}
      data-variant={variant}
    >
      <span className="gummy-toggle__pool" aria-hidden="true" />
      <span className="gummy-toggle__content">{children}</span>
    </Toggle.Root>
  );
});

GummyToggle.displayName = "GummyToggle";
