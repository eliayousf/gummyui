"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const GummyDrawer = Dialog.Root;
export const GummyDrawerPortal = Dialog.Portal;

export const GummyDrawerTrigger = React.forwardRef<
  React.ElementRef<typeof Dialog.Trigger>,
  React.ComponentPropsWithoutRef<typeof Dialog.Trigger>
>(function GummyDrawerTrigger({ className, ...props }, ref) {
  return <Dialog.Trigger {...props} ref={ref} className={joinClassNames("gummy-overlay-trigger", className)} />;
});

export const GummyDrawerBackdrop = React.forwardRef<
  React.ElementRef<typeof Dialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof Dialog.Overlay>
>(function GummyDrawerBackdrop({ className, ...props }, ref) {
  return <Dialog.Overlay {...props} ref={ref} className={joinClassNames("gummy-overlay-backdrop", className)} />;
});

export const GummyDrawerViewport = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function GummyDrawerViewport({ className, ...props }, ref) {
  return <div {...props} ref={ref} className={joinClassNames("gummy-drawer__viewport", className)} />;
});

export const GummyDrawerPopup = React.forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  React.ComponentPropsWithoutRef<typeof Dialog.Content>
>(function GummyDrawerPopup({ className, children, ...props }, ref) {
  return (
    <Dialog.Content
      {...props}
      ref={ref}
      className={joinClassNames("gummy-drawer__popup", className)}
    >
      <div className="gummy-drawer__handle" aria-hidden="true" />
      {children}
    </Dialog.Content>
  );
});

export const GummyDrawerTitle = React.forwardRef<
  React.ElementRef<typeof Dialog.Title>,
  React.ComponentPropsWithoutRef<typeof Dialog.Title>
>(function GummyDrawerTitle({ className, ...props }, ref) {
  return <Dialog.Title {...props} ref={ref} className={joinClassNames("gummy-overlay-popup__title", className)} />;
});

export const GummyDrawerDescription = React.forwardRef<
  React.ElementRef<typeof Dialog.Description>,
  React.ComponentPropsWithoutRef<typeof Dialog.Description>
>(function GummyDrawerDescription({ className, ...props }, ref) {
  return <Dialog.Description {...props} ref={ref} className={joinClassNames("gummy-overlay-popup__description", className)} />;
});

export const GummyDrawerClose = Dialog.Close;

GummyDrawerTrigger.displayName = "GummyDrawerTrigger";
GummyDrawerBackdrop.displayName = "GummyDrawerBackdrop";
GummyDrawerViewport.displayName = "GummyDrawerViewport";
GummyDrawerPopup.displayName = "GummyDrawerPopup";
GummyDrawerTitle.displayName = "GummyDrawerTitle";
GummyDrawerDescription.displayName = "GummyDrawerDescription";
