"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const GummyAlertDialog = AlertDialog.Root;

export type GummyAlertDialogPortalProps = React.ComponentPropsWithoutRef<
  typeof AlertDialog.Portal
> & { keepMounted?: boolean };

export function GummyAlertDialogPortal({
  keepMounted,
  ...props
}: GummyAlertDialogPortalProps) {
  void keepMounted;
  return <AlertDialog.Portal {...props} />;
}

export const GummyAlertDialogTrigger = React.forwardRef<
  React.ElementRef<typeof AlertDialog.Trigger>,
  React.ComponentPropsWithoutRef<typeof AlertDialog.Trigger>
>(function GummyAlertDialogTrigger({ className, ...props }, ref) {
  return (
    <AlertDialog.Trigger
      {...props}
      ref={ref}
      className={joinClassNames("gummy-overlay-trigger", className)}
    />
  );
});

export const GummyAlertDialogBackdrop = React.forwardRef<
  React.ElementRef<typeof AlertDialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialog.Overlay>
>(function GummyAlertDialogBackdrop({ className, ...props }, ref) {
  return (
    <AlertDialog.Overlay
      {...props}
      ref={ref}
      className={joinClassNames("gummy-overlay-backdrop", className)}
    />
  );
});

export const GummyAlertDialogViewport = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function GummyAlertDialogViewport({ className, ...props }, ref) {
  return (
    <div
      {...props}
      ref={ref}
      className={joinClassNames("gummy-overlay-viewport", className)}
    />
  );
});

export const GummyAlertDialogPopup = React.forwardRef<
  React.ElementRef<typeof AlertDialog.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialog.Content>
>(function GummyAlertDialogPopup({ className, children, ...props }, ref) {
  return (
    <AlertDialog.Content
      {...props}
      ref={ref}
      className={joinClassNames(
        "gummy-overlay-popup gummy-alert-dialog__popup",
        className,
      )}
    >
      <span className="gummy-overlay-popup__reservoir" aria-hidden="true" />
      {children}
    </AlertDialog.Content>
  );
});

export const GummyAlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialog.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialog.Title>
>(function GummyAlertDialogTitle({ className, ...props }, ref) {
  return (
    <AlertDialog.Title
      {...props}
      ref={ref}
      className={joinClassNames("gummy-overlay-popup__title", className)}
    />
  );
});

export const GummyAlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialog.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialog.Description>
>(function GummyAlertDialogDescription({ className, ...props }, ref) {
  return (
    <AlertDialog.Description
      {...props}
      ref={ref}
      className={joinClassNames("gummy-overlay-popup__description", className)}
    />
  );
});

export const GummyAlertDialogClose = AlertDialog.Cancel;
export const GummyAlertDialogAction = AlertDialog.Action;

GummyAlertDialogTrigger.displayName = "GummyAlertDialogTrigger";
GummyAlertDialogBackdrop.displayName = "GummyAlertDialogBackdrop";
GummyAlertDialogViewport.displayName = "GummyAlertDialogViewport";
GummyAlertDialogPopup.displayName = "GummyAlertDialogPopup";
GummyAlertDialogTitle.displayName = "GummyAlertDialogTitle";
GummyAlertDialogDescription.displayName = "GummyAlertDialogDescription";
