"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const GummySheet = Dialog.Root;
export const GummySheetPortal = Dialog.Portal;

export const GummySheetTrigger = React.forwardRef<
  React.ElementRef<typeof Dialog.Trigger>,
  React.ComponentPropsWithoutRef<typeof Dialog.Trigger>
>(function GummySheetTrigger({ className, ...props }, ref) {
  return <Dialog.Trigger {...props} ref={ref} className={joinClassNames("gummy-overlay-trigger", className)} />;
});

export const GummySheetBackdrop = React.forwardRef<
  React.ElementRef<typeof Dialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof Dialog.Overlay>
>(function GummySheetBackdrop({ className, ...props }, ref) {
  return <Dialog.Overlay {...props} ref={ref} className={joinClassNames("gummy-overlay-backdrop", className)} />;
});

export const GummySheetViewport = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function GummySheetViewport({ className, ...props }, ref) {
  return <div {...props} ref={ref} className={joinClassNames("gummy-sheet__viewport", className)} />;
});

export type GummySheetPopupProps =
  React.ComponentPropsWithoutRef<typeof Dialog.Content> & {
    side?: "left" | "right" | "top" | "bottom";
  };

export const GummySheetPopup = React.forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  GummySheetPopupProps
>(function GummySheetPopup(
  { side = "right", className, children, ...props },
  ref,
) {
  return (
    <Dialog.Content
      {...props}
      ref={ref}
      className={joinClassNames("gummy-sheet__popup", className)}
      data-side={side}
    >
      <span className="gummy-sheet__reservoir" aria-hidden="true" />
      {children}
    </Dialog.Content>
  );
});

export const GummySheetTitle = React.forwardRef<
  React.ElementRef<typeof Dialog.Title>,
  React.ComponentPropsWithoutRef<typeof Dialog.Title>
>(function GummySheetTitle({ className, ...props }, ref) {
  return <Dialog.Title {...props} ref={ref} className={joinClassNames("gummy-overlay-popup__title", className)} />;
});

export const GummySheetDescription = React.forwardRef<
  React.ElementRef<typeof Dialog.Description>,
  React.ComponentPropsWithoutRef<typeof Dialog.Description>
>(function GummySheetDescription({ className, ...props }, ref) {
  return <Dialog.Description {...props} ref={ref} className={joinClassNames("gummy-overlay-popup__description", className)} />;
});

export const GummySheetClose = Dialog.Close;

GummySheetTrigger.displayName = "GummySheetTrigger";
GummySheetBackdrop.displayName = "GummySheetBackdrop";
GummySheetViewport.displayName = "GummySheetViewport";
GummySheetPopup.displayName = "GummySheetPopup";
GummySheetTitle.displayName = "GummySheetTitle";
GummySheetDescription.displayName = "GummySheetDescription";
