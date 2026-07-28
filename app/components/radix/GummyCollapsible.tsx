"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const GummyCollapsible = Collapsible.Root;

export const GummyCollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof Collapsible.Trigger>,
  React.ComponentPropsWithoutRef<typeof Collapsible.Trigger>
>(function GummyCollapsibleTrigger({ className, children, ...props }, ref) {
  return (
    <Collapsible.Trigger
      {...props}
      ref={ref}
      className={joinClassNames("gummy-collapsible__trigger", className)}
    >
      <span>{children}</span>
      <span className="gummy-collapsible__indicator" aria-hidden="true">+</span>
    </Collapsible.Trigger>
  );
});

export const GummyCollapsiblePanel = React.forwardRef<
  React.ElementRef<typeof Collapsible.Content>,
  React.ComponentPropsWithoutRef<typeof Collapsible.Content>
>(function GummyCollapsiblePanel({ className, children, ...props }, ref) {
  return (
    <Collapsible.Content
      {...props}
      ref={ref}
      className={joinClassNames("gummy-collapsible__panel", className)}
    >
      <div className="gummy-collapsible__panel-content">{children}</div>
    </Collapsible.Content>
  );
});

GummyCollapsibleTrigger.displayName = "GummyCollapsibleTrigger";
GummyCollapsiblePanel.displayName = "GummyCollapsiblePanel";
