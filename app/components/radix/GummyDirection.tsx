"use client";

import { DirectionProvider } from "@radix-ui/react-direction";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type GummyDirectionProps = React.HTMLAttributes<HTMLDivElement> & {
  direction: "ltr" | "rtl";
};

export const GummyDirection = React.forwardRef<HTMLDivElement, GummyDirectionProps>(
  function GummyDirection({ direction, className, children, ...props }, ref) {
    return (
      <div
        {...props}
        ref={ref}
        dir={direction}
        className={joinClassNames("gummy-direction", className)}
        data-direction={direction}
      >
        <DirectionProvider dir={direction}>{children}</DirectionProvider>
      </div>
    );
  },
);

GummyDirection.displayName = "GummyDirection";
