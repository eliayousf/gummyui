"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const GummyCollapsible = Collapsible.Root;

export const GummyCollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  Collapsible.Trigger.Props
>(function GummyCollapsibleTrigger({ className, children, ...props }, ref) {
  return (
    <Collapsible.Trigger
      {...props}
      ref={ref}
      className={joinClassNames("gummy-collapsible__trigger", className as string)}
    >
      <span>{children}</span>
      <span className="gummy-collapsible__indicator" aria-hidden="true">+</span>
    </Collapsible.Trigger>
  );
});

export const GummyCollapsiblePanel = React.forwardRef<
  HTMLDivElement,
  Collapsible.Panel.Props
>(function GummyCollapsiblePanel({ className, children, ...props }, ref) {
  return (
    <Collapsible.Panel
      {...props}
      ref={ref}
      className={joinClassNames("gummy-collapsible__panel", className as string)}
    >
      <div className="gummy-collapsible__panel-content">{children}</div>
    </Collapsible.Panel>
  );
});

GummyCollapsibleTrigger.displayName = "GummyCollapsibleTrigger";
GummyCollapsiblePanel.displayName = "GummyCollapsiblePanel";
