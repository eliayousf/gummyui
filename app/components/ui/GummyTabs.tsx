"use client";

import { Tabs } from "@base-ui/react/tabs";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type GummyTabsProps = Tabs.Root.Props;

export function GummyTabs({ className, ...props }: GummyTabsProps) {
  return <Tabs.Root {...props} className={joinClassNames("gummy-tabs", className as string)} />;
}

export const GummyTabsList = React.forwardRef<
  HTMLDivElement,
  Tabs.List.Props
>(function GummyTabsList({ className, children, ...props }, ref) {
  const { activateOnFocus = true, ...listProps } = props;
  return (
    <Tabs.List {...listProps} ref={ref} activateOnFocus={activateOnFocus} className={joinClassNames("gummy-tabs__list", className as string)}>
      <Tabs.Indicator className="gummy-tabs__indicator" />
      {children}
    </Tabs.List>
  );
});

export const GummyTab = React.forwardRef<HTMLElement, Tabs.Tab.Props>(
  function GummyTab({ className, ...props }, ref) {
    return <Tabs.Tab {...props} ref={ref} className={joinClassNames("gummy-tabs__tab", className as string)} />;
  },
);

export const GummyTabPanel = React.forwardRef<
  HTMLDivElement,
  Tabs.Panel.Props
>(function GummyTabPanel({ className, ...props }, ref) {
  return <Tabs.Panel {...props} ref={ref} className={joinClassNames("gummy-tabs__panel", className as string)} />;
});

GummyTabsList.displayName = "GummyTabsList";
GummyTab.displayName = "GummyTab";
GummyTabPanel.displayName = "GummyTabPanel";
