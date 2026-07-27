"use client";

import { Dialog } from "@base-ui/react/dialog";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const GummySheet = Dialog.Root;
export const GummySheetPortal = Dialog.Portal;

export const GummySheetTrigger = React.forwardRef<
  HTMLButtonElement,
  Dialog.Trigger.Props
>(function GummySheetTrigger({ className, ...props }, ref) {
  return <Dialog.Trigger {...props} ref={ref} className={joinClassNames("gummy-overlay-trigger", className as string)} />;
});

export const GummySheetBackdrop = React.forwardRef<
  HTMLDivElement,
  Dialog.Backdrop.Props
>(function GummySheetBackdrop({ className, ...props }, ref) {
  return <Dialog.Backdrop {...props} ref={ref} className={joinClassNames("gummy-overlay-backdrop", className as string)} />;
});

export const GummySheetViewport = React.forwardRef<
  HTMLDivElement,
  Dialog.Viewport.Props
>(function GummySheetViewport({ className, ...props }, ref) {
  return <Dialog.Viewport {...props} ref={ref} className={joinClassNames("gummy-sheet__viewport", className as string)} />;
});

export type GummySheetPopupProps = Dialog.Popup.Props & {
  side?: "left" | "right" | "top" | "bottom";
};

export const GummySheetPopup = React.forwardRef<
  HTMLDivElement,
  GummySheetPopupProps
>(function GummySheetPopup({ side = "right", className, children, ...props }, ref) {
  return (
    <Dialog.Popup
      {...props}
      ref={ref}
      className={joinClassNames("gummy-sheet__popup", className as string)}
      data-side={side}
    >
      <span className="gummy-sheet__reservoir" aria-hidden="true" />
      {children}
    </Dialog.Popup>
  );
});

export const GummySheetTitle = React.forwardRef<
  HTMLHeadingElement,
  Dialog.Title.Props
>(function GummySheetTitle({ className, ...props }, ref) {
  return <Dialog.Title {...props} ref={ref} className={joinClassNames("gummy-overlay-popup__title", className as string)} />;
});

export const GummySheetDescription = React.forwardRef<
  HTMLParagraphElement,
  Dialog.Description.Props
>(function GummySheetDescription({ className, ...props }, ref) {
  return <Dialog.Description {...props} ref={ref} className={joinClassNames("gummy-overlay-popup__description", className as string)} />;
});

export const GummySheetClose = Dialog.Close;

GummySheetTrigger.displayName = "GummySheetTrigger";
GummySheetBackdrop.displayName = "GummySheetBackdrop";
GummySheetViewport.displayName = "GummySheetViewport";
GummySheetPopup.displayName = "GummySheetPopup";
GummySheetTitle.displayName = "GummySheetTitle";
GummySheetDescription.displayName = "GummySheetDescription";
