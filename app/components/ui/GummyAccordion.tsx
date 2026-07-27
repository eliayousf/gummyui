"use client";

import { Accordion } from "@base-ui/react/accordion";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type GummyAccordionProps = Accordion.Root.Props;

export function GummyAccordion({ className, ...props }: GummyAccordionProps) {
  return (
    <Accordion.Root
      {...props}
      className={joinClassNames("gummy-accordion", className as string)}
    />
  );
}

export const GummyAccordionItem = React.forwardRef<
  HTMLDivElement,
  Accordion.Item.Props
>(function GummyAccordionItem({ className, ...props }, ref) {
  return (
    <Accordion.Item
      {...props}
      ref={ref}
      className={joinClassNames("gummy-accordion__item", className as string)}
    />
  );
});

export const GummyAccordionHeader = React.forwardRef<
  HTMLHeadingElement,
  Accordion.Header.Props
>(function GummyAccordionHeader({ className, ...props }, ref) {
  return (
    <Accordion.Header
      {...props}
      ref={ref}
      className={joinClassNames("gummy-accordion__header", className as string)}
    />
  );
});

export const GummyAccordionTrigger = React.forwardRef<
  HTMLElement,
  Accordion.Trigger.Props
>(function GummyAccordionTrigger({ className, children, ...props }, ref) {
  return (
    <Accordion.Trigger
      {...props}
      ref={ref}
      className={joinClassNames("gummy-accordion__trigger", className as string)}
    >
      <span>{children}</span>
      <span className="gummy-accordion__indicator" aria-hidden="true">+</span>
    </Accordion.Trigger>
  );
});

export const GummyAccordionPanel = React.forwardRef<
  HTMLDivElement,
  Accordion.Panel.Props
>(function GummyAccordionPanel({ className, children, ...props }, ref) {
  return (
    <Accordion.Panel
      {...props}
      ref={ref}
      className={joinClassNames("gummy-accordion__panel", className as string)}
    >
      <div className="gummy-accordion__panel-content">{children}</div>
    </Accordion.Panel>
  );
});

GummyAccordionItem.displayName = "GummyAccordionItem";
GummyAccordionHeader.displayName = "GummyAccordionHeader";
GummyAccordionTrigger.displayName = "GummyAccordionTrigger";
GummyAccordionPanel.displayName = "GummyAccordionPanel";
