"use client";

import { Dialog } from "@base-ui/react/dialog";
import * as React from "react";

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const GummyDialog = Dialog.Root;
export const GummyDialogPortal = Dialog.Portal;

export const GummyDialogTrigger = React.forwardRef<
  HTMLButtonElement,
  Dialog.Trigger.Props
>(function GummyDialogTrigger({ className, children, ...props }, ref) {
  return (
    <Dialog.Trigger {...props} ref={ref} className={joinClassNames("gummy-dialog__trigger", className as string)}>
      <span className="gummy-dialog__trigger-copy">{children}</span>
      <span className="gummy-dialog__trigger-pool" aria-hidden="true" />
    </Dialog.Trigger>
  );
});

export const GummyDialogBackdrop = React.forwardRef<
  HTMLDivElement,
  Dialog.Backdrop.Props
>(function GummyDialogBackdrop({ className, ...props }, ref) {
  return <Dialog.Backdrop {...props} ref={ref} className={joinClassNames("gummy-dialog__backdrop", className as string)} />;
});

export const GummyDialogViewport = React.forwardRef<
  HTMLDivElement,
  Dialog.Viewport.Props
>(function GummyDialogViewport({ className, ...props }, ref) {
  return <Dialog.Viewport {...props} ref={ref} className={joinClassNames("gummy-dialog__viewport", className as string)} />;
});

export const GummyDialogPopup = React.forwardRef<
  HTMLDivElement,
  Dialog.Popup.Props
>(function GummyDialogPopup({ className, children, ...props }, ref) {
  return (
    <Dialog.Popup {...props} ref={ref} className={joinClassNames("gummy-dialog__popup", className as string)}>
      <span className="gummy-dialog__reservoir gummy-dialog__reservoir--start" aria-hidden="true" />
      <span className="gummy-dialog__reservoir gummy-dialog__reservoir--end" aria-hidden="true" />
      <div className="gummy-dialog__plane">{children}</div>
    </Dialog.Popup>
  );
});

export const GummyDialogTitle = React.forwardRef<
  HTMLHeadingElement,
  Dialog.Title.Props
>(function GummyDialogTitle({ className, ...props }, ref) {
  return <Dialog.Title {...props} ref={ref} className={joinClassNames("gummy-dialog__title", className as string)} />;
});

export const GummyDialogDescription = React.forwardRef<
  HTMLParagraphElement,
  Dialog.Description.Props
>(function GummyDialogDescription({ className, ...props }, ref) {
  return <Dialog.Description {...props} ref={ref} className={joinClassNames("gummy-dialog__description", className as string)} />;
});

export const GummyDialogClose = React.forwardRef<
  HTMLButtonElement,
  Dialog.Close.Props
>(function GummyDialogClose({ className, ...props }, ref) {
  return <Dialog.Close {...props} ref={ref} className={joinClassNames("gummy-dialog__close", className as string)} />;
});

export function GummyDialogSurface({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div aria-hidden="true" className={joinClassNames("gummy-dialog__popup", "gummy-dialog__popup--preview", className)}>
      <span className="gummy-dialog__reservoir gummy-dialog__reservoir--start" aria-hidden="true" />
      <span className="gummy-dialog__reservoir gummy-dialog__reservoir--end" aria-hidden="true" />
      <div className="gummy-dialog__plane">{children}</div>
    </div>
  );
}

GummyDialogTrigger.displayName = "GummyDialogTrigger";
GummyDialogBackdrop.displayName = "GummyDialogBackdrop";
GummyDialogViewport.displayName = "GummyDialogViewport";
GummyDialogPopup.displayName = "GummyDialogPopup";
GummyDialogTitle.displayName = "GummyDialogTitle";
GummyDialogDescription.displayName = "GummyDialogDescription";
GummyDialogClose.displayName = "GummyDialogClose";
