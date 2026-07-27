"use client";

import { ScrollArea } from "@base-ui/react/scroll-area";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const GummyScrollArea = React.forwardRef<HTMLDivElement, ScrollArea.Root.Props>(
  function GummyScrollArea({ className, ...props }, ref) {
    return <ScrollArea.Root {...props} ref={ref} className={joinClassNames("gummy-scroll-area", className as string)} />;
  },
);

export const GummyScrollAreaViewport = React.forwardRef<HTMLDivElement, ScrollArea.Viewport.Props>(
  function GummyScrollAreaViewport({ className, tabIndex = 0, ...props }, ref) {
    const hasAccessibleName = Boolean(
      props["aria-label"] || props["aria-labelledby"],
    );
    return <ScrollArea.Viewport {...props} ref={ref} role={props.role ?? (hasAccessibleName ? "region" : undefined)} tabIndex={tabIndex} className={joinClassNames("gummy-scroll-area__viewport", className as string)} />;
  },
);

export const GummyScrollAreaContent = React.forwardRef<HTMLDivElement, ScrollArea.Content.Props>(
  function GummyScrollAreaContent({ className, ...props }, ref) {
    return <ScrollArea.Content {...props} ref={ref} className={joinClassNames("gummy-scroll-area__content", className as string)} />;
  },
);

export const GummyScrollAreaScrollbar = React.forwardRef<HTMLDivElement, ScrollArea.Scrollbar.Props>(
  function GummyScrollAreaScrollbar({ className, ...props }, ref) {
    return <ScrollArea.Scrollbar {...props} ref={ref} className={joinClassNames("gummy-scroll-area__scrollbar", className as string)} />;
  },
);

export const GummyScrollAreaThumb = React.forwardRef<HTMLDivElement, ScrollArea.Thumb.Props>(
  function GummyScrollAreaThumb({ className, ...props }, ref) {
    return <ScrollArea.Thumb {...props} ref={ref} className={joinClassNames("gummy-scroll-area__thumb", className as string)} />;
  },
);

export const GummyScrollAreaCorner = ScrollArea.Corner;

GummyScrollArea.displayName = "GummyScrollArea";
GummyScrollAreaViewport.displayName = "GummyScrollAreaViewport";
GummyScrollAreaContent.displayName = "GummyScrollAreaContent";
GummyScrollAreaScrollbar.displayName = "GummyScrollAreaScrollbar";
GummyScrollAreaThumb.displayName = "GummyScrollAreaThumb";
