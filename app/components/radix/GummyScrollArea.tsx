"use client";

import * as ScrollArea from "@radix-ui/react-scroll-area";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const GummyScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollArea.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollArea.Root>
>(function GummyScrollArea({ className, ...props }, ref) {
  return <ScrollArea.Root {...props} ref={ref} className={joinClassNames("gummy-scroll-area", className)} />;
});

export const GummyScrollAreaViewport = React.forwardRef<
  React.ElementRef<typeof ScrollArea.Viewport>,
  React.ComponentPropsWithoutRef<typeof ScrollArea.Viewport>
>(function GummyScrollAreaViewport(
  { className, tabIndex = 0, ...props },
  ref,
) {
  const hasAccessibleName = Boolean(
    props["aria-label"] || props["aria-labelledby"],
  );
  return (
    <ScrollArea.Viewport
      {...props}
      ref={ref}
      role={props.role ?? (hasAccessibleName ? "region" : undefined)}
      tabIndex={tabIndex}
      className={joinClassNames("gummy-scroll-area__viewport", className)}
    />
  );
});

export const GummyScrollAreaContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function GummyScrollAreaContent({ className, ...props }, ref) {
  return <div {...props} ref={ref} className={joinClassNames("gummy-scroll-area__content", className)} />;
});

export const GummyScrollAreaScrollbar = React.forwardRef<
  React.ElementRef<typeof ScrollArea.Scrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollArea.Scrollbar>
>(function GummyScrollAreaScrollbar({ className, ...props }, ref) {
  return <ScrollArea.Scrollbar {...props} ref={ref} className={joinClassNames("gummy-scroll-area__scrollbar", className)} />;
});

export const GummyScrollAreaThumb = React.forwardRef<
  React.ElementRef<typeof ScrollArea.Thumb>,
  React.ComponentPropsWithoutRef<typeof ScrollArea.Thumb>
>(function GummyScrollAreaThumb({ className, ...props }, ref) {
  return <ScrollArea.Thumb {...props} ref={ref} className={joinClassNames("gummy-scroll-area__thumb", className)} />;
});

export const GummyScrollAreaCorner = ScrollArea.Corner;

GummyScrollArea.displayName = "GummyScrollArea";
GummyScrollAreaViewport.displayName = "GummyScrollAreaViewport";
GummyScrollAreaContent.displayName = "GummyScrollAreaContent";
GummyScrollAreaScrollbar.displayName = "GummyScrollAreaScrollbar";
GummyScrollAreaThumb.displayName = "GummyScrollAreaThumb";
