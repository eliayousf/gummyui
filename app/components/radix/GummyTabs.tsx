"use client";

import * as Tabs from "@radix-ui/react-tabs";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type GummyTabsProps = React.ComponentPropsWithoutRef<typeof Tabs.Root>;

export function GummyTabs({ className, ...props }: GummyTabsProps) {
  return <Tabs.Root {...props} className={joinClassNames("gummy-tabs", className)} />;
}

export const GummyTabsList = React.forwardRef<
  React.ElementRef<typeof Tabs.List>,
  React.ComponentPropsWithoutRef<typeof Tabs.List>
>(function GummyTabsList({ className, children, ...props }, ref) {
  return (
    <Tabs.List
      {...props}
      ref={ref}
      className={joinClassNames("gummy-tabs__list", className)}
    >
      <span className="gummy-tabs__indicator" aria-hidden="true" />
      {children}
    </Tabs.List>
  );
});

export const GummyTab = React.forwardRef<
  React.ElementRef<typeof Tabs.Trigger>,
  React.ComponentPropsWithoutRef<typeof Tabs.Trigger>
>(function GummyTab({ className, ...props }, ref) {
  return (
    <Tabs.Trigger
      {...props}
      ref={ref}
      className={joinClassNames("gummy-tabs__tab", className)}
    />
  );
});

export const GummyTabPanel = React.forwardRef<
  React.ElementRef<typeof Tabs.Content>,
  React.ComponentPropsWithoutRef<typeof Tabs.Content>
>(function GummyTabPanel({ className, ...props }, ref) {
  return (
    <Tabs.Content
      {...props}
      ref={ref}
      className={joinClassNames("gummy-tabs__panel", className)}
    />
  );
});

GummyTabsList.displayName = "GummyTabsList";
GummyTab.displayName = "GummyTab";
GummyTabPanel.displayName = "GummyTabPanel";
