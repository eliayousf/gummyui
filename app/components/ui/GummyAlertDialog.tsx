"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const GummyAlertDialog = AlertDialog.Root;
export const GummyAlertDialogPortal = AlertDialog.Portal;

export const GummyAlertDialogTrigger = React.forwardRef<
  HTMLButtonElement,
  AlertDialog.Trigger.Props
>(function GummyAlertDialogTrigger({ className, ...props }, ref) {
  return (
    <AlertDialog.Trigger
      {...props}
      ref={ref}
      className={joinClassNames("gummy-overlay-trigger", className as string)}
    />
  );
});

export const GummyAlertDialogBackdrop = React.forwardRef<
  HTMLDivElement,
  AlertDialog.Backdrop.Props
>(function GummyAlertDialogBackdrop({ className, ...props }, ref) {
  return (
    <AlertDialog.Backdrop
      {...props}
      ref={ref}
      className={joinClassNames("gummy-overlay-backdrop", className as string)}
    />
  );
});

export const GummyAlertDialogViewport = React.forwardRef<
  HTMLDivElement,
  AlertDialog.Viewport.Props
>(function GummyAlertDialogViewport({ className, ...props }, ref) {
  return (
    <AlertDialog.Viewport
      {...props}
      ref={ref}
      className={joinClassNames("gummy-overlay-viewport", className as string)}
    />
  );
});

export const GummyAlertDialogPopup = React.forwardRef<
  HTMLDivElement,
  AlertDialog.Popup.Props
>(function GummyAlertDialogPopup({ className, children, ...props }, ref) {
  return (
    <AlertDialog.Popup
      {...props}
      ref={ref}
      className={joinClassNames("gummy-overlay-popup gummy-alert-dialog__popup", className as string)}
    >
      <span className="gummy-overlay-popup__reservoir" aria-hidden="true" />
      {children}
    </AlertDialog.Popup>
  );
});

export const GummyAlertDialogTitle = React.forwardRef<
  HTMLHeadingElement,
  AlertDialog.Title.Props
>(function GummyAlertDialogTitle({ className, ...props }, ref) {
  return (
    <AlertDialog.Title
      {...props}
      ref={ref}
      className={joinClassNames("gummy-overlay-popup__title", className as string)}
    />
  );
});

export const GummyAlertDialogDescription = React.forwardRef<
  HTMLParagraphElement,
  AlertDialog.Description.Props
>(function GummyAlertDialogDescription({ className, ...props }, ref) {
  return (
    <AlertDialog.Description
      {...props}
      ref={ref}
      className={joinClassNames("gummy-overlay-popup__description", className as string)}
    />
  );
});

export const GummyAlertDialogClose = AlertDialog.Close;

GummyAlertDialogTrigger.displayName = "GummyAlertDialogTrigger";
GummyAlertDialogBackdrop.displayName = "GummyAlertDialogBackdrop";
GummyAlertDialogViewport.displayName = "GummyAlertDialogViewport";
GummyAlertDialogPopup.displayName = "GummyAlertDialogPopup";
GummyAlertDialogTitle.displayName = "GummyAlertDialogTitle";
GummyAlertDialogDescription.displayName = "GummyAlertDialogDescription";
