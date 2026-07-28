"use client";

import * as Accordion from "@radix-ui/react-accordion";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type GummyAccordionProps = Omit<
  Accordion.AccordionMultipleProps,
  "type"
>;

export function GummyAccordion({ className, ...props }: GummyAccordionProps) {
  return (
    <Accordion.Root
      {...props}
      type="multiple"
      className={joinClassNames("gummy-accordion", className)}
    />
  );
}

export const GummyAccordionItem = React.forwardRef<
  React.ElementRef<typeof Accordion.Item>,
  React.ComponentPropsWithoutRef<typeof Accordion.Item>
>(function GummyAccordionItem({ className, ...props }, ref) {
  return (
    <Accordion.Item
      {...props}
      ref={ref}
      className={joinClassNames("gummy-accordion__item", className)}
    />
  );
});

export const GummyAccordionHeader = React.forwardRef<
  React.ElementRef<typeof Accordion.Header>,
  React.ComponentPropsWithoutRef<typeof Accordion.Header>
>(function GummyAccordionHeader({ className, ...props }, ref) {
  return (
    <Accordion.Header
      {...props}
      ref={ref}
      className={joinClassNames("gummy-accordion__header", className)}
    />
  );
});

export const GummyAccordionTrigger = React.forwardRef<
  React.ElementRef<typeof Accordion.Trigger>,
  React.ComponentPropsWithoutRef<typeof Accordion.Trigger>
>(function GummyAccordionTrigger({ className, children, ...props }, ref) {
  return (
    <Accordion.Trigger
      {...props}
      ref={ref}
      className={joinClassNames("gummy-accordion__trigger", className)}
    >
      <span>{children}</span>
      <span className="gummy-accordion__indicator" aria-hidden="true">+</span>
    </Accordion.Trigger>
  );
});

export const GummyAccordionPanel = React.forwardRef<
  React.ElementRef<typeof Accordion.Content>,
  React.ComponentPropsWithoutRef<typeof Accordion.Content>
>(function GummyAccordionPanel({ className, children, ...props }, ref) {
  return (
    <Accordion.Content
      {...props}
      ref={ref}
      className={joinClassNames("gummy-accordion__panel", className)}
    >
      <div className="gummy-accordion__panel-content">{children}</div>
    </Accordion.Content>
  );
});

GummyAccordionItem.displayName = "GummyAccordionItem";
GummyAccordionHeader.displayName = "GummyAccordionHeader";
GummyAccordionTrigger.displayName = "GummyAccordionTrigger";
GummyAccordionPanel.displayName = "GummyAccordionPanel";
